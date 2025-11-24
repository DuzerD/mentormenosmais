import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_FIGMA_KEY
});

// Função para adicionar headers CORS
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Handler para OPTIONS (preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { tipo, conteudo, configuracao } = await req.json();

    // Verificar se a chave da OpenAI está configurada
    if (!process.env.OPENAI_FIGMA_KEY) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Chave da OpenAI não configurada',
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: corsHeaders()
        }
      );
    }

    console.log('🔍 DEBUG - Dados recebidos:', { tipo, conteudo, configuracao });
    console.log('🔍 DEBUG - Chave OpenAI configurada:', process.env.OPENAI_FIGMA_KEY ? 'SIM' : 'NÃO');
    let prompt = '';
    
    // Definindo diferentes tipos de conteúdo que o plugin pode gerar
    switch (tipo) {
      case 'carrossel':
        prompt = `
Crie um conteúdo de carrossel no Instagram com 17 blocos sobre o tema: "${conteudo}".
Retorne os blocos no formato:
texto 1 - ...
texto 2 - ...
...
texto 17 - ...
Apenas os blocos. Sem hashtags ou observações extras.
`;
        break;
        
      case 'post':
        prompt = `
Crie um post completo para Instagram sobre: "${conteudo}".
Inclua:
- Texto principal engajante
- Call-to-action
- 5 hashtags relevantes
Formato: um post conciso e atrativo.
`;
        break;
        
      case 'stories':
        prompt = `
Crie 5 ideias de stories para Instagram sobre: "${conteudo}".
Retorne no formato:
Story 1: ...
Story 2: ...
Story 3: ...
Story 4: ...
Story 5: ...
Cada story deve ter um texto curto e engajante.
`;
        break;
        
      case 'legenda':
        prompt = `
Crie uma legenda criativa e engajante para Instagram sobre: "${conteudo}".
A legenda deve:
- Ser interessante e chamar atenção
- Incluir emojis relevantes
- Ter um call-to-action
- Incluir 3-5 hashtags
`;
        break;
        
      default:
        prompt = `
Crie conteúdo para redes sociais sobre: "${conteudo}".
Tipo de conteúdo: ${tipo || 'geral'}
Seja criativo e engajante.
`;
    }

    const completion = await openai.chat.completions.create({
      model: configuracao?.modelo || "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: configuracao?.temperatura || 0.7,
      max_tokens: configuracao?.maxTokens || 1000
    });

    const textoGerado = completion.choices[0].message.content;
    
    // Verificação de segurança
    if (!textoGerado) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Nenhum conteúdo foi gerado',
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: corsHeaders()
        }
      );
    }
    
    // Processamento específico baseado no tipo
    let resultado;
    
    if (tipo === 'carrossel') {
      const blocos = textoGerado
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && (l.toLowerCase().startsWith('texto') || /^texto\s*\d+/.test(l.toLowerCase())))
        .map(l => l.replace(/^texto\s*\d+\s*[-:]\s*/i, '').trim());
      
      // Se não encontrou blocos no formato esperado, dividir por linhas não vazias
      if (blocos.length === 0) {
        const linhas = textoGerado.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        resultado = { blocos: linhas.slice(0, 17), textoCompleto: textoGerado };
      } else {
        resultado = { blocos, textoCompleto: textoGerado };
      }
    } else if (tipo === 'stories') {
      const stories = textoGerado
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.toLowerCase().startsWith('story'));
      resultado = { stories, textoCompleto: textoGerado };
    } else {
      resultado = { conteudo: textoGerado };
    }

    console.log('🔍 DEBUG - Resultado processado:', resultado);

    return NextResponse.json({
      sucesso: true,
      tipo,
      resultado,
      timestamp: new Date().toISOString()
    }, {
      headers: corsHeaders()
    });

  } catch (error: any) {
    console.error('❌ ERRO DETALHADO:', error?.response?.data || error.message || error);
    
    return NextResponse.json(
      {
        sucesso: false,
        erro: 'Erro ao gerar conteúdo',
        detalhe: error?.response?.data || error.message,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
} 