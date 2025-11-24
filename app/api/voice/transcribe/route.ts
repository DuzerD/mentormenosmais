import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const model = 'whisper-1'

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'Arquivo de áudio não fornecido' },
        { status: 400 }
      )
    }

    // Converter File para formato aceito pela OpenAI
    const audioBuffer = await audioFile.arrayBuffer()
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type })
    
    // Criar FormData para a OpenAI
    const openaiFormData = new FormData()
    openaiFormData.append('file', audioBlob, 'audio.webm')
    openaiFormData.append('model', model)
    openaiFormData.append('language', 'pt')

    // Fazer requisição para OpenAI Whisper
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: openaiFormData
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Erro na transcrição:', errorData)
      return NextResponse.json(
        { success: false, error: 'Erro na transcrição de áudio' },
        { status: 500 }
      )
    }

    const transcriptionData = await response.json()
    
    return NextResponse.json({
      success: true,
      text: transcriptionData.text
    })

  } catch (error) {
    console.error('Erro no endpoint de transcrição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 