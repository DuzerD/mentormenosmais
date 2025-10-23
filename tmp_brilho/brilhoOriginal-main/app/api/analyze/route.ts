import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenAI } from '@google/genai'
import { getRealIP, checkRateLimit } from "@/lib/rate-limiter"
import { processEmbeddingInBackground } from "../embedding/route"

// Função assíncrona para buscar contexto da empresa usando Responses API
async function fetchCompanyContext(companyName: string, idUnico: string, supabase: any) {
  try {
    // Inicializar cliente OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`Buscando contexto para empresa: ${companyName}`);

    // Usar a SDK oficial do OpenAI para Responses API
    const response = await openai.responses.create({
      model: "gpt-4.1-mini", // Modelo correto
      tools: [{
        type: "web_search_preview",
        search_context_size: "medium" 
      }],
      input: `Você é um especialista em análise de marcas e empresas. Pesquise informações atualizadas sobre a empresa "${companyName}" e crie um relatório de contexto abrangente incluindo:

1. **Visão geral da empresa e setor**: O que a empresa faz, em que setor atua, quando foi fundada
2. **Posicionamento de marca**: Como ela se posiciona no mercado, missão e valores  
3. **Público-alvo**: Quem são seus clientes típicos
4. **Principais concorrentes**: Empresas similares no mercado
5. **Características do setor**: Tendências e desafios do mercado
6. **Presença digital**: Website, redes sociais, estratégia digital
7. **Notícias recentes**: Novidades, lançamentos, parcerias

**Importante**: Busque informações reais e atualizadas sobre esta empresa. Se não encontrar informações específicas, forneça uma análise baseada no nome e setor provável.`
    });

    // Extrair o contexto da resposta usando a estrutura correta
    let contexto = null;
    
    // Verificar se existe output_text diretamente na resposta
    if ((response as any).output_text) {
      contexto = (response as any).output_text;
    } else if (response.output && Array.isArray(response.output)) {
      // Procurar por mensagem do assistente no array de output
      const messageOutput = response.output.find((output: any) => 
        output.type === 'message' && output.role === 'assistant'
      );
      
      if (messageOutput && (messageOutput as any).content && Array.isArray((messageOutput as any).content)) {
        // Encontrar o conteúdo de texto na mensagem
        const textContent = (messageOutput as any).content.find((content: any) => 
          content.type === 'output_text' && content.text
        );
        
        if (textContent && textContent.text) {
          contexto = textContent.text;
        }
      }
    }
    
    if (contexto) {
      console.log("Contexto extraído com sucesso, atualizando no Supabase...");
      
      // Atualizar o registro no Supabase com o contexto obtido
      const { error: updateError } = await supabase
        .from("brandplot")
        .update({ contexto: contexto })
        .eq("idUnico", idUnico);

      if (updateError) {
        console.error("Erro ao atualizar contexto no Supabase:", updateError);
      } else {
        console.log("Contexto salvo com sucesso no Supabase");
      }
    } else {
      console.error("Não foi possível extrair o contexto da resposta");
      console.log("Estrutura da resposta:", JSON.stringify(response, null, 2));
    }

  } catch (error) {
    console.error("Erro na busca de contexto da empresa:", error);
    
    // Log mais detalhado do erro
    if (error instanceof Error) {
      console.error("Mensagem do erro:", error.message);
      console.error("Stack trace:", error.stack);
    }
  }
}

/**
 * Busca contexto da empresa usando Gemini (Google GenAI) com Google Search
 */
async function fetchCompanyContextGemini(companyName: string, idUnico: string, supabase: any, bioBtImageUrl?: string) {
  try {
    console.log(`[GEMINI] Iniciando busca de contexto para: ${companyName} (ID: ${idUnico})`)
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('[GEMINI] API Key não configurada')
      return
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    
    console.log('[GEMINI] Cliente GoogleGenAI criado com sucesso')
    
    const tools = [{ googleSearch: {} }];
    const config = {
      tools,
      responseMimeType: 'text/plain',
    };
    const model = 'gemini-2.5-flash-preview-04-17';
    
    console.log(`[GEMINI] Configuração: modelo=${model}, tools=googleSearch`)
    
    // Preparar as partes do conteúdo
    const contentParts = [];
    
    // Adicionar a imagem da bio se fornecida
    if (bioBtImageUrl) {
      try {
        // Fetch da imagem para converter em base64
        const imageResponse = await fetch(bioBtImageUrl);
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          const imageBase64 = Buffer.from(imageBuffer).toString('base64');
          
          // Detectar o tipo MIME da imagem
          const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
          
          contentParts.push({
            inlineData: {
              data: imageBase64,
              mimeType: mimeType
            }
          });
        }
      } catch (imageError) {
        console.warn('Erro ao processar imagem da bio:', imageError);
      }
    }
    
    // Adicionar o prompt de texto
    const textPrompt = bioBtImageUrl 
      ? `Você é um especialista em análise de marcas e empresas. Analise tanto a imagem da bio do Instagram fornecida quanto pesquise informações atualizadas sobre a empresa "${companyName}" e crie um relatório de contexto abrangente incluindo:

1. **Análise da Bio do Instagram**: Analise a imagem da bio fornecida - identifique o nome da conta, biografia, número de seguidores, seguindo, posts, estilo visual, cores predominantes, tipo de conteúdo mostrado
2. **Visão geral da empresa e setor**: O que a empresa faz, em que setor atua, quando foi fundada
3. **Posicionamento de marca**: Como ela se posiciona no mercado, missão e valores comparados com o que vemos na bio
4. **Público-alvo**: Quem são seus clientes típicos baseado na presença digital
5. **Principais concorrentes**: Empresas similares no mercado
6. **Características do setor**: Tendências e desafios do mercado
7. **Presença digital**: Análise da estratégia digital baseada na bio e pesquisas
8. **Notícias recentes**: Novidades, lançamentos, parcerias
9. **Recomendações**: Sugestões de melhoria para a bio e estratégia digital baseadas na análise

**Importante**: Combine as informações da imagem da bio com pesquisas atualizadas sobre esta empresa. Se não encontrar informações específicas sobre a empresa, forneça uma análise baseada no que é visível na bio e no setor provável.`
      : `Você é um especialista em análise de marcas e empresas. Pesquise informações atualizadas sobre a empresa "${companyName}" e crie um relatório de contexto abrangente incluindo:

1. **Visão geral da empresa e setor**: O que a empresa faz, em que setor atua, quando foi fundada
2. **Posicionamento de marca**: Como ela se posiciona no mercado, missão e valores  
3. **Público-alvo**: Quem são seus clientes típicos
4. **Principais concorrentes**: Empresas similares no mercado
5. **Características do setor**: Tendências e desafios do mercado
6. **Presença digital**: Website, redes sociais, estratégia digital
7. **Notícias recentes**: Novidades, lançamentos, parcerias

**Importante**: Busque informações reais e atualizadas sobre esta empresa. Se não encontrar informações específicas, forneça uma análise baseada no nome e setor provável.`;
    
    contentParts.push({
      text: textPrompt
    });

    const contents = [
      {
        role: 'user',
        parts: contentParts
      },
    ];
    
    console.log('[GEMINI] Enviando requisição para o modelo...')
    
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });
    
    console.log('[GEMINI] Resposta recebida, processando stream...')
    
    let contexto = '';
    let chunkCount = 0;
    for await (const chunk of response) {
      contexto += chunk.text;
      chunkCount++;
    }
    
    console.log(`[GEMINI] Stream processado: ${chunkCount} chunks, ${contexto.length} caracteres`)
    
    if (contexto && contexto.length > 0) {
      console.log(`[GEMINI] Salvando contexto no banco (${contexto.substring(0, 100)}...)`)
      
      // Atualizar o registro no Supabase com o contexto obtido
      const { error: updateError } = await supabase
        .from('brandplot')
        .update({ contexto: contexto })
        .eq('idUnico', idUnico);
      if (updateError) {
        console.error('[GEMINI] Erro ao atualizar contexto no Supabase:', updateError);
      } else {
        console.log('[GEMINI] Contexto salvo com sucesso no Supabase');
        
        // *** CHAMADA ASSÍNCRONA PARA EMBEDDING APÓS CONTEXTO SALVO ***
        console.log('[GEMINI] Iniciando processo de embedding...');
        processEmbeddingInBackground(idUnico, contexto)
          .catch((error: any) => {
            console.error('[GEMINI] Erro ao processar embedding:', error);
          });
      }
    } else {
      console.error('[GEMINI] Contexto vazio ou inválido');
    }
  } catch (error) {
    console.error('[GEMINI] Erro na busca de contexto da empresa:', error);
    if (error instanceof Error) {
      console.error('[GEMINI] Mensagem do erro:', error.message);
      console.error('[GEMINI] Stack trace:', error.stack);
    }
    
    // Log adicional para erros específicos do Gemini
    if (error && typeof error === 'object') {
      console.error('[GEMINI] Detalhes do erro:', JSON.stringify(error, null, 2));
    }
  }
}

export async function POST(request: Request) {
  try {
    // Rate limiting: verificar se o IP excedeu o limite de requisições
    const clientIP = getRealIP(request)
    const rateLimitResult = checkRateLimit(clientIP)
    
    if (!rateLimitResult.allowed) {
      const resetDate = new Date(rateLimitResult.resetTime)
      const remainingTimeMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / (1000 * 60))
      
      console.log(`Rate limit excedido para IP ${clientIP}. Reset em: ${resetDate.toISOString()}`)
      
      return NextResponse.json({ 
        error: "Limite de diagnósticos excedido", 
        message: `Você já criou 3 diagnósticos. Tente novamente em ${remainingTimeMinutes} minutos.`,
        resetTime: rateLimitResult.resetTime,
        rateLimitExceeded: true
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
        }
      })
    }
    
    console.log(`Requisição permitida para IP ${clientIP}. Requisições restantes: ${rateLimitResult.remaining}`)
    
    const body = await request.json()
    const { idUnico, bioBtImageUrl, answers } = body
    
    // Configuração do Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://znkfwlpgsxxawucacmda.supabase.co"
    const supabaseKey = process.env.SUPABASE_KEY
    if (!supabaseKey) {
      return NextResponse.json({ error: "Supabase key não configurada" }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, supabaseKey as string)

    // FLUXO 1: ONBOARDING - Análise inicial das respostas
    if (answers && Array.isArray(answers)) {
      console.log("Fluxo de onboarding - processando respostas:", answers)
      
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "OpenAI API key não configurada" }, { status: 500 })
      }
      
      // Extrair nome da empresa das respostas
      const companyName = answers[0] || "Empresa sem nome"
      
      // Gerar ID único
      const generatedIdUnico = `${companyName.toLowerCase().replace(/\s+/g, '')}-brandplot`
      
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      // Criar prompt para análise inicial (truncar respostas longas)
      const truncateText = (text: string, maxLength: number = 500) => {
        if (!text) return 'N/A'
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
      }

      const prompt = `Analise as respostas do questionário de marca:

RESPOSTAS:
1. Empresa: ${truncateText(answers[0])}
2. Setor: ${truncateText(answers[1])}
3. Motivação: ${truncateText(answers[2])}
4. Público atual: ${truncateText(answers[3])}
5. Público ideal: ${truncateText(answers[4])}
6. Percepção atual: ${truncateText(answers[5])}
7. Percepção desejada: ${truncateText(answers[6])}
8. Desafios: ${truncateText(answers[7])}
9. Objetivo: ${truncateText(answers[8])}
10. Contato: ${truncateText(answers[9])} `

      try {
        // Criar thread e enviar mensagem
        const thread = await openai.beta.threads.create()
        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: prompt
        })
        
        // Executar o Assistant de Onboarding
        const run = await openai.beta.threads.runs.create(thread.id, {
          assistant_id: "asst_m1fio8b1sD3HyVL4KTBwbtzr",
          tools: [
            { type: "file_search" }
          ]
        })
        
        // Aguardar conclusão
        let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
        while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
          await new Promise(resolve => setTimeout(resolve, 1000))
          runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
        }
        
        if (runStatus.status !== 'completed') {
          throw new Error("Falha ao gerar análise")
        }
        
        // Buscar resposta
        const messages = await openai.beta.threads.messages.list(thread.id)
        const assistantMessage = messages.data.find(msg => msg.role === 'assistant')
        if (!assistantMessage || !assistantMessage.content || !assistantMessage.content[0]) {
          throw new Error("Nenhuma análise gerada")
        }
        
        const analysis = (assistantMessage.content[0] as any).text?.value
        if (!analysis) {
          throw new Error("Resposta vazia do assistant")
        }

        // Extrair score da análise
        let extractedScore = "75" // Score padrão
        
        try {
          // Tentar extrair score se a análise for JSON
          if (analysis.trim().startsWith("{")) {
            const jsonAnalysis = JSON.parse(analysis)
            if (jsonAnalysis.score_interno) {
              extractedScore = jsonAnalysis.score_interno.toString()
              console.log("Score extraído do JSON:", extractedScore)
            } else if (jsonAnalysis.score_ui) {
              extractedScore = jsonAnalysis.score_ui.toString()
              console.log("Score UI extraído do JSON:", extractedScore)
            }
          } else {
            // Tentar extrair score de texto (formato: "Nota de Clareza & Emoção da Marca: XX/100")
            const scoreMatch = analysis.match(/Nota de Clareza & Emoção da Marca[:\s]*(\d+)\/100/)
            if (scoreMatch && scoreMatch[1]) {
              extractedScore = scoreMatch[1]
              console.log("Score extraído do texto:", extractedScore)
            }
          }
        } catch (parseError) {
          console.log("Erro ao extrair score, usando padrão:", parseError)
        }

        // Preparar dados para salvar no banco
        const insertData: any = {
          idUnico: generatedIdUnico,
          nome_empresa: companyName,
          diagnostico: analysis,
          scoreDiagnostico: extractedScore,
          created_at: new Date().toISOString()
        }

        console.log("Company name:", companyName)
        console.log("Generated idUnico:", generatedIdUnico)
        console.log("Extracted score:", extractedScore)
        console.log("Answers array:", answers)

        // Salvar as respostas nos campos correspondentes
        answers.forEach((ans: string, idx: number) => {
          if (idx >= 1 && idx <= 8) {
            insertData[`resposta_${idx}`] = ans || null
            console.log(`Salvando resposta_${idx}:`, ans)
          }
        })

        // Processar dados de contato se disponível
        if (answers[9]) {
          console.log("Processando contato:", answers[9])
          try {
            const contact = JSON.parse(answers[9])
            if (contact.email) {
              insertData.email = contact.email
              console.log("Email adicionado:", contact.email)
            }
            if (contact.phone) {
              insertData.telefone = contact.phone
              console.log("Telefone adicionado:", contact.phone)
            }
          } catch {
            // Se não for JSON, assume que é texto simples
            const contactText = answers[9]
            if (contactText.includes('@')) {
              insertData.email = contactText.trim()
              console.log("Email extraído:", contactText.trim())
            } else {
              insertData.telefone = contactText.trim()
              console.log("Telefone extraído:", contactText.trim())
            }
          }
        }

        console.log("Dados finais para inserir:", insertData)

        // Verificar se já existe um registro com esse idUnico
        const { data: existingRecord } = await supabase
          .from("brandplot")
          .select("id")
          .eq("idUnico", generatedIdUnico)
          .single()

        if (existingRecord) {
          console.log("Registro já existe, fazendo UPDATE:", existingRecord.id)
          // Se já existe, fazer UPDATE
          const { error: updateError } = await supabase
            .from("brandplot")
            .update(insertData)
            .eq("idUnico", generatedIdUnico)
          
          if (updateError) {
            console.error("Erro ao atualizar no banco:", updateError)
            return NextResponse.json({ 
              error: "Erro ao salvar dados no banco",
              details: updateError 
            }, { status: 500 })
          } else {
            console.log("Dados atualizados com sucesso!")
          }
        } else {
          console.log("Criando novo registro")
          // Se não existe, fazer INSERT
          const { error: insertError } = await supabase
            .from("brandplot")
            .insert(insertData)

          if (insertError) {
            console.error("Erro ao inserir no banco:", insertError)
            return NextResponse.json({ 
              error: "Erro ao salvar dados no banco",
              details: insertError 
            }, { status: 500 })
          } else {
            console.log("Dados inseridos com sucesso!")
          }
        }

        // *** EXECUTAR BUSCA DE CONTEXTO GEMINI DE FORMA ASSÍNCRONA APÓS DIAGNÓSTICO ***
        if (companyName && process.env.GEMINI_API_KEY) {
          console.log("Iniciando busca de contexto Gemini de forma assíncrona...")
          // Buscar contexto com Gemini de forma assíncrona (não bloqueia a resposta)
          // Isso executa internamente, mesmo que o usuário saia da página
          setImmediate(() => {
            fetchCompanyContextGemini(companyName, generatedIdUnico, supabase, bioBtImageUrl)
              .catch((error: any) => {
                console.error("Erro na busca de contexto Gemini no onboarding:", error)
              })
          })
        } else {
          console.log("Busca de contexto Gemini pulada - Gemini API Key:", !!process.env.GEMINI_API_KEY, "Company Name:", companyName)
        }

        return NextResponse.json({ 
          success: true, 
          analysis,
          idUnico: generatedIdUnico,
          scoreDiagnostico: extractedScore
        }, {
          headers: {
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        })
        
      } catch (error) {
        console.error("Erro no processamento do onboarding:", error)
        return NextResponse.json({ 
          error: "Erro ao processar análise inicial" 
        }, { status: 500 })
      }
    }

    // FLUXO 2: GERAÇÃO DE ESTRATÉGIA - Requer idUnico
    if (!idUnico) {
      return NextResponse.json({ error: "idUnico é obrigatório para gerar estratégia" }, { status: 400 })
    }

    // Buscar diagnóstico do usuário
    const { data, error } = await supabase
      .from("brandplot")
      .select("diagnostico, nome_empresa")
      .eq("idUnico", idUnico)
      .single()
    if (error || !data || !data.diagnostico) {
      return NextResponse.json({ error: "Diagnóstico não encontrado" }, { status: 404 })
    }

    // Extrair nome da empresa do banco
    const companyName = data.nome_empresa || ""

    // Montar prompt para o assistant
    const prompt = `Com base no seguinte diagnóstico de marca, gere uma estratégia detalhada no formato JSON abaixo.\n\nDIAGNÓSTICO:\n${data.diagnostico}\n\nFormato de resposta esperado:\n{\n  \"marcaDesejada\": {\n    \"percepcaoDesejada\": \"\",\n    \"direcaoComunicacao\": \"\",\n    \"proximoPassoSugerido\": \"\"\n  },\n  \"reposicionamentoCriativo\": {\n    \"ideiasPraticas\": [\"\", \"\", \"\"],\n    \"novasFormasDeComunicar\": {\n      \"voz\": \"\",\n      \"estilo\": \"\",\n      \"canais\": [\"\"]\n    },\n    \"briefingVisual\": {\n      \"paleta\": \"\",\n      \"simbolos\": \"\",\n      \"estilo\": \"\"\n    }\n  },\n  \"conexaoComNovosClientes\": {\n    \"acoesParaAtrair\": [\"\"],\n    \"rituaisEComunidade\": \"\"\n  },\n  \"planoDeAcaoEstrategico\": {\n    \"pilaresConteudo\": [\"\"],\n    \"campanhas\": [\"\"],\n    \"acoesInternas\": [\"\"],\n    \"acoesExternas\": [\"\"]\n  },\n  \"calendarioEditorial\": [\n    {\n      \"semana\": \"\",\n      \"ideiasDeConteudo\": [\"\"]\n    }\n  ],\n  \"novaBioInstagram\": \"\"\n}`

    // Configuração do OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key não configurada" }, { status: 500 })
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Criar thread e enviar mensagem
    const thread = await openai.beta.threads.create()
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: prompt
    })
    
    // Executar el Assistant de Estratégia
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: "asst_BuhlDfpMgLtxqxNnMcC3alD7",
      tools: [
        { type: "file_search" }
      ]
    })

    // Aguardar conclusão do GPT Assistant
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
    }
    if (runStatus.status !== 'completed') {
      return NextResponse.json({ error: "Falha ao gerar estratégia" }, { status: 500 })
    }
    // Buscar resposta
    const messages = await openai.beta.threads.messages.list(thread.id)
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant')
    if (!assistantMessage || !assistantMessage.content || !assistantMessage.content[0]) {
      return NextResponse.json({ error: "Nenhuma resposta gerada" }, { status: 500 })
    }
    const strategyText = (assistantMessage.content[0] as any).text?.value
    if (!strategyText) {
      return NextResponse.json({ error: "Resposta vazia do assistant" }, { status: 500 })
    }
    // Parsear JSON
    let parsedStrategy
    try {
      const cleaned = strategyText.trim().replace(/^```json\s*|\s*```$/g, '')
      parsedStrategy = JSON.parse(cleaned)
    } catch (e) {
      return NextResponse.json({ error: "Erro ao parsear JSON da estratégia" }, { status: 500 })
    }
    // Salvar no banco
    await supabase
      .from("brandplot")
      .update({ estrategia: JSON.stringify(parsedStrategy) })
      .eq("idUnico", idUnico)
    // Retornar estratégia
    return NextResponse.json({ success: true, estrategia: parsedStrategy }, {
      headers: {
        'X-RateLimit-Limit': '3',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: "Erro interno no servidor", details: err?.message }, { status: 500 })
  }
}
