"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Gauge,
  Loader2,
  Rocket,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react"

import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BrandplotCache } from "@/lib/brandplot-cache"
import { toast } from "@/hooks/use-toast"
import type { Mission4Results } from "@/lib/missao4-types"
import type {
  Mission5AdjustmentPlan,
  Mission5Context,
  Mission5Insight,
  Mission5InsightsOutput,
  Mission5MaturityScore,
  Mission5Report,
  Mission5Results,
} from "@/lib/missao5-types"

type MissionPhase = "intro" | "report" | "insights" | "plan" | "maturity" | "complete"
type LoadingStage = "report" | "insights" | "plan" | "maturity" | "persist" | null

type ChatRole = "analyst" | "mentor"

type OptionDefinition = {
  id: string
  label: string
  variant?: "primary" | "secondary"
}

type ChatMessage =
  | { id: string; kind: "text"; role: ChatRole; text: string; tone?: "default" | "note" | "celebration" }
  | { id: string; kind: "cta"; role: ChatRole; prompt: string; actions: OptionDefinition[] }
  | { id: string; kind: "loading"; role: ChatRole; text?: string }
  | { id: string; kind: "report"; role: "analyst"; report: Mission5Report }
  | { id: string; kind: "insights"; role: "analyst"; insights: Mission5Insight[]; framingNote?: string }
  | { id: string; kind: "plan"; role: "analyst"; plan: Mission5AdjustmentPlan }
  | { id: string; kind: "maturity"; role: "analyst"; maturity: Mission5MaturityScore }

type MissionStepId = "report" | "insights" | "plan" | "maturity"

const missionSteps: Array<{ id: MissionStepId; title: string; description: string }> = [
  { id: "report", title: "Relatorio de resultados", description: "Simulacao de alcance, engajamento e clareza." },
  { id: "insights", title: "Insights acionaveis", description: "Tres ajustes praticos com foco em impacto rapido." },
  { id: "plan", title: "Plano de ajuste", description: "Tres objetivos com acao e impacto esperado." },
  { id: "maturity", title: "Nota de maturidade", description: "Pontuacao final e estagio da marca." },
]

const MotionDiv = motion.div
const MISSION5_STORAGE_KEY = "missao5_result"

type BrandRecord = {
  idUnico?: string | null
  nomeMarca?: string | null
  nome_empresa?: string | null
  missoesConcluidas?: string[] | null
  onboardingMetadata?: string | Record<string, unknown> | null
  estrategia?: string | Record<string, unknown> | null
  xpAtual?: number | null
  xpProximoNivel?: number | null
  comparativoPercentual?: number | null
  nivelAtual?: string | null
}

export default function Mission5Page() {
  return (
    <ProtectedRoute>
      <Mission5Content />
    </ProtectedRoute>
  )
}

function Mission5Content() {
  const router = useRouter()
  const [phase, setPhase] = useState<MissionPhase>("intro")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null)
  const [report, setReport] = useState<Mission5Report | null>(null)
  const [insights, setInsights] = useState<Mission5Insight[]>([])
  const [plan, setPlan] = useState<Mission5AdjustmentPlan | null>(null)
  const [maturity, setMaturity] = useState<Mission5MaturityScore | null>(null)
  const [finalResults, setFinalResults] = useState<Mission5Results | null>(null)
  const [brandRecord, setBrandRecord] = useState<BrandRecord | null>(null)
  const [strategyData, setStrategyData] = useState<Record<string, unknown> | null>(null)
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null)
  const [context, setContext] = useState<Mission5Context | null>(null)
  const [mission5Restoring, setMission5Restoring] = useState(false)
  const [idUnico, setIdUnico] = useState<string | null>(null)
  const [creatorName, setCreatorName] = useState<string | null>(null)
  const [introDispatched, setIntroDispatched] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const listRef = useRef<HTMLDivElement | null>(null)
  const messageId = useRef(0)

  const nextMessageId = useCallback(() => {
    messageId.current += 1
    return `msg-${messageId.current}`
  }, [])

  useEffect(() => {
    const cached = BrandplotCache.get()
    if (cached) {
      if (cached.idUnico) setIdUnico(cached.idUnico)
      if (cached.companyName) setCreatorName(cached.companyName)
    }
  }, [])

  useEffect(() => {
    if (idUnico) {
      fetchBrandRecord(idUnico)
    }
  }, [idUnico])

  useEffect(() => {
    tryRestoreFromStorage()
  }, [])

  useEffect(() => {
    if (context && !introDispatched && !mission5Restoring) {
      dispatchIntro()
    }
  }, [context, introDispatched, mission5Restoring])

  useEffect(() => {
    if (messages.length > 0) {
      const handle = setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
        }
      }, 40)
      return () => clearTimeout(handle)
    }
  }, [messages])

  const stepStatuses = useMemo(
    () => ({
      report: Boolean(report),
      insights: insights.length === 3,
      plan: Boolean(plan),
      maturity: Boolean(maturity),
    }),
    [report, insights, plan, maturity],
  )

  const showProgressAside = phase !== "intro" || Boolean(report)

  async function fetchBrandRecord(id: string) {
    try {
      const response = await fetch(`/api/brand-data?idUnico=${encodeURIComponent(id)}`)
      if (!response.ok) {
        console.warn("Falha ao buscar dados da marca para Missao 5:", await response.text())
        return
      }

      const json = (await response.json()) as { data?: BrandRecord }
      if (!json?.data) return

      const record = json.data
      setBrandRecord(record)

      if (record.estrategia) {
        const strategy =
          typeof record.estrategia === "string"
            ? (JSON.parse(record.estrategia) as Record<string, unknown>)
            : (record.estrategia as Record<string, unknown>)

        setStrategyData(strategy ?? null)
        hydrateMissionContext(strategy)

        const mission5 = strategy?.missao5 as Mission5Results | undefined
        if (mission5?.report && mission5?.insights?.length) {
          restoreMission5(mission5)
        }
      }

      if (record.onboardingMetadata) {
        const parsed =
          typeof record.onboardingMetadata === "string"
            ? (JSON.parse(record.onboardingMetadata) as Record<string, unknown>)
            : (record.onboardingMetadata as Record<string, unknown>)
        setMetadata(parsed ?? null)
      }
    } catch (error) {
      console.warn("Nao foi possivel recuperar dados da marca (Missao 5):", error)
    }
  }

  function hydrateMissionContext(strategy: Record<string, unknown>) {
    const mission1 = strategy?.missao1 as { resumo?: { q1?: string; q2?: string[] } } | undefined
    const mission2 = strategy?.missao2 as { selectedPhrase?: string; subtitle?: string; insight?: string } | undefined
    const mission3 = strategy?.missao3 as { direction?: { name?: string; summary?: string }; toneReminder?: string } | undefined
    const mission4 = strategy?.missao4 as Mission4Results | undefined

    const contextPayload: Mission5Context = {
      brandName: brandRecord?.nomeMarca ?? brandRecord?.nome_empresa ?? undefined,
      creatorName: creatorName ?? undefined,
      mission1Summary: mission1?.resumo?.q1
        ? `Essencia: ${mission1.resumo.q1}. Pilares: ${(mission1.resumo.q2 ?? []).join(", ")}.`
        : undefined,
      mission2Message: mission2?.selectedPhrase
        ? `Mensagem central: ${mission2.selectedPhrase}. Complemento: ${mission2.subtitle ?? "sem subtitulo"}. Insight: ${mission2.insight ?? "sem insight adicional"}.`
        : undefined,
      mission3Identity: mission3?.direction?.name
        ? `Direcao visual ${mission3.direction.name} - ${mission3.direction.summary ?? "sem resumo"}. Tom: ${mission3.toneReminder ?? "nao informado"}.`
        : undefined,
      mission4Presence: mission4
        ? {
            selectedIdeaTitle:
              mission4.ideas?.find((idea) => idea.id === mission4.selectedIdeaId)?.title ?? mission4.ideas?.[0]?.title,
            legenda: mission4.legenda?.text,
            calendarSummary: mission4.calendar?.entries
              ?.map((entry) => `${entry.day}: ${entry.theme}`)
              .slice(0, 3)
              .join(" | "),
            presenceFrequency: `${mission4.calendar?.entries?.length ?? 5} dias / semana`,
          }
        : null,
      xpAtual: typeof brandRecord?.xpAtual === "number" ? brandRecord.xpAtual : undefined,
      comparativoPercentual:
        typeof brandRecord?.comparativoPercentual === "number" ? brandRecord.comparativoPercentual : undefined,
    }

    setContext(contextPayload)
  }

  function restoreMission5(results: Mission5Results) {
    setMission5Restoring(true)
    setReport(results.report)
    setInsights(results.insights)
    setPlan(results.plan)
    setMaturity(results.maturity)
    setFinalResults(results)
    setPhase("complete")
    setIntroDispatched(true)

    const restoredMessages: ChatMessage[] = [
      { id: nextMessageId(), kind: "report", role: "analyst", report: results.report },
      { id: nextMessageId(), kind: "insights", role: "analyst", insights: results.insights },
      { id: nextMessageId(), kind: "plan", role: "analyst", plan: results.plan },
      { id: nextMessageId(), kind: "maturity", role: "analyst", maturity: results.maturity },
      {
        id: nextMessageId(),
        kind: "text",
        role: "analyst",
        tone: "note",
        text: "Tudo registrado na Sala da Marca. Se quiser rodar outro ciclo, e so me avisar.",
      },
      {
        id: nextMessageId(),
        kind: "text",
        role: "mentor",
        tone: "celebration",
        text: "Missao 5 concluida | +200 XP | Selo Marca Clara | Clareza 98 -> 100 %",
      },
      {
        id: nextMessageId(),
        kind: "text",
        role: "mentor",
        text: "Sua marca percorreu o ciclo completo Menos Mais. Continue comigo na Sala da Marca para evoluir quando quiser.",
      },
    ]

    setMessages(restoredMessages)
    setMission5Restoring(false)
  }

  function tryRestoreFromStorage() {
    try {
      if (typeof window === "undefined") return
      const stored = window.localStorage?.getItem(MISSION5_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Mission5Results
        if (parsed?.report && parsed?.insights?.length) {
          restoreMission5(parsed)
        }
      }
    } catch (error) {
      console.warn("Nao foi possivel restaurar Missao 5 do storage local:", error)
    }
  }

  function dispatchIntro() {
    if (introDispatched) return
    setIntroDispatched(true)

    const displayName = creatorName ?? context?.creatorName ?? "por aqui"

    const introMessages: ChatMessage[] = [
      { id: nextMessageId(), kind: "text", role: "analyst", text: `Oi, ${displayName}.` },
      {
        id: nextMessageId(),
        kind: "text",
        role: "analyst",
        text: "Sou o Analista da Menos Mais - meu trabalho e mostrar o que esta funcionando na sua marca e o que pode melhorar.",
      },
      {
        id: nextMessageId(),
        kind: "text",
        role: "analyst",
        tone: "note",
        text: "Sem planilhas chatas. Vou traduzir os sinais mais importantes do seu ciclo.",
      },
      {
        id: nextMessageId(),
        kind: "cta",
        role: "analyst",
        prompt: "Vamos analisar?",
        actions: [{ id: "start-report", label: "Ver analise", variant: "primary" }],
      },
    ]

    setMessages(introMessages)
  }
  async function handleAction(actionId: string) {
    switch (actionId) {
      case "start-report":
        await startReportStage()
        return
      case "request-plan":
        await generatePlanStage()
        return
      case "go-dashboard":
        router.push("/dashboard")
        return
      case "explore-sala":
        window.open("https://menosmais.club/sala", "_blank", "noopener,noreferrer")
        return
      default:
        return
    }
  }

  async function startReportStage() {
    if (!context) {
      toast({
        title: "Contexto incompleto",
        description: "Volte para a Sala da Marca e confirme as missoes anteriores.",
        variant: "destructive",
      })
      return
    }

    setPhase("report")
    setLoadingStage("report")

    const loadingId = nextMessageId()
    appendMessage({
      id: loadingId,
      kind: "loading",
      role: "analyst",
      text: "Interpretando seus ultimos movimentos...",
    })

    try {
      const reportResult = await requestMission5<Mission5Report>({
        stage: "report",
        context: buildMissionContext(),
      })

      setReport(reportResult)

      replaceMessage(loadingId, {
        id: nextMessageId(),
        kind: "report",
        role: "analyst",
        report: reportResult,
      })

      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "analyst",
        text: "Sua marca esta evoluindo rapido. Mas sempre da para otimizar.",
      })

      await generateInsightsStage(reportResult)
    } catch (error) {
      console.error("Erro ao gerar relatorio da Missao 5:", error)
      replaceMessage(loadingId, {
        id: loadingId,
        kind: "text",
        role: "analyst",
        tone: "note",
        text: "Nao consegui fechar o relatorio agora. Tente novamente em instantes.",
      })
      toast({
        title: "Falha ao gerar analise",
        description: "Tente novamente em breve.",
        variant: "destructive",
      })
    } finally {
      setLoadingStage(null)
    }
  }

  async function generateInsightsStage(reportResult: Mission5Report) {
    setPhase("insights")
    setLoadingStage("insights")

    const loadingId = nextMessageId()
    appendMessage({
      id: loadingId,
      kind: "loading",
      role: "analyst",
      text: "Buscando padroes e oportunidades...",
    })

    try {
      const response = await requestMission5<Mission5InsightsOutput>({
        stage: "insights",
        context: buildMissionContext(),
        report: reportResult,
      })

      setInsights(response.insights)

      replaceMessage(loadingId, {
        id: nextMessageId(),
        kind: "insights",
        role: "analyst",
        insights: response.insights,
        framingNote: response.framingNote,
      })

      appendMessage({
        id: nextMessageId(),
        kind: "cta",
        role: "analyst",
        prompt: "Quer que eu monte um plano de ajuste com base nisso?",
        actions: [{ id: "request-plan", label: "Quero o plano", variant: "primary" }],
      })
    } catch (error) {
      console.error("Erro ao gerar insights da Missao 5:", error)
      replaceMessage(loadingId, {
        id: loadingId,
        kind: "text",
        role: "analyst",
        tone: "note",
        text: "Nao consegui gerar os insights agora. Tente mais tarde.",
      })
      toast({
        title: "Falha ao gerar insights",
        description: "Recarregue a pagina ou tente de novo.",
        variant: "destructive",
      })
    } finally {
      setLoadingStage(null)
    }
  }

  async function generatePlanStage() {
    if (!report || insights.length < 3) {
      toast({
        title: "Relatorio incompleto",
        description: "Rode a analise antes de pedir o plano.",
        variant: "destructive",
      })
      return
    }

    setPhase("plan")
    setLoadingStage("plan")

    const loadingId = nextMessageId()
    appendMessage({
      id: loadingId,
      kind: "loading",
      role: "analyst",
      text: "Construindo um plano direto e aplicavel...",
    })

    try {
      const planResult = await requestMission5<Mission5AdjustmentPlan>({
        stage: "plan",
        context: buildMissionContext(),
        insights,
      })

      setPlan(planResult)

      replaceMessage(loadingId, {
        id: nextMessageId(),
        kind: "plan",
        role: "analyst",
        plan: planResult,
      })

      await generateMaturityStage(planResult)
    } catch (error) {
      console.error("Erro ao gerar plano da Missao 5:", error)
      replaceMessage(loadingId, {
        id: loadingId,
        kind: "text",
        role: "analyst",
        tone: "note",
        text: "Nao consegui montar o plano agora. Tente de novo em instantes.",
      })
      toast({
        title: "Plano nao gerado",
        description: "Tente novamente em alguns segundos.",
        variant: "destructive",
      })
    } finally {
      setLoadingStage(null)
    }
  }

  async function generateMaturityStage(planResult: Mission5AdjustmentPlan) {
    if (!report) return

    setPhase("maturity")
    setLoadingStage("maturity")

    const loadingId = nextMessageId()
    appendMessage({
      id: loadingId,
      kind: "loading",
      role: "analyst",
      text: "Calculando nota de maturidade...",
    })

    try {
      const maturityResult = await requestMission5<Mission5MaturityScore>({
        stage: "maturity",
        context: buildMissionContext(),
        report: report,
        plan: planResult,
      })

      setMaturity(maturityResult)

      replaceMessage(loadingId, {
        id: nextMessageId(),
        kind: "maturity",
        role: "analyst",
        maturity: maturityResult,
      })

      await finalizeMission(planResult, maturityResult)
    } catch (error) {
      console.error("Erro ao gerar maturidade da Missao 5:", error)
      replaceMessage(loadingId, {
        id: loadingId,
        kind: "text",
        role: "analyst",
        tone: "note",
        text: "Nao consegui fechar a nota agora. Vamos tentar de novo depois.",
      })
      toast({
        title: "Falha ao gerar nota",
        description: "Tente novamente em breve.",
        variant: "destructive",
      })
    } finally {
      setLoadingStage(null)
    }
  }

  async function finalizeMission(planResult: Mission5AdjustmentPlan, maturityResult: Mission5MaturityScore) {
    if (!report || insights.length < 3) return
    setPhase("complete")
    setLoadingStage("persist")

    const mentorLoadingId = nextMessageId()
    appendMessage({
      id: mentorLoadingId,
      kind: "loading",
      role: "mentor",
      text: "Mentor-Raiz validando e atualizando sua Sala da Marca...",
    })

    try {
      const results = finalResults ?? buildMissionResults(planResult, maturityResult)
      await persistMissionResults(results)
      setShowConfetti(true)

      replaceMessage(mentorLoadingId, {
        id: nextMessageId(),
        kind: "text",
        role: "mentor",
        tone: "celebration",
        text: "Missao 5 concluida | +200 XP | Selo Marca Clara | Clareza 98 -> 100 %",
      })

      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "mentor",
        text: "Parabens. Voce concluiu o ciclo completo Menos Mais. Agora e hora de consolidar autoridade.",
      })

      appendMessage({
        id: nextMessageId(),
        kind: "cta",
        role: "mentor",
        prompt: "Quer manter o time por perto na Sala da Marca?",
        actions: [
          { id: "explore-sala", label: "Assinar por R$19,90/mes", variant: "primary" },
          { id: "go-dashboard", label: "Voltar para o dashboard" },
        ],
      })
    } catch (error) {
      console.error("Erro ao persistir Missao 5:", error)
      replaceMessage(mentorLoadingId, {
        id: mentorLoadingId,
        kind: "text",
        role: "mentor",
        tone: "note",
        text: "Recebi os resultados, mas nao consegui salvar agora. Atualize a pagina ou tente novamente.",
      })
      toast({
        title: "Falha ao atualizar dashboard",
        description: "Tente outra vez em instantes.",
        variant: "destructive",
      })
    } finally {
      setLoadingStage(null)
      setTimeout(() => setShowConfetti(false), 5000)
    }
  }

  function buildMissionResults(planResult: Mission5AdjustmentPlan, maturityResult: Mission5MaturityScore): Mission5Results {
    if (!report) {
      throw new Error("Relatorio ausente ao consolidar Missao 5")
    }

    const generatedAt = new Date().toISOString()
    const results: Mission5Results = {
      generatedAt,
      report: report,
      insights,
      plan: planResult,
      maturity: maturityResult,
    }

    setFinalResults(results)

    try {
      if (typeof window !== "undefined") {
        window.localStorage?.setItem(MISSION5_STORAGE_KEY, JSON.stringify(results))
      }
    } catch (error) {
      console.warn("Nao foi possivel salvar Missao 5 no storage local:", error)
    }

    return results
  }

  async function persistMissionResults(results: Mission5Results) {
    if (!idUnico) {
      throw new Error("ID unico nao encontrado para atualizar o dashboard.")
    }

    const updatedStrategy = { ...(strategyData ?? {}) }
    updatedStrategy.missao5 = results
    setStrategyData(updatedStrategy)

    const existingMetadata = metadata ? { ...metadata } : {}
    const completed = new Set<string>(
      Array.isArray(existingMetadata.missoesConcluidas)
        ? (existingMetadata.missoesConcluidas as string[])
        : Array.isArray(brandRecord?.missoesConcluidas)
          ? (brandRecord?.missoesConcluidas as string[])
          : [],
    )

    completed.add("missao_1")
    completed.add("missao_2")
    completed.add("missao_3")
    completed.add("missao_4")
    completed.add("missao_5")

    const xpBase =
      typeof existingMetadata.xpAtual === "number"
        ? (existingMetadata.xpAtual as number)
        : typeof brandRecord?.xpAtual === "number"
          ? (brandRecord?.xpAtual as number)
          : 0
    const xpAtualizado = xpBase + 200

    const comparativo = 100

    const metadataAtualizada: Record<string, unknown> = {
      ...existingMetadata,
      missaoAtual: "missao_5",
      missoesConcluidas: Array.from(completed),
      xpAtual: xpAtualizado,
      xpProximoNivel:
        typeof existingMetadata.xpProximoNivel === "number"
          ? existingMetadata.xpProximoNivel
          : brandRecord?.xpProximoNivel ?? xpAtualizado + 300,
      comparativoPercentual: comparativo,
      nivelAtual: existingMetadata.nivelAtual ?? brandRecord?.nivelAtual ?? "Marca Clara",
    }

    setMetadata(metadataAtualizada)

    const response = await fetch("/api/brand-data", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idUnico,
        estrategia: updatedStrategy,
        missaoLiberada: "missao_5",
        onboardingMetadata: metadataAtualizada,
        xpAtual: xpAtualizado,
        comparativoPercentual: comparativo,
      }),
    })

    if (!response.ok) {
      throw new Error(await response.text())
    }

    BrandplotCache.update({
      answers: [
        report.reachDelta,
        report.engagementDelta,
        planResultSummary(results.plan),
        `Nota ${results.maturity.score}`,
      ].filter(Boolean),
    })
  }

  function planResultSummary(value: Mission5AdjustmentPlan) {
    return value.steps.map((step) => `${step.objective}: ${step.expectedImpact}`).join(" | ")
  }

  function appendMessage(message: ChatMessage) {
    setMessages((prev) => [...prev, message])
  }

  function replaceMessage(id: string, updated: ChatMessage) {
    setMessages((prev) => prev.map((message) => (message.id === id ? updated : message)))
  }

  function buildMissionContext(): Mission5Context {
    return {
      ...(context ?? {}),
      brandName: brandRecord?.nomeMarca ?? brandRecord?.nome_empresa ?? context?.brandName,
      creatorName: creatorName ?? context?.creatorName,
      xpAtual:
        typeof metadata?.xpAtual === "number"
          ? (metadata?.xpAtual as number)
          : typeof brandRecord?.xpAtual === "number"
            ? brandRecord.xpAtual
            : context?.xpAtual,
      comparativoPercentual:
        typeof metadata?.comparativoPercentual === "number"
          ? (metadata?.comparativoPercentual as number)
          : typeof brandRecord?.comparativoPercentual === "number"
            ? brandRecord.comparativoPercentual
            : context?.comparativoPercentual,
    }
  }

  async function requestMission5<T>(payload: Record<string, unknown>): Promise<T> {
    const response = await fetch("/api/missao5/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || "Erro ao chamar API da Missao 5")
    }

    const json = (await response.json()) as { data: T }
    return json.data
  }
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#f5f2ff] via-[#eef6ff] to-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-9 w-9 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500">Missao 5</p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-900">Analise & Ajuste</h1>
              </div>
            </div>
            <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-sm font-semibold text-sky-700">
              Analista ativo
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Medir, aprender e evoluir a cada ciclo. Vamos ler seus resultados recentes, destacar oportunidades e montar o plano do proximo passo.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="relative flex h-[720px] flex-col rounded-3xl border border-slate-200 bg-white/90 shadow-lg shadow-slate-200/40">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Analista IA</p>
                  <p className="text-xs text-slate-500">Eu nao olho so numeros, eu olho padroes.</p>
                </div>
              </div>
            </div>

            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <MotionDiv
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ChatBubble message={message} onAction={handleAction} />
                  </MotionDiv>
                ))}
              </AnimatePresence>
              {loadingStage && (
                <MotionDiv
                  key={`loading-${loadingStage}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex w-full justify-start">
                    <div className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                      {loadingStage === "persist" ? "Atualizando Sala da Marca..." : "Processando..."}
                    </div>
                  </div>
                </MotionDiv>
              )}
            </div>

            {showConfetti && <ConfettiOverlay />}
          </section>

          {showProgressAside && (
            <aside className="flex flex-col gap-5">
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-md shadow-slate-200/40">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-indigo-100 p-2 text-indigo-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Checklist da missao</p>
                    <p className="text-xs text-slate-500">Cada etapa gera um ativo novo no dashboard.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {missionSteps.map((step) => {
                    const completed = stepStatuses[step.id]
                    return (
                      <div
                        key={step.id}
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-sm",
                          completed ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{step.title}</span>
                          <span
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                              completed ? "bg-indigo-500 text-white" : "border border-dashed border-slate-300 text-slate-400",
                            )}
                          >
                            {completed ? "OK" : step.title.slice(0, 1)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs">{step.description}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 text-sm text-slate-600 shadow-md shadow-slate-200/30">
                <div className="mb-2 flex items-center gap-2 text-slate-700">
                  <Target className="h-5 w-5 text-sky-500" />
                  <span className="font-semibold">Lembrete</span>
                </div>
                <p>Cada insight vira um ajuste real. Refaca a missao quando quiser comparar ciclos e medir evolucao.</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 text-sm text-slate-600 shadow-md shadow-slate-200/30">
                <div className="mb-2 flex items-center gap-2 text-slate-700">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span className="font-semibold">Gamificacao</span>
                </div>
                <ul className="list-disc pl-5 text-xs leading-relaxed">
                  <li>+200 XP automatico</li>
                  <li>Selo "Marca Clara"</li>
                  <li>Barra de clareza em 100%</li>
                  <li>Confete liberado ao concluir</li>
                </ul>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

function ChatBubble({ message, onAction }: { message: ChatMessage; onAction: (actionId: string) => void }) {
  if (message.kind === "loading") {
    return (
      <div className="flex w-full justify-start">
        <div className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          {message.text ?? "Processando..."}
        </div>
      </div>
    )
  }

  if (message.kind === "cta") {
    return (
      <div className="flex w-full justify-start">
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-5 shadow-sm">
          <p className="text-sm font-semibold text-indigo-800">{message.prompt}</p>
          <div className="flex flex-wrap gap-2">
            {message.actions.map((action) => (
              <Button
                key={action.id}
                onClick={() => onAction(action.id)}
                variant={action.variant === "primary" ? "default" : "outline"}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold",
                  action.variant === "primary"
                    ? "bg-indigo-500 text-white hover:bg-indigo-600"
                    : "border border-indigo-200 text-indigo-600 hover:bg-indigo-100",
                )}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (message.kind === "report") {
    const { report } = message
    return (
      <div className="flex w-full justify-start">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">Panorama da marca</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <MetricCard icon={Rocket} label="Alcance" value={report.reachDelta} />
            <MetricCard icon={Sparkles} label="Engajamento" value={report.engagementDelta} />
            <MetricCard icon={Gauge} label="Clareza percebida" value={report.clarityScore} />
            <MetricCard icon={CheckCircle2} label="Consistencia" value={report.consistencyLevel} />
          </div>
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Frequencia de presenca: <strong>{report.frequency}</strong>
            {report.commentary ? <span className="mt-1 block text-xs text-slate-500">{report.commentary}</span> : null}
          </div>
        </div>
      </div>
    )
  }

  if (message.kind === "insights") {
    return (
      <div className="flex w-full justify-start">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">Tres insights para subir o nivel</p>
          <div className="mt-3 space-y-3">
            {message.insights.map((insight, index) => (
              <div key={insight.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">Insight {index + 1}</p>
                <p className="mt-1 font-semibold text-slate-800">{insight.title}</p>
                <p>{insight.detail}</p>
                {insight.rationale ? <p className="mt-1 text-xs text-slate-500">{insight.rationale}</p> : null}
              </div>
            ))}
          </div>
          {message.framingNote ? <p className="mt-2 text-xs text-slate-500">Nota: {message.framingNote}</p> : null}
        </div>
      </div>
    )
  }

  if (message.kind === "plan") {
    return (
      <div className="flex w-full justify-start">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">Plano de ajuste</p>
          <div className="mt-3 space-y-3">
            {message.plan.steps.map((step, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">Objetivo {index + 1}</p>
                <p className="mt-1 font-semibold text-slate-800">{step.objective}</p>
                <p>{step.action}</p>
                <p className="mt-1 text-xs text-slate-500">Impacto esperado: {step.expectedImpact}</p>
              </div>
            ))}
          </div>
          {message.plan.reminder ? <p className="mt-2 text-xs text-slate-500">{message.plan.reminder}</p> : null}
        </div>
      </div>
    )
  }

  if (message.kind === "maturity") {
    return (
      <div className="flex w-full justify-start">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">Nota de maturidade</p>
          <div className="mt-3 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-bold text-indigo-600 shadow-inner">
              {message.maturity.score}
            </div>
            <div>
              <p className="font-semibold text-slate-800">Estagio: {message.maturity.stage}</p>
              {message.maturity.narrative ? <p className="text-xs text-slate-500">{message.maturity.narrative}</p> : null}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full justify-start">
      <div
        className={cn(
          "w-full rounded-2xl border bg-white p-5 text-sm leading-relaxed shadow-sm",
          message.role === "mentor" ? "border-amber-200 text-slate-800" : "border-slate-200 text-slate-700",
          message.tone === "note" ? "border-dashed text-slate-500" : "",
          message.tone === "celebration" ? "border-green-200 bg-green-50 text-green-700 font-semibold" : "",
        )}
      >
        {message.text}
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Rocket; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-indigo-600 shadow-inner">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-indigo-500">{label}</p>
        <p className="font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function ConfettiOverlay() {
  const pieces = 40

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {Array.from({ length: pieces }).map((_, index) => (
          <motion.span
            key={index}
            initial={{ y: -20, opacity: 0 }}
            animate={{
              y: 720,
              opacity: [0, 1, 1, 0],
              rotate: index % 2 === 0 ? 120 : -120,
            }}
            transition={{
              duration: 3.2,
              delay: index * 0.04,
              ease: "easeOut",
            }}
            className="absolute h-2 w-4 rounded-full"
            style={{
              top: -20,
              left: `${(index * 37) % 100}%`,
              background: index % 3 === 0 ? "#6366f1" : index % 3 === 1 ? "#38bdf8" : "#facc15",
            }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  )
}


