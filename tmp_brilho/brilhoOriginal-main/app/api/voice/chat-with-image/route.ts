import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const message = formData.get('message') as string
    const imageFile = formData.get('image') as File
    const companyData = JSON.parse(formData.get('companyData') as string || '{}')
    const companyName = formData.get('companyName') as string
    const mode = formData.get('mode') as string || 'text'
    const webSearchEnabled = formData.get('webSearchEnabled') === 'true'

    if (!message && !imageFile) {
      return NextResponse.json(
        { success: false, error: 'Mensagem ou imagem deve ser fornecida' },
        { status: 400 }
      )
    }

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'Imagem não fornecida' },
        { status: 400 }
      )
    }

    // Converter imagem para base64
    const imageBuffer = await imageFile.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')
    const imageMimeType = imageFile.type

    // Prompt especializado para análise de imagens em branding
    const modeInstructions = mode === 'voice' 
      ? 'Você está conversando por voz com um empresário em tempo real. Seja conciso, direto e conversacional.'
      : 'Você está conversando por texto com um empresário. Pode ser mais detalhado e usar formatação se necessário.'

    const webSearchInstructions = webSearchEnabled 
      ? 'Você tem acesso à busca na web para informações atualizadas. Use quando necessário para fornecer dados recentes, tendências de mercado, exemplos de campanhas ou qualquer informação que possa estar desatualizada.'
      : ''

    const systemPrompt = `Você é um consultor especialista em branding e estratégia de marca da BrandPlot, uma das principais consultorias de branding do Brasil. ${modeInstructions} ${webSearchInstructions}

${companyData ? `
INFORMAÇÕES DA EMPRESA:
Nome: ${companyName}
Dados disponíveis: ${JSON.stringify(companyData, null, 2)}
` : `
EMPRESA EM ANÁLISE: ${companyName}
`}

ESPECIALIZAÇÃO EM ANÁLISE VISUAL:
• Análise de identidade visual e elementos de design
• Avaliação de logos, paletas de cores, tipografia
• Análise de materiais de marketing e comunicação visual
• Comparação com tendências e benchmarks do mercado
• Sugestões de melhorias e otimizações visuais

PERFIL PROFISSIONAL:
• Mais de 15 anos de experiência em branding, identidade visual, posicionamento e estratégia  
• Especialista em psicologia do consumidor e comportamento de marca  
• Atuação com startups, PMEs e grandes corporações  
• Foco em resultados de negócio e crescimento sustentável  

METODOLOGIA DE ANÁLISE VISUAL:
1. Descrever os elementos visuais presentes
2. Avaliar a coerência com a estratégia de marca
3. Identificar pontos fortes e oportunidades de melhoria
4. Sugerir ações práticas e implementáveis
5. Comparar com padrões do mercado quando relevante

DIRETRIZES IMPORTANTES:
• Sempre responda em português brasileiro  
• Mantenha o foco em impacto e resultados de negócio  
• Seja específico sobre elementos visuais observados
• Forneça feedback construtivo e acionável
• Utilize frameworks e ferramentas reconhecidas no mercado  
• Seja consultivo e personalizado conforme o perfil do empresário  
${mode === 'voice' ? '• Mantenha respostas entre 2-4 frases para conversação fluida' : '• Pode fornecer respostas mais detalhadas quando necessário'}
${webSearchEnabled ? '• Quando usar busca na web, cite as fontes e indique que as informações são atualizadas' : ''}

Você é o consultor visual que o empresário deseja ter ao lado para fortalecer sua marca e escalar o negócio. `

    // Usar Responses API com web search se habilitado
    const tools = webSearchEnabled ? [
      {
        type: "web_search_preview" as const,
        user_location: {
          type: "approximate" as const,
          country: "BR"
        },
        search_context_size: "medium" as const
      }
    ] : undefined

    const completion = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: systemPrompt
        },        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: message || "Analise esta imagem do ponto de vista de branding e design."
            },
            {
              type: "input_image",
              image_url: `data:${imageMimeType};base64,${imageBase64}`,
              detail: "high"
            }
          ]
        }
      ],      tools: tools,
      text: {
        format: {
          type: "text"
        }
      },
      max_output_tokens: mode === 'voice' ? 400 : 800,
      temperature: 0.7,    })

    const assistantResponse = completion.output_text

    if (!assistantResponse) {
      return NextResponse.json(
        { success: false, error: 'Erro ao gerar resposta' },
        { status: 500 }
      )
    }

    // Na Responses API, verificar se houve web search pelos output items
    const hasWebSearchCall = completion.output?.some((item: any) => 
      item.type === "web_search_call"
    )

    // Verificar se há anotações de URL nos output items de mensagem
    const hasUrlCitations = completion.output?.some((item: any) => 
      item.type === "message" && 
      item.content?.[0]?.annotations?.some((annotation: any) => 
        annotation.type === "url_citation"
      )
    )

    const webSearchUsed = webSearchEnabled && (hasWebSearchCall || hasUrlCitations)

    return NextResponse.json({
      success: true,
      text: assistantResponse,
      webSearchUsed: webSearchUsed
    })

  } catch (error) {
    console.error('Erro no endpoint de chat com imagem:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 