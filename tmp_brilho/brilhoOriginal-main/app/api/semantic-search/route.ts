import { NextResponse } from "next/server"
import OpenAI from "openai"
import Typesense from 'typesense'

// Cliente Typesense
const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST!,
      port: 443,
      protocol: 'https'
    }
  ],
  apiKey: process.env.TYPESENSE_API_KEY || '',
  connectionTimeoutSeconds: 10
})

/**
 * Busca semântica no Typesense usando embeddings
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query, limit = 5, idUnico } = body

    if (!query) {
      return NextResponse.json({ 
        error: "Query é obrigatória" 
      }, { status: 400 })
    }

    // Configuração do OpenAI para gerar embedding da query
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "OpenAI API key não configurada" 
      }, { status: 500 })
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    console.log(`[SEARCH] Iniciando busca semântica para: "${query}"`)
    console.log(`[SEARCH] Configuração Typesense:`, {
      host: process.env.TYPESENSE_HOST,
      port: process.env.TYPESENSE_PORT,
      protocol: process.env.TYPESENSE_PROTOCOL,
      hasApiKey: !!process.env.TYPESENSE_API_KEY
    })    // 1. Gerar embedding para a query de busca
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      encoding_format: "float",
      dimensions: 1536
    })

    const queryEmbedding = embeddingResponse.data[0].embedding
    console.log(`[SEARCH] Embedding da query gerado com ${queryEmbedding.length} dimensões`)

    // 2. Buscar documentos similares no Typesense usando multi_search para evitar limite de URL
    const searchRequest = {
      searches: [
        {
          collection: 'empresa_dados',
          q: '*',
          vector_query: `embedding:([${queryEmbedding.join(',')}], k:${limit})`,
          per_page: limit,
          include_fields: 'nome_empresa,contexto,diagnostico,scoreDiagnostico,resposta_1,resposta_2,resposta_3,resposta_4,resposta_5,resposta_6,resposta_7,resposta_8,created_at,id',
          ...(idUnico && { filter_by: `id:=${idUnico}` })
        }
      ]
    }

    console.log(`[SEARCH] Buscando no Typesense usando multi_search com ${idUnico ? 'filtro por ID' : 'busca geral'}`)

    let searchResults: any
    try {
      const multiSearchResponse = await typesenseClient.multiSearch.perform(searchRequest)
      searchResults = multiSearchResponse.results[0]
    } catch (typesenseError) {
      console.error('[SEARCH] Erro do Typesense:', typesenseError)
      return NextResponse.json({
        error: "Erro na busca do Typesense",
        details: typesenseError instanceof Error ? typesenseError.message : String(typesenseError)
      }, { status: 500 })
    }

    console.log(`[SEARCH] Encontrados ${searchResults.hits?.length || 0} resultados`)

    // 3. Processar e formatar resultados
    const results = searchResults.hits?.map((hit: any) => {
      const doc = hit.document
      const score = hit.vector_distance || 0

      // Preparar contexto consolidado
      const respostas = [
        doc.resposta_1,
        doc.resposta_2,
        doc.resposta_3,
        doc.resposta_4,
        doc.resposta_5,
        doc.resposta_6,
        doc.resposta_7,
        doc.resposta_8
      ].filter(Boolean)

      return {
        id: doc.id,
        empresa: doc.nome_empresa || 'Empresa não identificada',
        score: score,
        similarity: Math.max(0, 1 - score), // Converter distância em similaridade
        contexto: doc.contexto || '',
        diagnostico: typeof doc.diagnostico === 'string' ? doc.diagnostico : JSON.stringify(doc.diagnostico),
        scoreDiagnostico: doc.scoreDiagnostico || 0,
        respostas: respostas,
        created_at: doc.created_at
      }
    }) || []

    // 4. Se busca específica por ID e não encontrou, buscar no Supabase como fallback
    if (idUnico && results.length === 0) {
      console.log(`[SEARCH] Não encontrado no Typesense, buscando no Supabase como fallback`)
      
      // Buscar no Supabase como fallback
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.SUPABASE_KEY!
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data: fallbackData } = await supabase
        .from('brandplot')
        .select('*')
        .eq('idUnico', idUnico)
        .single()

      if (fallbackData) {
        const respostas = [
          fallbackData.resposta_1,
          fallbackData.resposta_2,
          fallbackData.resposta_3,
          fallbackData.resposta_4,
          fallbackData.resposta_5,
          fallbackData.resposta_6,
          fallbackData.resposta_7,          fallbackData.resposta_8
        ].filter(Boolean)

        results.push({
          id: fallbackData.id,
          empresa: fallbackData.nome_empresa || 'Empresa não identificada',
          score: 0,
          similarity: 1,
          contexto: fallbackData.contexto || '',
          diagnostico: fallbackData.diagnostico || '',
          scoreDiagnostico: fallbackData.scoreDiagnostico || 0,
          respostas: respostas,
          created_at: fallbackData.created_at
        })
      }
    }

    return NextResponse.json({
      success: true,
      query: query,
      results: results,
      total: results.length,
      searchType: idUnico ? 'specific' : 'semantic'
    })

  } catch (error) {
    console.error('[SEARCH] Erro na busca semântica:', error)
    return NextResponse.json({ 
      error: "Erro interno na busca",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * Função auxiliar para busca específica por empresa
 */
export async function searchCompanyData(idUnico: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/semantic-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: `dados da empresa contexto diagnóstico estratégia`,
        idUnico: idUnico,
        limit: 1
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()
    return result.success ? result.results[0] : null
  } catch (error) {
    console.error('[SEARCH] Erro ao buscar dados da empresa:', error)
    return null
  }
}
