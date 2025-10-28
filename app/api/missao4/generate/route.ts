import { NextResponse } from "next/server"
import OpenAI from "openai"

import type {
  Mission4Calendar,
  Mission4CalendarEntry,
  Mission4Context,
  Mission4Idea,
  Mission4IdeasResponse,
  Mission4Legenda,
  Mission4Roteiro,
} from "@/lib/missao4-types"

type Stage = "ideas" | "roteiro" | "legenda" | "calendar"

interface BasePayload {
  context: Mission4Context
}

interface IdeasPayload extends BasePayload {
  stage: "ideas"
}

interface RoteiroPayload extends BasePayload {
  stage: "roteiro"
  idea: Mission4Idea
}

interface LegendaPayload extends BasePayload {
  stage: "legenda"
  idea: Mission4Idea
  roteiro: Mission4Roteiro
}

interface CalendarPayload extends BasePayload {
  stage: "calendar"
  idea: Mission4Idea
  roteiro: Mission4Roteiro
  legenda: Mission4Legenda
}

type RequestPayload = IdeasPayload | RoteiroPayload | LegendaPayload | CalendarPayload

const baseSystemPrompt = [
  "Você é o Social Media IA da Menos Mais.",
  "Seu papel é transformar a estratégia, a mensagem e a identidade da marca em presença consistente.",
  "Fale com confiança, clareza e foco em ação. Seja direto, sem enrolação, e sempre em português brasileiro.",
].join(" ")

const ideasSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ideas: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            type: "string",
            description: "Identificador curto tipo idea-1, idea-2...",
          },
          title: {
            type: "string",
            minLength: 6,
            maxLength: 120,
            description: "Título chamativo da ideia.",
          },
          format: {
            type: "string",
            minLength: 3,
            maxLength: 50,
            description: "Formato recomendado (ex: Carrossel, Reel, Live curta...).",
          },
          caption: {
            type: "string",
            minLength: 24,
            maxLength: 160,
            description: "Legenda curta (1 frase) alinhada ao tom da marca.",
          },
          angle: {
            type: "string",
            description: "Ângulo estratégico ou insight chave da ideia.",
          },
        },
        required: ["id", "title", "format", "caption"],
      },
    },
    alignmentNote: {
      type: "string",
      description: "Resumo opcional indicando como as ideias se conectam à estratégia.",
    },
  },
  required: ["ideas"],
}

const roteiroSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    gancho: {
      type: "string",
      minLength: 12,
      maxLength: 200,
    },
    desenvolvimento: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "string",
        minLength: 12,
        maxLength: 220,
      },
    },
    insight: {
      type: "string",
      minLength: 12,
      maxLength: 200,
    },
    callToAction: {
      type: "string",
      minLength: 8,
      maxLength: 160,
    },
  },
  required: ["gancho", "desenvolvimento", "insight", "callToAction"],
}

const legendaSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    text: {
      type: "string",
      minLength: 120,
      maxLength: 280,
    },
    characterCount: {
      type: "number",
      minimum: 150,
      maximum: 260,
    },
    toneReminder: {
      type: "string",
    },
  },
  required: ["text", "characterCount"],
}

const calendarSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    entries: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          day: {
            type: "string",
            description: "Abreviação do dia: Seg, Ter, Qua, Qui, Sex.",
          },
          theme: {
            type: "string",
            minLength: 8,
            maxLength: 160,
            description: "Tema ou foco do conteúdo.",
          },
          format: {
            type: "string",
            minLength: 3,
            maxLength: 60,
          },
          callToAction: {
            type: "string",
            minLength: 8,
            maxLength: 160,
          },
        },
        required: ["day", "theme", "format", "callToAction"],
      },
    },
    rationale: {
      type: "string",
      description: "Explicação opcional sobre a lógica do calendário.",
    },
  },
  required: ["entries"],
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key não configurada" }, { status: 500 })
  }

  try {
    const body = (await request.json()) as Partial<RequestPayload>
    const stage = body.stage

    if (stage !== "ideas" && stage !== "roteiro" && stage !== "legenda" && stage !== "calendar") {
      return NextResponse.json({ error: "Etapa inválida solicitada" }, { status: 400 })
    }

    if (!body.context) {
      return NextResponse.json({ error: "Contexto da marca é obrigatório" }, { status: 400 })
    }

    if (stage === "roteiro" && !("idea" in body)) {
      return NextResponse.json({ error: "Selecione uma ideia antes de gerar o roteiro" }, { status: 400 })
    }

    if (stage === "legenda" && (!("roteiro" in body) || !("idea" in body))) {
      return NextResponse.json(
        { error: "Roteiro e ideia selecionada são obrigatórios para gerar a legenda" },
        { status: 400 },
      )
    }

    if (stage === "calendar" && (!("legenda" in body) || !("roteiro" in body) || !("idea" in body))) {
      return NextResponse.json(
        { error: "Legenda, roteiro e ideia são obrigatórios para gerar o calendário" },
        { status: 400 },
      )
    }

    const payload = body as RequestPayload
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    switch (payload.stage) {
      case "ideas": {
        const prompt = buildIdeasPrompt(payload.context)
        const response = await openai.responses.create({
          model: "gpt-5",
          input: [
            { role: "system", content: [{ type: "input_text", text: baseSystemPrompt }] },
            { role: "user", content: [{ type: "input_text", text: prompt }] },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "Mission4Ideas",
              schema: ideasSchema,
            },
          },
        })

        const data = parseResponseJSON<Mission4IdeasResponse>(response)
        return NextResponse.json({ success: true, stage: payload.stage, data })
      }
      case "roteiro": {
        const prompt = buildRoteiroPrompt(payload.context, payload.idea)
        const response = await openai.responses.create({
          model: "gpt-5",
          input: [
            { role: "system", content: [{ type: "input_text", text: baseSystemPrompt }] },
            { role: "user", content: [{ type: "input_text", text: prompt }] },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "Mission4Roteiro",
              schema: roteiroSchema,
            },
          },
        })

        const data = parseResponseJSON<Mission4Roteiro>(response)
        return NextResponse.json({ success: true, stage: payload.stage, data })
      }
      case "legenda": {
        const prompt = buildLegendaPrompt(payload.context, payload.idea, payload.roteiro)
        const response = await openai.responses.create({
          model: "gpt-5",
          input: [
            { role: "system", content: [{ type: "input_text", text: baseSystemPrompt }] },
            { role: "user", content: [{ type: "input_text", text: prompt }] },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "Mission4Legenda",
              schema: legendaSchema,
            },
          },
        })

        const data = parseResponseJSON<Mission4Legenda>(response)
        return NextResponse.json({ success: true, stage: payload.stage, data })
      }
      case "calendar": {
        const prompt = buildCalendarPrompt(payload.context, payload.idea, payload.roteiro, payload.legenda)
        const response = await openai.responses.create({
          model: "gpt-5",
          input: [
            { role: "system", content: [{ type: "input_text", text: baseSystemPrompt }] },
            { role: "user", content: [{ type: "input_text", text: prompt }] },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "Mission4Calendar",
              schema: calendarSchema,
            },
          },
        })

        const data = parseResponseJSON<Mission4Calendar>(response)
        return NextResponse.json({ success: true, stage: payload.stage, data })
      }
      default:
        return NextResponse.json({ error: "Etapa inválida solicitada" }, { status: 400 })
    }
  } catch (error) {
    console.error("[MISSAO 4] Erro ao gerar conteúdo:", error)
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function buildIdeasPrompt(context: Mission4Context) {
  const lines = [
    "Com base no contexto abaixo, gere exatamente 5 ideias de post alinhadas à estratégia, mensagem e identidade.",
    "Cada ideia deve ter: título forte, formato (Carrossel, Reel, Stories, Live, Newsletter...), legenda curta (1 frase com até 140 caracteres) e um ângulo/insight opcional.",
    "A voz é confiante e criativa. Nenhuma pergunta sobre tom deve ser feita, apenas execute.",
    "Use identificadores incrementais: idea-1 até idea-5.",
    buildContextBlock(context),
  ]

  return lines.filter(Boolean).join("\n")
}

function buildRoteiroPrompt(context: Mission4Context, idea: Mission4Idea) {
  const lines = [
    "Gere um roteiro de 4 partes para a ideia selecionada.",
    "Estrutura obrigatória: Gancho (1 linha), Desenvolvimento (2 a 3 linhas, formato array), Insight (1 linha forte), Chamada para ação (1 frase que convida com leveza).",
    "Escreva em primeira pessoa, mantendo o tom confiante e criativo.",
    `Ideia escolhida: ${idea.title} (${idea.format}). Legenda curta original: ${idea.caption}.`,
    idea.angle ? `Ângulo sugerido: ${idea.angle}.` : undefined,
    buildContextBlock(context),
  ]

  return lines.filter(Boolean).join("\n")
}

function buildLegendaPrompt(context: Mission4Context, idea: Mission4Idea, roteiro: Mission4Roteiro) {
  const lines = [
    "Escreva uma legenda final entre 150 e 250 caracteres.",
    "Use tom confiante, humano e direto, fechando com CTA leve.",
    "Seja fluido, sem hashtags nem listas. Inclua apenas o texto final.",
    `Gancho: ${roteiro.gancho}`,
    `Desenvolvimento: ${roteiro.desenvolvimento.join(" | ")}`,
    `Insight: ${roteiro.insight}`,
    `Chamada: ${roteiro.callToAction}`,
    `Formato: ${idea.format}. Legenda curta inicial: ${idea.caption}.`,
    buildContextBlock(context),
  ]

  return lines.filter(Boolean).join("\n")
}

function buildCalendarPrompt(
  context: Mission4Context,
  idea: Mission4Idea,
  roteiro: Mission4Roteiro,
  legenda: Mission4Legenda,
) {
  const lines = [
    "Monte um calendário de 5 dias (Seg a Sex).",
    "Para cada dia, traga tema, formato e CTA específico. Conecte com a ideia escolhida e mantenha variedade de formatos.",
    "Garanta que o CTA mantenha o tom confiante e convide para ação leve.",
    `Ideia base: ${idea.title} (${idea.format}).`,
    `Resumo do roteiro: Gancho "${roteiro.gancho}", Insight "${roteiro.insight}".`,
    `Legenda final (para referência de tom): ${legenda.text}`,
    buildContextBlock(context),
  ]

  return lines.filter(Boolean).join("\n")
}

function buildContextBlock(context: Mission4Context) {
  const fragments: string[] = []

  if (context.brandName) {
    fragments.push(`Nome da marca: ${context.brandName}.`)
  }

  if (context.mission1?.resumo) {
    const { q1, q2, q3, q4, q5 } = context.mission1.resumo
    fragments.push(
      [
        `Direção estratégica (Missão 1): ${q1}.`,
        q2?.length ? `Pilares estratégicos: ${q2.join(", ")}.` : undefined,
        q3 ? `Posicionamento desejado: ${q3}.` : undefined,
        q4?.length ? `Provas/ativos principais: ${q4.join(", ")}.` : undefined,
        q5 ? `Plano imediato: ${q5}.` : undefined,
      ]
        .filter(Boolean)
        .join(" "),
    )
  }

  if (context.mission2) {
    fragments.push(
      [
        `Mensagem principal (Missão 2): ${context.mission2.selectedPhrase}.`,
        context.mission2.subtitle ? `Subtítulo: ${context.mission2.subtitle}.` : undefined,
        context.mission2.bio ? `Bio: ${context.mission2.bio}.` : undefined,
        context.mission2.insight ? `Insight da copy: ${context.mission2.insight}.` : undefined,
      ]
        .filter(Boolean)
        .join(" "),
    )
  }

  if (context.mission3) {
    const palette = context.mission3.palette?.map((swatch) => `${swatch.label} (${swatch.hex})`).join(", ")
    const typography = [
      context.mission3.typography?.primary ? `Primária: ${context.mission3.typography.primary.name}` : undefined,
      context.mission3.typography?.secondary ? `Secundária: ${context.mission3.typography.secondary.name}` : undefined,
      context.mission3.typography?.accent ? `Acento: ${context.mission3.typography.accent.name}` : undefined,
    ]
      .filter(Boolean)
      .join(" | ")

    fragments.push(
      [
        `Identidade (Missão 3): direção "${context.mission3.direction.name}"`,
        context.mission3.direction.summary ? `- ${context.mission3.direction.summary}` : undefined,
        palette ? `Paleta: ${palette}.` : undefined,
        typography ? `Tipografia: ${typography}.` : undefined,
        context.mission3.visualNotes?.length ? `Notas: ${context.mission3.visualNotes.join(" | ")}.` : undefined,
        context.mission3.toneReminder ? `Tom visual/verbal: ${context.mission3.toneReminder}.` : undefined,
      ]
        .filter(Boolean)
        .join(" "),
    )
  }

  if (context.identitySummary) {
    fragments.push(`Resumo adicional: ${context.identitySummary}.`)
  }

  return ["Contexto da marca:", fragments.join(" ") || "Sem dados adicionais. Use apenas o que foi informado."]
    .filter(Boolean)
    .join(" ")
}

function parseResponseJSON<T>(response: Awaited<ReturnType<OpenAI["responses"]["create"]>>): T {
  const anyResponse = response as any

  if (typeof anyResponse.output_text === "string") {
    return JSON.parse(anyResponse.output_text) as T
  }

  if (Array.isArray(anyResponse.output)) {
    for (const message of anyResponse.output) {
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

