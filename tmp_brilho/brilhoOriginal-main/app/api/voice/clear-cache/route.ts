import { NextResponse } from 'next/server'

// Importar o cache da API TTS (idealmente seria uma solução mais robusta com Redis)
// Por enquanto, vamos usar uma variável global
declare global {
  var ttsCache: Map<string, any> | undefined
}

export async function POST() {
  try {
    // Limpar cache global se existir
    if (global.ttsCache) {
      global.ttsCache.clear()
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cache TTS limpo com sucesso'
    })
  } catch (error) {
    console.error('Erro ao limpar cache TTS:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao limpar cache' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const cacheSize = global.ttsCache?.size || 0
    
    return NextResponse.json({
      success: true,
      cacheSize: cacheSize,
      message: `Cache TTS contém ${cacheSize} entradas`
    })
  } catch (error) {
    console.error('Erro ao verificar cache TTS:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao verificar cache' },
      { status: 500 }
    )
  }
} 