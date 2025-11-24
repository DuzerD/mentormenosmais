import { NextResponse } from "next/server"
import OpenAI from "openai"

import type {
  DirectionsResponsePayload,
  LayoutPreference,
  Mission2Snapshot,
  Mission3GuideSummary,
  VisualDirectionOption,
  VisualEnergyChoice,
} from "@/lib/missao3-types"

type Stage = "directions" | "image" | "guide"

interface BasePayload {
  mission2: Mission2Snapshot
}

interface DirectionsPayload extends BasePayload {
  stage: "directions"
  energy: VisualEnergyChoice
}

interface ImagePayload extends BasePayload {
  stage: "image"
  energy: VisualEnergyChoice
  direction: VisualDirectionOption
  layout: LayoutPreference
  variant?: "primary" | "alternative"
}

interface GuidePayload extends BasePayload {
  stage: "guide"
  energy: VisualEnergyChoice
  direction: VisualDirectionOption
  layout: LayoutPreference
  palette: VisualDirectionOption["palette"]
}

type RequestPayload = DirectionsPayload | ImagePayload | GuidePayload

const energyLabels: Record<VisualEnergyChoice, string> = {
  profissionalismo: "Profissionalismo e confiança",
  inspiracao: "Inspiração e propósito",
  criatividade: "Criatividade e ousadia",
  calma: "Calma e autenticidade",
  energia: "Energia e movimento",
}

const baseSystemPrompt = [
  "Você é o Designer IA da Menos Mais.",
  "Seu papel é traduzir a mensagem da marca em direção visual, mantendo o tom calmo, confiante e inspirador.",
  "Pense como um diretor de arte que explica suas decisões de forma simples e acessível.",
].join(" ")

const directionsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    directions: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            type: "string",
            description: "Identificador em kebab-case para uso interno.",
          },
          name: {
            type: "string",
            description: "Nome curto e memorável da direção visual.",
          },
          summary: {
            type: "string",
            description: "Resumo em uma frase descrevendo o ambiente geral.",
          },
          palette: {
            type: "array",
            minItems: 3,
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                hex: {
                  type: "string",
                  pattern: "^#([A-Fa-f0-9]{6})$",
                  description: "Código hexadecimal da cor.",
                },
                label: {
                  type: "string",
                  description: "Nome amigável da cor.",
                },
                usage: {
                  type: "string",
                  description: "Como essa cor entra no sistema visual.",
                },
              },
              required: ["hex", "label", "usage"],
            },
          },
          texture: {
            type: "string",
            description: "Texturas e materiais predominantes.",
          },
          lighting: {
            type: "string",
            description: "Sensação de luz, contraste e atmosfera.",
          },
          typography: {
            type: "string",
            description: "Estilo tipográfico recomendado.",
          },
          shapes: {
            type: "string",
            description: "Formas predominantes quando relevante.",
          },
          keywords: {
            type: "array",
            minItems: 3,
            maxItems: 5,
            items: { type: "string" },
          },
        },
        required: [
          "id",
          "name",
          "summary",
          "palette",
          "texture",
          "lighting",
          "typography",
          "shapes",
          "keywords",
        ],
      },
    },
    creativeNote: {
      type: "string",
      description: "Nota inspiradora resumindo o raciocínio.",
    },
  },
  required: ["directions", "creativeNote"],
}

const guideSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    palette: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          hex: { type: "string", pattern: "^#([A-Fa-f0-9]{6})$" },
          label: { type: "string" },
          usage: { type: "string" },
        },
        required: ["hex", "label", "usage"],
      },
    },
    typography: {
      type: "object",
      additionalProperties: false,
      properties: {
        primary: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            style: { type: "string" },
            usage: { type: "string" },
          },
          required: ["name", "style", "usage"],
        },
        secondary: {
          type: ["object", "null"],
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            style: { type: "string" },
            usage: { type: "string" },
          },
          required: ["name", "style", "usage"],
        },
        accent: {
          type: ["object", "null"],
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            style: { type: "string" },
            usage: { type: "string" },
          },
          required: ["name", "style", "usage"],
        },
      },
      required: ["primary", "secondary", "accent"],
    },
    visualNotes: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string" },
    },
    signatureIdea: {
      type: "string",
      description: "Sugestão para assinatura visual ou logotipo simplificado.",
    },
    socialPreviewIdea: {
      type: "string",
      description: "Descrição curta de um post ou mockup gerado.",
    },
    toneReminder: {
      type: "string",
      description: "Frase que amarra tom, energia e mensagem.",
    },
  },
  required: ["palette", "typography", "visualNotes", "signatureIdea", "socialPreviewIdea", "toneReminder"],
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

function isOrganizationVerificationError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false
  }

  const candidate = error as {
    status?: number
    message?: string
    error?: { message?: string }
  }

  if (candidate.status !== 403) {
    return false
  }

  const message = candidate.message ?? candidate.error?.message

  return typeof message === "string" && message.toLowerCase().includes("organization must be verified")
}

function buildMissionContext(snapshot: Mission2Snapshot): string {
  const parts: string[] = []

  if (snapshot.selectedPhrase) {
    parts.push(`Mensagem principal definida pelo Copywriter: "${snapshot.selectedPhrase}".`)
  }

  if (snapshot.subtitle) {
    parts.push(`Subtítulo de apoio: "${snapshot.subtitle}".`)
  }

  if (snapshot.bio) {
    parts.push(`Bio sugerida: "${snapshot.bio}".`)
  }

  if (snapshot.insight) {
    parts.push(`Insight estratégico: ${snapshot.insight}.`)
  }

  if (snapshot.tone) {
    parts.push(`Tom desejado: ${snapshot.tone}.`)
  }

  return parts.join(" ")
}

function ensureOpenAIKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key não configurada")
  }
}

export async function POST(request: Request) {
  try {
    ensureOpenAIKey()

    const body = (await request.json()) as Partial<RequestPayload> | null
    if (!body || typeof body !== "object" || !("stage" in body)) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    const stage = body.stage

    if (stage === "directions") {
      const payload = body as Partial<DirectionsPayload>
      if (!payload.energy || !payload.mission2) {
        return NextResponse.json({ error: "Energia e contexto da Missão 2 são obrigatórios" }, { status: 400 })
      }
      const data = await generateDirections(payload as DirectionsPayload)
      return NextResponse.json({ success: true, stage, data })
    }

    if (stage === "image") {
      const payload = body as Partial<ImagePayload>
      if (!payload.direction || !payload.mission2 || !payload.energy || !payload.layout) {
        return NextResponse.json({ error: "Direção, energia, layout e contexto são obrigatórios" }, { status: 400 })
      }
      const data = await generateImage(payload as ImagePayload)
      return NextResponse.json({ success: true, stage, data })
    }

    if (stage === "guide") {
      const payload = body as Partial<GuidePayload>
      if (!payload.direction || !payload.mission2 || !payload.energy || !payload.layout || !payload.palette) {
        return NextResponse.json({ error: "Dados completos da direção e paleta são obrigatórios" }, { status: 400 })
      }
      const data = await generateGuide(payload as GuidePayload)
      return NextResponse.json({ success: true, stage, data })
    }

    return NextResponse.json({ error: "Etapa solicitada não suportada" }, { status: 400 })
  } catch (error) {
    console.error("[MISSAO 3] Falha ao processar requisição:", error)
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    const status = message.includes("OpenAI API key") ? 500 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

async function generateDirections(payload: DirectionsPayload): Promise<DirectionsResponsePayload> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const missionContext = buildMissionContext(payload.mission2)
  const energyLabel = energyLabels[payload.energy]

  const prompt = [
    `O cliente escolheu a energia "${energyLabel}".`,
    missionContext,
    "Crie duas direções visuais complementares que traduzam essa energia de forma distinta.",
    "Cada direção precisa ter nome curto (2 a 3 palavras), resumo em uma frase, paleta com 3 a 5 cores em hexadecimal, textura, sensação de luz, estilo tipográfico sugerido e palavras-chave.",
    "Use o formato JSON especificado. Evite repetir as mesmas cores nas duas propostas.",
  ]
    .filter(Boolean)
    .join(" ")

  const response = await openai.responses.create({
    model: "gpt-5",
    input: [
      { role: "system", content: [{ type: "input_text", text: baseSystemPrompt }] },
      { role: "user", content: [{ type: "input_text", text: prompt }] },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "Mission3Directions",
        schema: directionsSchema,
      },
    },
  })

  return parseResponseJSON<DirectionsResponsePayload>(response)
}

async function generateImage(payload: ImagePayload) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const { direction, mission2, layout, energy, variant } = payload

  const palette = direction.palette.map((swatch) => `${swatch.hex} (${swatch.usage})`).join(", ")
  const layoutLine =
    layout === "curves"
      ? "Use curvas suaves, composi��ǜo fluida e sobreposi����es orgǽnicas."
      : layout === "lines"
        ? "Use linhas retas, grid geomǸtrico e cortes precisos."
        : "Misture curvas delicadas e linhas sutis, mantendo equil��brio minimalista."

  const promptLines = [
    `Design a square 1024x1024 brand identity mockup for a digital card showcasing the direction "${direction.name}".`,
    `The brand message is "${mission2.selectedPhrase}".`,
    mission2.subtitle ? `Include a subtle subtitle: "${mission2.subtitle}".` : undefined,
    `Reflect the energy "${energyLabels[energy]}".`,
    `Color palette: ${palette}.`,
    `Surface textures: ${direction.texture}.`,
    `Lighting mood: ${direction.lighting}.`,
    `Typography vibe: ${direction.typography}.`,
    layoutLine,
    "Include a minimal logomark or monogram placeholder inspired by the description.",
    "Keep text limited to headline and short supporting line, clean layout, no extra paragraphs.",
    "Style: high-end brand design, 3D lighting with soft gradients, vector-inspired composition.",
    variant === "alternative" ? "Render an alternative angle or variation within the same direction." : undefined,
  ]
    .filter(Boolean)
    .join(" ")

  const baseRequest = {
    prompt: promptLines,
    size: "1024x1024",
  }

  const runImageRequest = (model: "gpt-image-1" | "dall-e-3") =>
    openai.images.generate({
      ...baseRequest,
      model,
      // gpt-image-1 always responds with base64; response_format is only valid for dall-e models.
      ...(model === "gpt-image-1"
        ? { quality: "high" as const }
        : { response_format: "b64_json" as const }),
    })

  let response: Awaited<ReturnType<typeof runImageRequest>>

  try {
    response = await runImageRequest("gpt-image-1")
  } catch (error) {
    if (isOrganizationVerificationError(error)) {
      console.warn("[MISSAO 3] gpt-image-1 indisponivel, usando fallback dall-e-3.")
      response = await runImageRequest("dall-e-3")
    } else {
      throw error
    }
  }

  const imageData = response.data?.[0]

  if (!imageData) {
    throw new Error("Imagem nao retornada pelo modelo de geracao")
  }

  const base64 = imageData.b64_json
  const imageUrl = base64 ? `data:image/png;base64,${base64}` : imageData.url

  if (!imageUrl) {
    throw new Error("Imagem nao retornada pelo modelo de geracao")
  }

  return {
    imageUrl,
    prompt: promptLines,
    altText: `Mockup ${direction.name} com energia ${energyLabels[energy]}`,
  }
}

async function generateGuide(payload: GuidePayload): Promise<Mission3GuideSummary> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const missionContext = buildMissionContext(payload.mission2)
  const paletteDescription = payload.palette.map((swatch) => `${swatch.hex}: ${swatch.usage}`).join(" | ")

  const prompt = [
    `Resumo da direção escolhida: ${payload.direction.summary}.`,
    `Paleta base aprovada: ${paletteDescription}.`,
    `Energia desejada: ${energyLabels[payload.energy]}.`,
    `Preferência estrutural: ${payload.layout === "curves" ? "curvas suaves" : payload.layout === "lines" ? "linhas retas" : "combinação de curvas sutis e linhas leves"}.`,
    missionContext,
    "Monte um kit visual objetivo: paleta com descrições, tipografias com função, três notas de uso visual, uma sugestão de assinatura visual (logo ou assinatura) e como aplicar em um post/preview.",
    "Feche com lembrete de tom alinhado à mensagem principal.",
    "Responda apenas no JSON indicado.",
  ]
    .filter(Boolean)
    .join(" ")

  const response = await openai.responses.create({
    model: "gpt-5",
    input: [
      { role: "system", content: [{ type: "input_text", text: baseSystemPrompt }] },
      { role: "user", content: [{ type: "input_text", text: prompt }] },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "Mission3Guide",
        schema: guideSchema,
      },
    },
  })

  const parsed = parseResponseJSON<Mission3GuideSummary>(response)

  return {
    ...parsed,
    typography: {
      ...parsed.typography,
      secondary: parsed.typography.secondary ?? undefined,
      accent: parsed.typography.accent ?? undefined,
    },
  }
}
