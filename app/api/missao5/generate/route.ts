import { NextResponse } from "next/server"
import OpenAI from "openai"

import type { Mission5AdjustmentPlan, Mission5Context, Mission5Insight, Mission5InsightsOutput, Mission5MaturityScore, Mission5Report } from "@/lib/missao5-types"

type Stage = "report" | "insights" | "plan" | "maturity"

interface BasePayload {
  context: Mission5Context
}

interface ReportPayload extends BasePayload {
  stage: "report"
}

interface InsightsPayload extends BasePayload {
  stage: "insights"
  report: Mission5Report
}

interface PlanPayload extends BasePayload {
  stage: "plan"
  insights: Mission5Insight[]
}

interface MaturityPayload extends BasePayload {
  stage: "maturity"
  report: Mission5Report
  plan: Mission5AdjustmentPlan
}

type RequestPayload = ReportPayload | InsightsPayload | PlanPayload | MaturityPayload

const baseSystemPrompt = [
  "Voce e o Analista IA da Menos Mais.",
  "Sua missao e interpretar os dados estrategicos das missoes e gerar analises acionaveis.",
  "Fale em portugues brasileiro, com tom analitico, humano e direto.",
  "Prefira frases curtas, clareza total e percentuais formatados (ex: +42 %).",
].join(" ")

const reportSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    reachDelta: {
      type: "string",
      description: "Variacao estimada de alcance, exemplo +42 %",
      pattern: "^[+-]?\\d{1,3}\\s?%$",
    },
    engagementDelta: {
      type: "string",
      description: "Variacao estimada de engajamento, exemplo +31 %",
      pattern: "^[+-]?\\d{1,3}\\s?%$",
    },
    clarityScore: {
      type: "string",
      description: "Pontuacao de clareza percebida, exemplo 92 %",
      pattern: "^\\d{1,3}\\s?%$",
    },
    consistencyLevel: {
      type: "string",
      description: "Nivel qualitativo (Alta, Media, Em construcao)",
      minLength: 3,
      maxLength: 40,
    },
    frequency: {
      type: "string",
      description: "Resumo da frequencia de presenca (ex: 5 dias / semana)",
      minLength: 3,
      maxLength: 60,
    },
    commentary: {
      type: "string",
      description: "Comentario curto sobre o panorama atual",
    },
  },
  required: ["reachDelta", "engagementDelta", "clarityScore", "consistencyLevel", "frequency", "commentary"],
}

const insightsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    insights: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            type: "string",
            description: "Identificador incremental como insight-1",
          },
          title: {
            type: "string",
            description: "Resumo do insight",
            minLength: 6,
            maxLength: 120,
          },
          detail: {
            type: "string",
            description: "Explicacao pratica com dado ou contexto",
            minLength: 20,
            maxLength: 200,
          },
          rationale: {
            type: "string",
            description: "Opcional: justificativa ou dado usado",
          },
        },
        required: ["id", "title", "detail", "rationale"],
      },
    },
    framingNote: {
      type: "string",
      description: "Nota curta de enquadramento dos insights",
    },
  },
  required: ["insights", "framingNote"],
}

const planSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    heading: {
      type: "string",
      description: "Frase de abertura do plano",
    },
    steps: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          objective: {
            type: "string",
            description: "Objetivo principal",
            minLength: 6,
            maxLength: 120,
          },
          action: {
            type: "string",
            description: "Acao concreta",
            minLength: 12,
            maxLength: 200,
          },
          expectedImpact: {
            type: "string",
            description: "Impacto esperado, exemplo +20 %",
            minLength: 6,
            maxLength: 120,
          },
        },
        required: ["objective", "action", "expectedImpact"],
      },
    },
    reminder: {
      type: "string",
      description: "Frase de reforco do plano",
    },
  },
  required: ["heading", "steps", "reminder"],
}

const maturitySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: {
      type: "number",
      minimum: 0,
      maximum: 100,
    },
    stage: {
      type: "string",
      minLength: 4,
      maxLength: 80,
      description: "Nome do estagio da marca",
    },
    narrative: {
      type: "string",
      description: "Narrativa curta sobre proximos passos",
    },
  },
  required: ["score", "stage", "narrative"],
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<RequestPayload>
    if (!body || typeof body !== "object" || !("stage" in body)) {
      return NextResponse.json({ error: "Etapa nao informada" }, { status: 400 })
    }

    if (!("context" in body)) {
      return NextResponse.json({ error: "Contexto ausente" }, { status: 400 })
    }

    const payload = body as RequestPayload

    if (payload.stage === "insights" && !("report" in payload)) {
      return NextResponse.json({ error: "Relatorio obrigatorio para gerar insights" }, { status: 400 })
    }

    if (payload.stage === "plan" && !("insights" in payload)) {
      return NextResponse.json({ error: "Insights obrigatorios para gerar plano" }, { status: 400 })
    }

    if (payload.stage === "maturity" && (!("report" in payload) || !("plan" in payload))) {
      return NextResponse.json({ error: "Relatorio e plano obrigatorios para maturidade" }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    switch (payload.stage) {
      case "report": {
        const prompt = buildReportPrompt(payload.context)
        const response = await openai.responses.create({
          model: "gpt-5",
          input: [
            { role: "system", content: [{ type: "input_text", text: baseSystemPrompt }] },
            { role: "user", content: [{ type: "input_text", text: prompt }] },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "Mission5Report",
              schema: reportSchema,
            },
          },
        })

        const data = parseResponseJSON<Mission5Report>(response)
        return NextResponse.json({ success: true, data })
      }
      case "insights": {
        const prompt = buildInsightsPrompt(payload.context, payload.report)
        const response = await openai.responses.create({
          model: "gpt-5",
          input: [
            { role: "system", content: [{ type: "input_text", text: baseSystemPrompt }] },
            { role: "user", content: [{ type: "input_text", text: prompt }] },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "Mission5Insights",
              schema: insightsSchema,
            },
          },
        })

        const data = parseResponseJSON<Mission5InsightsOutput>(response)
        return NextResponse.json({ success: true, data })
      }
      case "plan": {
        const prompt = buildPlanPrompt(payload.context, payload.insights)
        const response = await openai.responses.create({
          model: "gpt-5",
          input: [
            { role: "system", content: [{ type: "input_text", text: baseSystemPrompt }] },
            { role: "user", content: [{ type: "input_text", text: prompt }] },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "Mission5Plan",
              schema: planSchema,
            },
          },
        })

        const data = parseResponseJSON<Mission5AdjustmentPlan>(response)
        return NextResponse.json({ success: true, data })
      }
      case "maturity": {
        const prompt = buildMaturityPrompt(payload.context, payload.report, payload.plan)
        const response = await openai.responses.create({
          model: "gpt-5",
          input: [
            { role: "system", content: [{ type: "input_text", text: baseSystemPrompt }] },
            { role: "user", content: [{ type: "input_text", text: prompt }] },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "Mission5Maturity",
              schema: maturitySchema,
            },
          },
        })

        const data = parseResponseJSON<Mission5MaturityScore>(response)
        return NextResponse.json({ success: true, data })
      }
      default:
        return NextResponse.json({ error: "Etapa invalida" }, { status: 400 })
    }
  } catch (error) {
    console.error("[MISSAO 5] Falha ao gerar analise:", error)
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function buildReportPrompt(context: Mission5Context) {
  const parts = [
    "Gere um relatorio resumido com variacoes de alcance, engajamento e clareza percebida.",
    "Inclua nivel de consistencia e frequencia de presenca.",
    "Finalize com um comentario humano e direto sobre o panorama.",
    "Use sinais positivos quando fizer sentido para evolucao.",
    buildContextBlock(context),
  ]

  return parts.filter(Boolean).join("\n")
}

function buildInsightsPrompt(context: Mission5Context, report: Mission5Report) {
  const parts = [
    "Com base no relatorio, gere exatamente 3 insights curtos e praticos.",
    "Cada insight deve indicar um ajuste concreto, um motivo quantificavel e uma justificativa resumida.",
    "Inclua uma nota final de enquadramento para situar os insights.",
    `Relatorio: Alcance ${report.reachDelta}, Engajamento ${report.engagementDelta}, Clareza ${report.clarityScore}, Consistencia ${report.consistencyLevel}, Frequencia ${report.frequency}.`,
    report.commentary ? `Comentario adicional: ${report.commentary}.` : "",
    buildContextBlock(context),
  ]

  return parts.filter(Boolean).join("\n")
}

function buildPlanPrompt(context: Mission5Context, insights: Mission5Insight[]) {
  const parts = [
    "Use os insights abaixo para montar um plano de ajuste com 3 objetivos.",
    "Comece o plano com um heading curto que resuma o foco geral.",
    "Cada objetivo deve ter acao concreta e impacto esperado em percentual.",
    "Finalize com um lembrete ou reforco motivador.",
    `Insights: ${insights.map((item) => `${item.title} -> ${item.detail}`).join(" | ")}`,
    buildContextBlock(context),
  ]

  return parts.filter(Boolean).join("\n")
}

function buildMaturityPrompt(context: Mission5Context, report: Mission5Report, plan: Mission5AdjustmentPlan) {
  const parts = [
    "Com base no contexto, no relatorio e no plano, calcule uma nota de maturidade (0 a 100).",
    "Informe tambem um estagio nominal para a marca e uma narrativa curta sobre proximos passos.",
    `Relatorio: Alcance ${report.reachDelta}, Engajamento ${report.engagementDelta}, Clareza ${report.clarityScore}, Consistencia ${report.consistencyLevel}, Frequencia ${report.frequency}.`,
    `Plano: ${plan.steps.map((step) => `${step.objective}: ${step.action} (Impacto ${step.expectedImpact})`).join(" | ")}`,
    buildContextBlock(context),
  ]

  return parts.filter(Boolean).join("\n")
}

function buildContextBlock(context: Mission5Context) {
  const fragments: string[] = []

  if (context.brandName) {
    fragments.push(`Nome da marca: ${context.brandName}.`)
  }

  if (context.creatorName) {
    fragments.push(`Responsavel: ${context.creatorName}.`)
  }

  if (context.mission1Summary) {
    fragments.push(`Missao 1 - estrategia: ${context.mission1Summary}.`)
  }

  if (context.mission2Message) {
    fragments.push(`Missao 2 - mensagem: ${context.mission2Message}.`)
  }

  if (context.mission3Identity) {
    fragments.push(`Missao 3 - identidade: ${context.mission3Identity}.`)
  }

  if (context.mission4Presence) {
    const { selectedIdeaTitle, legenda, calendarSummary, presenceFrequency } = context.mission4Presence
    fragments.push(
      [
        "Missao 4 - presenca alinhada:",
        selectedIdeaTitle ? `ideia principal "${selectedIdeaTitle}".` : undefined,
        legenda ? `Legenda final: ${legenda}.` : undefined,
        calendarSummary ? `Calendario: ${calendarSummary}.` : undefined,
        presenceFrequency ? `Frequencia atual: ${presenceFrequency}.` : undefined,
      ]
        .filter(Boolean)
        .join(" "),
    )
  }

  if (typeof context.xpAtual === "number") {
    fragments.push(`XP atual acumulado: ${context.xpAtual}.`)
  }

  if (typeof context.comparativoPercentual === "number") {
    fragments.push(`Clareza percebida anterior: ${context.comparativoPercentual} %.`)
  }

  const contextLine = fragments.join(" ") || "Sem dados adicionais. Use apenas o que foi informado."
  return `Contexto da marca: ${contextLine}`
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
