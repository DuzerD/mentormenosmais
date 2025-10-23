import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, companyName, mode = 'voice', webSearchEnabled = false, contextEnhancedEnabled = true } = await request.json()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Mensagem não fornecida' },
        { status: 400 }
      )
    }

    // Buscar o idUnico da empresa no cache ou localStorage (como no chat page)
    let idUnico = null
    const headers = request.headers
    const userAgent = headers.get('user-agent') || ''
    
    // Verificar se há idUnico nos headers ou tentar extrair do companyName
    if (companyName && companyName !== "Sua Marca") {
      idUnico = `${companyName.toLowerCase().replace(/\s+/g, '')}-brandplot`
    }

    console.log('[CHAT] Iniciando chat com configuração:', {
      companyName,
      idUnico,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      webSearchEnabled,
      contextEnhancedEnabled,
      messageLength: message.length
    })

    // Prompt especializado e otimizado para branding da BrandPlot
    const modeInstructions = mode === 'voice' 
      ? 'Você está conversando por voz com um empresário em tempo real. Seja conciso, direto e conversacional.'
      : 'Você está conversando por texto com um empresário. Pode ser mais detalhado e usar formatação se necessário.'

    const webSearchInstructions = webSearchEnabled 
      ? 'Você tem acesso à busca na web para informações atualizadas. Use quando necessário para fornecer dados recentes, tendências de mercado, exemplos de campanhas ou qualquer informação que possa estar desatualizada.'
      : ''

    const systemPrompt = `Você é um consultor especialista em branding e estratégia de marca da BrandPlot, uma das principais consultorias de branding do Brasil. ${modeInstructions} ${webSearchInstructions}

EMPRESA EM ANÁLISE: ${companyName}
${idUnico ? `ID da Empresa: ${idUnico}` : ''}

FERRAMENTAS DISPONÍVEIS:
• Contexto Aprimorado: ${contextEnhancedEnabled ? '(ATIVO) Para acessar dados detalhados da empresa (diagnósticos, contexto, estratégias)' : '(INATIVO) Dados específicos da empresa não disponíveis'}
• Busca na Web: Para informações atualizadas do mercado ${webSearchEnabled ? '(ATIVA)' : '(INATIVA)'}

PERFIL PROFISSIONAL:
• Mais de 15 anos de experiência em branding, identidade visual, posicionamento e estratégia  
• Especialista em psicologia do consumidor e comportamento de marca  
• Atuação com startups, PMEs e grandes corporações  
• Foco em resultados de negócio e crescimento sustentável  

ÁREAS DE ATUAÇÃO:
1. Identidade Visual: logo, paleta de cores, tipografia e elementos gráficos  
2. Posicionamento: diferenciação, proposta de valor e território de marca  
3. Estratégia: arquitetura de marca, portfólio e extensões  
4. Comunicação: tom de voz, messaging e personalidade  
5. Experiência: jornada do cliente e pontos de contato  
6. Análise: pesquisa de mercado, concorrência e personas  

METODOLOGIA DE RESPOSTA:
1. **SEMPRE verificar dados da empresa**: Para perguntas sobre diagnóstico, estratégia, contexto, pontuação ou qualquer informação específica da empresa, você DEVE usar a função buscar_dados_empresa
2. **Utilizar contexto encontrado**: Base sua resposta nos dados retornados pela busca semântica
3. **Reconhecer a pergunta** com empatia  
4. **Fornecer insights práticos** e acionáveis baseados nos dados encontrados
5. **Citar exemplos brasileiros** ou casos de sucesso relevantes  
6. **Sugerir próximos passos** claros e realizáveis  
7. **Finalizar com uma pergunta** para aprofundar, quando pertinente  

REGRAS CRÍTICAS:
• Sempre responda em português brasileiro  
• Mantenha o foco em impacto e resultados de negócio  
${contextEnhancedEnabled 
  ? '• OBRIGATÓRIO: Use a busca semântica quando perguntado sobre dados da empresa\n• Quando usar dados da busca, mencione que são baseados no diagnóstico/análise da empresa\n• Se não encontrar dados específicos, seja transparente sobre isso'
  : '• IMPORTANTE: Contexto aprimorado está DESABILITADO - você não tem acesso aos dados específicos da empresa\n• Base suas respostas em conhecimento geral de branding\n• Seja transparente que não tem acesso aos dados específicos desta empresa'
}
• Utilize frameworks e ferramentas reconhecidas no mercado  
• Seja consultivo e personalizado conforme o perfil do empresário  
${mode === 'voice' ? '• Mantenha respostas entre 2-4 frases para conversação fluida' : '• Pode fornecer respostas mais detalhadas quando necessário'}
${webSearchEnabled ? '• Quando usar busca na web, cite as fontes e indique que as informações são atualizadas' : ''}

QUANDO USAR BUSCA SEMÂNTICA:
• Perguntas sobre diagnóstico, pontuação ou análise da empresa
• Questões sobre estratégia, posicionamento ou contexto de mercado da empresa
• Solicitações de insights baseados nos dados coletados
• Comparações ou análises que requerem informações específicas da empresa

Você é o consultor que o empresário deseja ter ao lado para fortalecer sua marca e escalar o negócio.`

    // Ferramentas disponíveis para function calling
    const tools = []
    
    // Adicionar busca semântica apenas se contexto aprimorado estiver habilitado
    if (contextEnhancedEnabled) {
      tools.push({
        type: "function" as const,
        function: {
          name: "buscar_dados_empresa",
          description: "OBRIGATÓRIO usar para responder perguntas sobre: diagnóstico da empresa, contexto de mercado, pontuação/score, estratégias, análise de marca, ou qualquer informação específica sobre a empresa em questão. Esta ferramenta acessa dados reais do diagnóstico realizado.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Termos específicos de busca relacionados à pergunta do usuário (ex: 'diagnóstico completo', 'estratégia posicionamento', 'contexto mercado', 'pontuação marca')"
              },
              empresa_especifica: {
                type: "boolean", 
                description: "Se true, busca apenas dados desta empresa específica. Se false, faz busca semântica geral."
              }
            },
            required: ["query"]
          }
        }
      })
    }

    console.log('[CHAT] Tools configuradas:', {
      toolsCount: tools.length,
      contextEnhancedEnabled,
      toolsAvailable: tools.map(t => t.function.name)
    })

    // Primeira chamada para identificar se precisa de function calling
    const initialCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: message
        }
      ],
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? "auto" : undefined,
      max_tokens: mode === 'voice' ? 400 : 800,
      temperature: 0.7,
    })

    let finalResponse = initialCompletion.choices[0].message.content
    let semanticSearchUsed = false
    let webSearchUsed = false

    // Processar function calls se houver
    const toolCalls = initialCompletion.choices[0].message.tool_calls
    if (toolCalls && toolCalls.length > 0) {
      const messages: any[] = [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        },
        {
          role: "assistant",
          content: initialCompletion.choices[0].message.content,
          tool_calls: toolCalls
        }
      ]

      for (const toolCall of toolCalls) {
        if (toolCall.function.name === "buscar_dados_empresa") {
          semanticSearchUsed = true
          console.log('[CHAT] Function call detectada:', toolCall)
          
          try {
            const args = JSON.parse(toolCall.function.arguments)
            const searchQuery = args.query
            const empresaEspecifica = args.empresa_especifica !== false // default true
            
            console.log(`[CHAT] Executando busca semântica: "${searchQuery}"`)
            
            // Fazer busca semântica
            const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/semantic-search`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: searchQuery,
                idUnico: empresaEspecifica ? idUnico : undefined,
                limit: empresaEspecifica ? 1 : 3
              })
            })

            let toolResult = "Nenhum dado encontrado."
            if (searchResponse.ok) {
              const searchResult = await searchResponse.json()
              console.log(`[CHAT] Busca retornou ${searchResult.results?.length || 0} resultados`)
              
              if (searchResult.success && searchResult.results?.length > 0) {
                const contextData = searchResult.results.map((r: any) => ({
                  empresa: r.empresa,
                  contexto: r.contexto?.substring(0, 1500) || 'N/A',
                  diagnostico: typeof r.diagnostico === 'string' ? r.diagnostico.substring(0, 1500) : 'N/A',
                  score: r.scoreDiagnostico,
                  similarity: Math.round(r.similarity * 100) + '%',
                  respostas_principais: r.respostas?.slice(0, 3) || []
                }))
                
                toolResult = `DADOS ENCONTRADOS PARA A EMPRESA:
${JSON.stringify(contextData, null, 2)}

INSTRUÇÕES: Use estes dados como base para sua resposta. Mencione que as informações vêm do diagnóstico/análise da empresa.`
                
                console.log('[CHAT] Contexto preparado para o modelo:', toolResult.substring(0, 500) + '...')
              }
            }

            // Adicionar resultado da function call
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: toolResult
            })

          } catch (functionError) {
            console.error('[CHAT] Erro ao processar function call:', functionError)
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: "Erro ao buscar dados da empresa."
            })
          }
        }
      }

      // Fazer segunda chamada com os resultados das functions
      console.log('[CHAT] Fazendo segunda chamada ao OpenAI com contexto da busca semântica')
      const finalCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: mode === 'voice' ? 400 : 800,
        temperature: 0.7,
      })

      finalResponse = finalCompletion.choices[0].message.content
      console.log('[CHAT] Resposta final gerada com contexto:', finalResponse?.substring(0, 200) + '...')
    }

    // Se busca na web estiver habilitada e não foi usada function call, usar Responses API
    if (webSearchEnabled && !semanticSearchUsed) {
      try {
        const webCompletion = await openai.responses.create({
          model: "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: message
            }
          ],
          tools: [{
            type: "web_search_preview" as const,
            user_location: {
              type: "approximate" as const,
              country: "BR"
            },
            search_context_size: "medium" as const
          }],
          text: {
            format: {
              type: "text"
            }
          },
          max_output_tokens: mode === 'voice' ? 400 : 800,
          temperature: 0.7,
        })

        if (webCompletion.output_text) {
          finalResponse = webCompletion.output_text
          
          // Verificar se web search foi usada
          const hasWebSearchCall = webCompletion.output?.some((item: any) => 
            item.type === "web_search_call"
          )
          const hasUrlCitations = webCompletion.output?.some((item: any) => 
            item.type === "message" && 
            item.content?.[0]?.annotations?.some((annotation: any) => 
              annotation.type === "url_citation"
            )
          )
          webSearchUsed = hasWebSearchCall || hasUrlCitations
        }
      } catch (webError) {
        console.error('[CHAT] Erro na busca web:', webError)
        // Manter a resposta original se web search falhar
      }
    }

    console.log('[CHAT] Resultado final:', {
      webSearchEnabled,
      webSearchUsed,
      semanticSearchUsed,
      responseLength: finalResponse?.length || 0
    })

    return NextResponse.json({
      success: true,
      response: finalResponse || 'Desculpe, não consegui gerar uma resposta.',
      text: finalResponse || 'Desculpe, não consegui gerar uma resposta.', // Manter compatibilidade
      webSearchUsed: webSearchUsed,
      semanticSearchUsed: semanticSearchUsed
    })

  } catch (error) {
    console.error('Erro no endpoint de chat:', error)
    console.error('Stack trace:', (error as Error)?.stack)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: (error as Error)?.message || 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
} 