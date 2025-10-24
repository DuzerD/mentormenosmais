import { NextResponse } from "next/server"
import OpenAI from "openai"

type Stage = "variations" | "assets" | "content"

interface VariationsPayload {
  userPhrase: string
  contextDetails?: string
}

interface AssetsPayload {
  userPhrase?: string
  selectedPhrase: string
  brandTone?: string
}

interface ContentPayload {
  selectedPhrase: string
  subtitle: string
  bio: string
}

type RequestPayload =
  | ({ stage: "variations" } & VariationsPayload)
  | ({ stage: "assets" } & AssetsPayload)
  | ({ stage: "content" } & ContentPayload)

const baseSystemPrompt = [
  "Voce e o Copywriter da Menos Mais, especialista em transformar mensagens confusas em copy irresistivel.",
  "Seu tom e charmoso, brincalhao e direto, como quem diz: \"Deixa comigo - eu falo bonito por voce\".",
  "Voce cria frases curtas, memoraveis e com foco em beneficio. As respostas devem estar sempre em portugues brasileiro.",
].join(" ")

const stageFormats: Record<
  Stage,
  {
    type: "json_schema"
    name: string
    schema: Record<string, unknown>
  }
> = {
  variations: {
    type: "json_schema",
    name: "Mission2Variations",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        options: {
          type: "array",
          minItems: 3,
          maxItems: 4,
          items: { type: "string", minLength: 8, maxLength: 140 },
        },
        insight: {
          type: "string",
          description: "Comentario breve sobre como as versoes destacam o valor da solucao.",
        },
      },
      required: ["options", "insight"],
    },
  },
  assets: {
    type: "json_schema",
    name: "Mission2Assets",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        subtitle: {
          type: "string",
          description: "Subtitulo que reforca o beneficio final ao cliente.",
          minLength: 12,
          maxLength: 140,
        },
        instagramBio: {
          type: "string",
          description: "Bio de Instagram com ate 120 caracteres.",
          minLength: 12,
          maxLength: 120,
        },
        positioningNote: {
          type: "string",
          description: "Nota sobre o foco estrategico adotado.",
        },
      },
      required: ["subtitle", "instagramBio", "positioningNote"],
    },
  },
  content: {
    type: "json_schema",
    name: "Mission2ContentIdea",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: {
          type: "string",
          description: "Titulo chamativo para um post carrossel ou video curto.",
          minLength: 8,
          maxLength: 120,
        },
        bullets: {
          type: "array",
          minItems: 3,
          maxItems: 4,
          items: {
            type: "string",
            minLength: 12,
            maxLength: 160,
          },
        },
        callToAction: {
          type: "string",
          description: "Sugestao opcional de CTA para fechar o conteudo.",
        },
      },
      required: ["title", "bullets", "callToAction"],
    },
  },
}

function buildPrompt(payload: RequestPayload): string {
  if (payload.stage === "variations") {
    const { userPhrase, contextDetails } = payload
    return [
      "Reescreva a frase a seguir em tres versoes curtas e impactantes, priorizando beneficio, clareza e desejo.",
      "Cada frase deve soar como uma promessa real de valor, com linguagem simples, confiante e convidativa.",
      contextDetails ? `Contexto adicional fornecido: ${contextDetails}.` : undefined,
      `Frase original do usuario: "${userPhrase}".`,
      "Retorne apenas o JSON no formato combinado.",
    ]
      .filter(Boolean)
      .join(" ")
  }

  if (payload.stage === "assets") {
    const { selectedPhrase, userPhrase, brandTone } = payload
    return [
      "A frase principal escolhida pelo usuario sera a base da mensagem central.",
      "Crie um subtitulo de apoio que deixe explicito o beneficio final para o cliente, em no maximo 20 palavras.",
      "Gere tambem uma bio de Instagram com ate 120 caracteres, combinando clareza e autoridade.",
      brandTone ? `Tom desejado informado: ${brandTone}.` : "Use o tom charmoso, brincalhao e direto da Menos Mais.",
      userPhrase ? `Frase original do usuario para referencia: "${userPhrase}".` : undefined,
      `Frase principal escolhida: "${selectedPhrase}".`,
      "Explique rapidamente (positioningNote) qual foco estrategico guiou suas escolhas.",
      "Responda apenas no formato JSON solicitado.",
    ]
      .filter(Boolean)
      .join(" ")
  }

  const { selectedPhrase, subtitle, bio } = payload
  return [
    "Com base na mensagem principal, subtitulo e bio, proponha uma ideia de post carrossel ou video curto para Instagram.",
    "Crie um titulo chamativo (maximo 12 palavras) e tres bullets que resumam o conteudo de forma sequencial.",
    "Cada bullet deve empurrar o leitor para a acao, misturando insight pratico e provocacao.",
    "Sugira ainda um CTA curto (callToAction) alinhado ao novo posicionamento.",
    `Mensagem principal: "${selectedPhrase}".`,
    `Subtitulo de apoio: "${subtitle}".`,
    `Bio atualizada: "${bio}".`,
    "Retorne apenas o JSON conforme o schema definido.",
  ].join(" ")
}

function parseResponseJSON<T>(response: Awaited<ReturnType<OpenAI["responses"]["create"]>>): T {
  if (typeof (response as any).output_text === "string") {
    return JSON.parse((response as any).output_text) as T
  }

  if (Array.isArray((response as any).output)) {
    for (const message of (response as any).output) {
      if (message.type === "message" && Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === "output_text" && typeof part.text === "string") {
            return JSON.parse(part.text) as T
          }
        }
      }
    }
  }

  throw new Error("Formato inesperado recebido do OpenAI Responses API")
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key nao configurada" }, { status: 500 })
    }

    const body = (await request.json()) as Partial<RequestPayload>
    const stage = body.stage

    if (stage !== "variations" && stage !== "assets" && stage !== "content") {
      return NextResponse.json({ error: "Etapa invalida solicitada" }, { status: 400 })
    }

    if (stage === "variations" && !body.userPhrase) {
      return NextResponse.json({ error: "Frase do usuario e obrigatoria" }, { status: 400 })
    }

    if (stage === "assets") {
      const { selectedPhrase } = body as Partial<AssetsPayload>
      if (!selectedPhrase) {
        return NextResponse.json({ error: "Selecione uma frase principal antes de gerar ativos" }, { status: 400 })
      }
    }

    if (stage === "content") {
      const { selectedPhrase, subtitle, bio } = body as Partial<ContentPayload>
      if (!selectedPhrase || !subtitle || !bio) {
        return NextResponse.json(
          { error: "Mensagem principal, subtitulo e bio sao necessarios para gerar o conteudo" },
          { status: 400 },
        )
      }
    }

    if (stage === "variations") {
      const { userPhrase } = body as Partial<VariationsPayload>
      if (!userPhrase) {
        return NextResponse.json({ error: "Frase do usuario e obrigatoria" }, { status: 400 })
      }
    }
    const data = await generateCopy(body as RequestPayload)

    return NextResponse.json({ success: true, stage, data })
  } catch (error) {
    console.error("[MISSAO 2] Erro ao gerar copy:", error)
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function generateCopy(payload: RequestPayload) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const prompt = buildPrompt(payload)
  const stageFormat = stageFormats[payload.stage]
  const response = await openai.responses.create({
    model: "gpt-5",
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: baseSystemPrompt }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: prompt }],
      },
    ],
    text: {
      format: {
        name: stageFormat.name,
        type: stageFormat.type,
        schema: stageFormat.schema,
      },
    },
  })

  return parseResponseJSON(response)
}
