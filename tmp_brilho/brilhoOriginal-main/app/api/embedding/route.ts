import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"
import Typesense from 'typesense'

// Cliente Typesense
const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST!, // ou seu endpoint do Typesense
      port: process.env.TYPESENSE_PORT ? parseInt(process.env.TYPESENSE_PORT) : 443,
      protocol: process.env.TYPESENSE_PROTOCOL || 'https',
    }
  ],
  apiKey: process.env.TYPESENSE_API_KEY || '',
  connectionTimeoutSeconds: 2
})

/**
 * Gera embedding usando OpenAI e salva no Supabase + Typesense
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { idUnico, contexto } = body

    if (!idUnico || !contexto) {
      return NextResponse.json({ 
        error: "idUnico e contexto são obrigatórios" 
      }, { status: 400 })
    }

    // Configuração do Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_KEY
    if (!supabaseKey) {
      return NextResponse.json({ error: "Supabase key não configurada" }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl!, supabaseKey as string)

    // Configuração do OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key não configurada" }, { status: 500 })
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    console.log(`[EMBEDDING] Iniciando processo para idUnico: ${idUnico}`)

    // 1. Buscar dados completos do registro
    const { data: registro, error: fetchError } = await supabase
      .from("brandplot")
      .select("*")
      .eq("idUnico", idUnico)
      .single()

    if (fetchError || !registro) {
      console.error('[EMBEDDING] Erro ao buscar registro:', fetchError)
      return NextResponse.json({ 
        error: "Registro não encontrado" 
      }, { status: 404 })
    }    // 2. Preparar e limitar texto para embedding
    const truncateText = (text: string, maxLength: number = 2000) => {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }

    // Truncar contexto e diagnóstico que podem ser muito longos
    const contextoTruncado = truncateText(contexto, 50000) // Máximo 50k caracteres para contexto
    const diagnosticoTruncado = truncateText(registro.diagnostico || '', 30000) // Máximo 30k para diagnóstico
    
    const textoParaEmbedding = `
      Empresa: ${registro.nome_empresa || ''}
      Contexto: ${contextoTruncado}
      Diagnóstico: ${diagnosticoTruncado}
      Score: ${registro.scoreDiagnostico || ''}
      Email: ${registro.email || ''}
      Telefone: ${registro.telefone || ''}
      Nome Cliente: ${registro.nome_cliente || ''}
      Respostas: ${[
        registro.resposta_1,
        registro.resposta_2,
        registro.resposta_3,
        registro.resposta_4,
        registro.resposta_5,
        registro.resposta_6,
        registro.resposta_7,
        registro.resposta_8
      ].filter(Boolean).join(' | ')}
    `.trim()

    console.log(`[EMBEDDING] Texto preparado com ${textoParaEmbedding.length} caracteres`)
      // Verificar se ainda está muito longo e quebrar em chunks se necessário
    const maxTokensForEmbedding = 8000 // Limite do modelo de embedding (8192 - margem de segurança)
    let finalEmbedding: number[]

    if (textoParaEmbedding.length * 0.75 > maxTokensForEmbedding) { // Aproximação: 1 token ≈ 0.75 caracteres
      console.log(`[EMBEDDING] Texto muito longo (${Math.floor(textoParaEmbedding.length * 0.75)} tokens estimados), quebrando em chunks...`)
      
      // Quebrar em chunks menores baseado no limite de tokens do modelo de embedding
      const chunkSize = Math.floor(maxTokensForEmbedding / 0.75) // ~10k caracteres por chunk
      const chunks: string[] = []
      
      for (let i = 0; i < textoParaEmbedding.length; i += chunkSize) {
        chunks.push(textoParaEmbedding.substring(i, i + chunkSize))
      }
      
      console.log(`[EMBEDDING] Criados ${chunks.length} chunks de ~${chunkSize} caracteres cada`)
      
      // Gerar embedding para cada chunk
      const embeddings: number[][] = []
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const estimatedTokens = Math.floor(chunk.length * 0.75)
        console.log(`[EMBEDDING] Processando chunk ${i + 1}/${chunks.length} (~${estimatedTokens} tokens)`)
        
        const chunkEmbeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunk,
          encoding_format: "float"
        })
        
        embeddings.push(chunkEmbeddingResponse.data[0].embedding)
        
        // Pequena pausa entre requests para evitar rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      // Fazer a média dos embeddings
      finalEmbedding = new Array(embeddings[0].length).fill(0)
      
      for (const embedding of embeddings) {
        for (let i = 0; i < embedding.length; i++) {
          finalEmbedding[i] += embedding[i]
        }
      }
      
      // Dividir pela quantidade de embeddings para obter a média
      for (let i = 0; i < finalEmbedding.length; i++) {
        finalEmbedding[i] /= embeddings.length
      }
      
      console.log(`[EMBEDDING] Embedding médio calculado com ${finalEmbedding.length} dimensões a partir de ${embeddings.length} chunks`)
      
    } else {
      // Texto é pequeno o suficiente, gerar embedding normal
      const estimatedTokens = Math.floor(textoParaEmbedding.length * 0.75)
      console.log(`[EMBEDDING] Texto dentro do limite (~${estimatedTokens} tokens), gerando embedding único`)
      
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: textoParaEmbedding,
        encoding_format: "float"
      })
      
      finalEmbedding = embeddingResponse.data[0].embedding
      console.log(`[EMBEDDING] Embedding gerado com ${finalEmbedding.length} dimensões`)
    }// 4. Salvar embedding no Supabase
    const { error: updateError } = await supabase
      .from("brandplot")
      .update({ embedding: finalEmbedding })
      .eq("idUnico", idUnico)

    if (updateError) {
      console.error('[EMBEDDING] Erro ao salvar embedding no Supabase:', updateError)
      return NextResponse.json({ 
        error: "Erro ao salvar embedding no banco" 
      }, { status: 500 })
    }

    console.log('[EMBEDDING] Embedding salvo no Supabase com sucesso')    // 5. Preparar documento para Typesense
    // Tratar diagnostico que pode ser string JSON ou objeto
    let diagnosticoObj = {}
    try {
      if (typeof registro.diagnostico === 'string') {
        diagnosticoObj = JSON.parse(registro.diagnostico)
      } else if (typeof registro.diagnostico === 'object' && registro.diagnostico !== null) {
        diagnosticoObj = registro.diagnostico
      }
    } catch (error) {
      console.warn('[EMBEDDING] Erro ao parsear diagnóstico, usando objeto vazio:', error)
      diagnosticoObj = {}
    }

    const documentoTypesense = {
      id: registro.id?.toString() || idUnico,
      nome_empresa: registro.nome_empresa || '',
      email: registro.email || '',
      telefone: registro.telefone || '',
      nome_cliente: registro.nome_cliente || '',
      diagnostico: diagnosticoObj,
      scoreDiagnostico: parseInt(registro.scoreDiagnostico?.toString() || '0') || 0,
      contexto: contexto,
      created_at: Math.floor(new Date(registro.created_at || Date.now()).getTime() / 1000),
      embedding: finalEmbedding,
      // Adicionar todas as respostas
      ...(registro.resposta_1 && { resposta_1: registro.resposta_1 }),
      ...(registro.resposta_2 && { resposta_2: registro.resposta_2 }),
      ...(registro.resposta_3 && { resposta_3: registro.resposta_3 }),
      ...(registro.resposta_4 && { resposta_4: registro.resposta_4 }),
      ...(registro.resposta_5 && { resposta_5: registro.resposta_5 }),
      ...(registro.resposta_6 && { resposta_6: registro.resposta_6 }),
      ...(registro.resposta_7 && { resposta_7: registro.resposta_7 }),
      ...(registro.resposta_8 && { resposta_8: registro.resposta_8 })
    }

    // 6. Verificar se a coleção existe, se não, criar
    try {
      await typesenseClient.collections('empresa_dados').retrieve()
      console.log('[EMBEDDING] Coleção empresa_dados já existe')
    } catch (error) {
      console.log('[EMBEDDING] Criando coleção empresa_dados...')
        const schema = {
        name: "empresa_dados",
        enable_nested_fields: true,
        default_sorting_field: "created_at",
        fields: [
          {
            name: "id",
            type: "string" as const
          },
          {
            name: "nome_empresa", 
            type: "string" as const,
            facet: true
          },
          {
            name: "resposta_.*",
            type: "string" as const,
            optional: true
          },
          {
            name: "email",
            type: "string" as const,
            index: false
          },
          {
            name: "telefone",
            type: "string" as const,
            index: false
          },
          {
            name: "nome_cliente",
            type: "string" as const
          },
          {
            name: "diagnostico",
            type: "object" as const
          },
          {
            name: "scoreDiagnostico",
            type: "int32" as const,
            facet: true
          },
          {
            name: "contexto",
            type: "string" as const
          },
          {
            name: "created_at",
            type: "int64" as const,
            sort: true
          },
          {
            name: "embedding",
            type: "float[]" as const,
            num_dim: 1536, // OpenAI text-embedding-3-small gera 1536 dimensões
            vec_dist: "cosine" as const
          }
        ]
      }

      await typesenseClient.collections().create(schema)
      console.log('[EMBEDDING] Coleção empresa_dados criada com sucesso')
    }

    // 7. Salvar/Atualizar documento no Typesense
    try {
      await typesenseClient.collections('empresa_dados').documents().upsert(documentoTypesense)
      console.log('[EMBEDDING] Documento salvo no Typesense com sucesso')
    } catch (typesenseError) {
      console.error('[EMBEDDING] Erro ao salvar no Typesense:', typesenseError)
      return NextResponse.json({ 
        error: "Erro ao salvar no Typesense",
        details: typesenseError
      }, { status: 500 })
    }    return NextResponse.json({ 
      success: true,
      message: "Embedding gerado e salvo com sucesso",
      embeddingDimensions: finalEmbedding.length,
      idUnico: idUnico
    })

  } catch (error) {
    console.error('[EMBEDDING] Erro geral:', error)
    return NextResponse.json({ 
      error: "Erro interno no servidor",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * Função auxiliar para ser chamada internamente após o contexto Gemini
 */
export async function processEmbeddingInBackground(idUnico: string, contexto: string) {
  try {
    console.log(`[EMBEDDING_BG] Processando embedding em background para ${idUnico}`)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/embedding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idUnico, contexto })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[EMBEDDING_BG] Erro na requisição:', errorData)
    } else {
      const result = await response.json()
      console.log('[EMBEDDING_BG] Embedding processado com sucesso:', result)
    }
  } catch (error) {
    console.error('[EMBEDDING_BG] Erro ao processar embedding em background:', error)
  }
}
