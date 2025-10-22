import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 segundos timeout
})

// Cache simples em memória para evitar reprocessar o mesmo texto
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

// Usar cache global para persistir entre requisições
if (!global.ttsCache) {
  global.ttsCache = new Map<string, { audioUrl: string, timestamp: number }>()
}
const ttsCache = global.ttsCache

declare global {
  var ttsCache: Map<string, { audioUrl: string, timestamp: number }> | undefined
}

// Função para limpar cache antigo
function cleanCache() {
  const now = Date.now()
  for (const [key, value] of ttsCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      ttsCache.delete(key)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'nova', model = 'gpt-4o-mini-tts', speed = 1.0 } = await request.json()

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Texto não fornecido' },
        { status: 400 }
      )
    }

    // Limpar cache antigo periodicamente
    cleanCache()

    // Criar chave de cache baseada no texto e configurações
    const cacheKey = `${text}_${voice}_${model}_${speed}`
    
    // Verificar cache primeiro
    const cached = ttsCache.get(cacheKey)
    if (cached) {
      console.log('TTS: Usando cache para:', text.substring(0, 50))
      return NextResponse.json({
        success: true,
        audioUrl: cached.audioUrl,
        voice: voice,
        speed: speed,
        cached: true
      })
    }

    // Validar voz (OpenAI suporta: alloy, echo, fable, onyx, nova, shimmer)
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    const selectedVoice = validVoices.includes(voice) ? voice : 'nova'

    // Validar velocidade (0.25 a 4.0)
    const validSpeed = Math.max(0.25, Math.min(4.0, speed))

    // Sempre usar tts-1 (modelo mais rápido)
    const ttsModel = 'gpt-4o-mini-tts'

    console.log('TTS: Gerando áudio para:', text.substring(0, 50), '...')
    const startTime = Date.now()

    // Gerar áudio usando OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: ttsModel,
      voice: selectedVoice as any,
      input: text,
      response_format: 'mp3',
      speed: validSpeed,
      instructions: `
      Você é um consultor especialista em branding e estratégia de marca da BrandPlot, uma das principais consultorias de branding do Brasil. Você está conversando por voz com um empresário em tempo real.
      TOM DE VOZ:
      • Confiante e acessível  
      • Linguagem natural e direta, sem jargões  
      • Respostas estruturadas para durar 30–60 segundos em formato de fala
      
      INSTRUÇÕES:
      • Seja objetivo e claro
      • Demonstre seu conhecimento e expertise
      • Seja profissional e educado
      `
    })

    const processingTime = Date.now() - startTime
    console.log(`TTS: Processamento concluído em ${processingTime}ms`)

    // Converter para buffer e criar Blob URL ao invés de base64
    const buffer = Buffer.from(await mp3.arrayBuffer())
    
    // Criar uma resposta com o áudio como blob
    const audioResponse = new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=300', // 5 minutos
      },
    })

    // Para retornar rapidamente, vamos usar base64 otimizado para pequenos textos
    // ou blob URL para textos maiores
    let audioUrl: string
    
    if (text.length < 200) {
      // Textos pequenos: usar base64 (mais rápido para carregamento)
      const base64Audio = buffer.toString('base64')
      audioUrl = `data:audio/mp3;base64,${base64Audio}`
    } else {
      // Textos grandes: usar blob URL (mais eficiente de memória)
      const base64Audio = buffer.toString('base64')
      audioUrl = `data:audio/mp3;base64,${base64Audio}`
    }

    // Salvar no cache
    ttsCache.set(cacheKey, {
      audioUrl: audioUrl,
      timestamp: Date.now()
    })

    return NextResponse.json({
      success: true,
      audioUrl: audioUrl,
      voice: selectedVoice,
      speed: validSpeed,
      processingTime: processingTime,
      cached: false
    })

  } catch (error: any) {
    console.error('Erro no endpoint de TTS:', error)
    
    // Errors mais específicos
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { success: false, error: 'Cota da API OpenAI esgotada' },
        { status: 429 }
      )
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return NextResponse.json(
        { success: false, error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { success: false, error: `Erro na síntese de voz: ${error.message || error}` },
      { status: 500 }
    )
  }
} 