"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  BarChart3,
  Brain,
  Lightbulb,
  Lock,
  Palette,
  PenSquare,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { BrandplotCache } from "@/lib/brandplot-cache"
import { MentorRaizChat } from "./mentor-raiz-chat"

const DASHBOARD_INTRO_STORAGE_KEY = "mm_dashboard_intro_seen"

type MissionKey = "missao_1" | "missao_2" | "missao_3" | "missao_4" | "missao_5"

type MissionStatus = "locked" | "available" | "completed"

interface MissionDefinition {
  key: MissionKey
  title: string
  agent: string
  description: string
  icon: LucideIcon
}

interface MissionDisplay extends MissionDefinition {
  status: MissionStatus
  isActive: boolean
}

type AgentKey =
  | "mentor"
  | "estrategista"
  | "copywriter"
  | "designer"
  | "social"
  | "analista"

type AgentStatus = "ativo" | "aguardando" | "bloqueado"

interface AgentDefinition {
  key: AgentKey
  name: string
  description: string
  icon: LucideIcon
  tooltip?: string
}

interface AgentDisplay extends AgentDefinition {
  status: AgentStatus
}

interface RadarPoint {
  dimension: string
  value: number
}

interface DashboardData {
  userName: string
  clarityScore: number
  xp: number
  xpToNextLevel: number
  levelName: string
  xpDeltaOnUnlock: number
  comparisonPercent: number
  highestMissionUnlocked: MissionKey
  activeMission?: MissionKey
  completedMissions: MissionKey[]
  previousDiagnosis?: RadarPoint[]
}

type BrandRecord = {
  nome_empresa?: string
  nomeMarca?: string
  nomeEmpresa?: string
  scoreDiagnostico?: string | number
  missaoLiberada?: string
  missoesConcluidas?: string[] | null
  onboardingMetadata?: string | Record<string, unknown> | null
  diagnosticoAnterior?: string | Record<string, unknown> | RadarPoint[]
  xpAtual?: number
  xpProximoNivel?: number
  nivelAtual?: string
  comparativoPercentual?: number
}

const missionOrder: MissionKey[] = [
  "missao_1",
  "missao_2",
  "missao_3",
  "missao_4",
  "missao_5",
]

const missionCtaConfig: Record<MissionKey, { href: string; label: string; shortLabel: string }> = {
  missao_1: {
    href: "/missao1",
    label: "Entrar na Missao 1 — Estrategia da Marca",
    shortLabel: "Entrar na Missao 1 ->",
  },
  missao_2: {
    href: "/missao2",
    label: "Entrar na Missao 2 — Clareza da Mensagem",
    shortLabel: "Entrar na Missao 2 ->",
  },
  missao_3: {
    href: "/missao3",
    label: "Entrar na Missao 3 — Identidade Visual",
    shortLabel: "Entrar na Missao 3 ->",
  },
  missao_4: {
    href: "/missao4",
    label: "Entrar na Missao 4 — Conteudo e Presenca",
    shortLabel: "Entrar na Missao 4 ->",
  },
  missao_5: {
    href: "/missao5",
    label: "Entrar na Missao 5 — Analise e Ajuste",
    shortLabel: "Entrar na Missao 5 ->",
  },
}

const missionCatalog: Record<MissionKey, MissionDefinition> = {
  missao_1: {
    key: "missao_1",
    title: "Estratégia da Marca",
    agent: "💡 Estrategista",
    description: "Mapeie essência, proposta de valor e posicionamento.",
    icon: Lightbulb,
  },
  missao_2: {
    key: "missao_2",
    title: "Clareza da Mensagem",
    agent: "✍️ Copywriter",
    description: "Transforme estratégia em narrativa que conecta e vende.",
    icon: PenSquare,
  },
  missao_3: {
    key: "missao_3",
    title: "Identidade Visual",
    agent: "🎨 Designer",
    description: "Dê forma visual a cada ideia para ganhar consistência.",
    icon: Palette,
  },
  missao_4: {
    key: "missao_4",
    title: "Conteúdo & Presença",
    agent: "📱 Social Media",
    description: "Planeje presença constante com conteúdos alinhados.",
    icon: Smartphone,
  },
  missao_5: {
    key: "missao_5",
    title: "Análise & Ajuste",
    agent: "📊 Analista",
    description: "Meça resultados e ajuste o que for preciso para escalar.",
    icon: BarChart3,
  },
}

const agentCatalog: AgentDefinition[] = [
  {
    key: "mentor",
    name: "Mentor-Raiz",
    description: "Supervisionando sua jornada.",
    icon: Brain,
  },
  {
    key: "estrategista",
    name: "Estrategista",
    description: "Pronto para começar Missão 1.",
    icon: Lightbulb,
  },
  {
    key: "copywriter",
    name: "Copywriter",
    description: "Vai transformar sua estratégia em palavras que vendem.",
    icon: PenSquare,
    tooltip: "Você ainda não chegou nesta fase, mas o time está acompanhando 👀.",
  },
  {
    key: "designer",
    name: "Designer",
    description: "Vai dar forma à sua mensagem visual.",
    icon: Palette,
    tooltip: "Você ainda não chegou nesta fase, mas o time está acompanhando 👀.",
  },
  {
    key: "social",
    name: "Social Media",
    description: "Vai planejar e criar seus conteúdos.",
    icon: Smartphone,
    tooltip: "Você ainda não chegou nesta fase, mas o time está acompanhando 👀.",
  },
  {
    key: "analista",
    name: "Analista",
    description: "Vai medir seus resultados e otimizar tudo.",
    icon: BarChart3,
    tooltip: "Você ainda não chegou nesta fase, mas o time está acompanhando 👀.",
  },
]

const defaultDashboardData: DashboardData = {
  userName: "Criador",
  clarityScore: 42,
  xp: 120,
  xpToNextLevel: 200,
  levelName: "Aprendiz",
  xpDeltaOnUnlock: 20,
  comparisonPercent: 68,
  highestMissionUnlocked: "missao_1",
  completedMissions: [],
  previousDiagnosis: [
    { dimension: "Clareza", value: 48 },
    { dimension: "Consistência", value: 36 },
    { dimension: "Visual", value: 28 },
    { dimension: "Execução", value: 32 },
    { dimension: "Estratégia", value: 44 },
  ],
}

const badgeCatalog: Array<{
  key: MissionKey
  title: string
  description: string
}> = [
  {
    key: "missao_1",
    title: "Marca com Norte",
    description: "Complete a Missão 1 para desbloquear.",
  },
  {
    key: "missao_2",
    title: "Voz Clara",
    description: "Conquiste sua mensagem afiada.",
  },
  {
    key: "missao_3",
    title: "Identidade Viva",
    description: "Transforme conceitos em visual consistente.",
  },
  {
    key: "missao_4",
    title: "Marca em Movimento",
    description: "Marque presença com conteúdos alinhados.",
  },
  {
    key: "missao_5",
    title: "Autoridade",
    description: "Feche a jornada com análise e melhoria contínua.",
  },
]

function parseJSON<T>(value: unknown): T | null {
  if (!value) return null
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
  if (typeof value === "object") {
    return value as T
  }
  return null
}

function isMissionKey(value: unknown): value is MissionKey {
  return typeof value === "string" && missionOrder.includes(value as MissionKey)
}

function extractFirstName(name: string): string {
  if (!name) return "Criador"
  const parts = name.trim().split(/\s+/)
  return parts[0] || name
}

function computeMissionDisplays(data: DashboardData): MissionDisplay[] {
  const highestUnlockedMission =
    missionOrder.find((mission) => mission === data.highestMissionUnlocked) ?? "missao_1"
  const unlockedIndex = missionOrder.indexOf(highestUnlockedMission)
  const completed = new Set(data.completedMissions.filter(isMissionKey))

  let activeKey: MissionKey | null = null
  if (data.activeMission && missionOrder.includes(data.activeMission)) {
    activeKey = data.activeMission
  }
  if (!activeKey) {
    activeKey =
      missionOrder.find((key, index) => index <= unlockedIndex && !completed.has(key)) ??
      highestUnlockedMission
  }

  return missionOrder.map((key, index) => {
    const definition = missionCatalog[key]

    let status: MissionStatus = "locked"
    if (completed.has(key)) {
      status = "completed"
    } else if (index <= unlockedIndex) {
      status = "available"
    }

    const isActive = status === "available" && key === activeKey && !completed.has(key)

    return {
      ...definition,
      status,
      isActive,
    }
  })
}

function computeAgentDisplays(missions: MissionDisplay[]): AgentDisplay[] {
  const activeMissions = new Set(
    missions
      .filter((mission) => mission.status !== "locked")
      .map((mission) => mission.key),
  )

  return agentCatalog.map((agent) => {
    let status: AgentStatus = "bloqueado"

    if (agent.key === "mentor") {
      status = "ativo"
    } else if (agent.key === "estrategista") {
      status = activeMissions.has("missao_1") ? "ativo" : "aguardando"
    } else if (agent.key === "copywriter") {
      status = activeMissions.has("missao_2") ? "ativo" : "aguardando"
    } else if (agent.key === "designer") {
      status = activeMissions.has("missao_3") ? "ativo" : "aguardando"
    } else if (agent.key === "social") {
      status = activeMissions.has("missao_4") ? "ativo" : "aguardando"
    } else if (agent.key === "analista") {
      status = activeMissions.has("missao_5") ? "ativo" : "aguardando"
    }

    if (status === "aguardando" && !activeMissions.has("missao_1")) {
      status = "bloqueado"
    }

    return {
      ...agent,
      status,
    }
  })
}

function normalizeRadarData(value: unknown): RadarPoint[] | undefined {
  if (!value) return undefined

  const parsed = parseJSON<unknown>(value) ?? value

  if (Array.isArray(parsed)) {
    const sanitized = parsed
      .map((item) => {
        if (
          item &&
          typeof item === "object" &&
          "dimension" in item &&
          "value" in item &&
          typeof (item as RadarPoint).dimension === "string" &&
          typeof (item as RadarPoint).value === "number"
        ) {
          return item as RadarPoint
        }
        if (
          item &&
          typeof item === "object" &&
          "name" in item &&
          "value" in item &&
          typeof (item as { name: string }).name === "string" &&
          typeof (item as { value: number }).value === "number"
        ) {
          return { dimension: (item as { name: string }).name, value: (item as { value: number }).value }
        }
        return null
      })
      .filter(Boolean) as RadarPoint[]

    return sanitized.length ? sanitized : undefined
  }

  if (parsed && typeof parsed === "object") {
    const entries = Object.entries(parsed as Record<string, number>)
      .filter(([, numberValue]) => typeof numberValue === "number")
      .map(([dimension, numberValue]) => ({ dimension, value: numberValue }))

    return entries.length ? entries : undefined
  }

  return undefined
}

function mapRecordToDashboardData(record: BrandRecord): Partial<DashboardData> {
  const clarityScoreRaw = record.scoreDiagnostico
  const clarityScore =
    typeof clarityScoreRaw === "number"
      ? clarityScoreRaw
      : typeof clarityScoreRaw === "string"
        ? Number.parseInt(clarityScoreRaw, 10)
        : undefined

  const highestMission = isMissionKey(record.missaoLiberada)
    ? record.missaoLiberada
    : record.missaoLiberada === "todas"
      ? "missao_5"
      : undefined

  const metadata = parseJSON<Record<string, unknown> | null>(record.onboardingMetadata)

  const metadataCompleted = Array.isArray(metadata?.missoesConcluidas)
    ? (metadata?.missoesConcluidas.filter(isMissionKey) as MissionKey[])
    : undefined

  const explicitCompleted = Array.isArray(record.missoesConcluidas)
    ? (record.missoesConcluidas.filter(isMissionKey) as MissionKey[])
    : undefined

  const completedMissions = metadataCompleted ?? explicitCompleted ?? []
  const hasCompletedMission1 = completedMissions.includes("missao_1")

  const xpAtual =
    typeof metadata?.xpAtual === "number"
      ? metadata?.xpAtual
      : typeof record.xpAtual === "number"
        ? record.xpAtual
        : undefined

  const xpProximoNivel =
    typeof metadata?.xpProximoNivel === "number"
      ? metadata?.xpProximoNivel
      : typeof record.xpProximoNivel === "number"
        ? record.xpProximoNivel
        : undefined

  const nivelAtual =
    typeof metadata?.nivelAtual === "string"
      ? metadata?.nivelAtual
      : typeof record.nivelAtual === "string"
        ? record.nivelAtual
        : undefined

  const comparison =
    typeof metadata?.comparativoPercentual === "number"
      ? metadata?.comparativoPercentual
      : typeof record.comparativoPercentual === "number"
        ? record.comparativoPercentual
        : undefined

  const activeMission =
    typeof metadata?.missaoAtual === "string" && isMissionKey(metadata.missaoAtual)
      ? metadata.missaoAtual
      : undefined

  const previousDiagnosis =
    normalizeRadarData(metadata?.diagnosticoAnterior) ?? normalizeRadarData(record.diagnosticoAnterior)

  const userName =
    typeof record.nome_empresa === "string"
      ? record.nome_empresa
      : typeof record.nomeEmpresa === "string"
        ? record.nomeEmpresa
        : typeof record.nomeMarca === "string"
          ? record.nomeMarca
          : undefined

  const baselineClarity = clarityScore ?? defaultDashboardData.clarityScore
  const adjustedClarity = hasCompletedMission1 ? Math.min(100, baselineClarity + 7) : clarityScore

  const baselineXp = xpAtual ?? defaultDashboardData.xp
  const adjustedXp = hasCompletedMission1 ? baselineXp + 80 : xpAtual

  const baselineXpTarget = xpProximoNivel ?? defaultDashboardData.xpToNextLevel
  const adjustedXpTarget = hasCompletedMission1 ? Math.max(baselineXpTarget, baselineXp + 140) : xpProximoNivel

  const baselineLevel = nivelAtual ?? defaultDashboardData.levelName
  const adjustedLevel = hasCompletedMission1 ? `${baselineLevel} 2.0` : nivelAtual

  const baselineComparison = comparison ?? defaultDashboardData.comparisonPercent
  const adjustedComparison = hasCompletedMission1 ? Math.min(100, baselineComparison + 7) : comparison

  const baselineRadar = previousDiagnosis ?? defaultDashboardData.previousDiagnosis
  const adjustedRadar = hasCompletedMission1
    ? baselineRadar.map((point) => ({
        dimension: point.dimension,
        value: Math.min(100, point.value + 10),
      }))
    : previousDiagnosis

  return {
    userName,
    clarityScore: adjustedClarity ?? baselineClarity,
    highestMissionUnlocked: highestMission,
    completedMissions,
    xp: adjustedXp ?? baselineXp,
    xpToNextLevel: adjustedXpTarget ?? baselineXpTarget,
    levelName: adjustedLevel ?? baselineLevel,
    comparisonPercent: adjustedComparison ?? baselineComparison,
    activeMission,
    previousDiagnosis: adjustedRadar,
  }
}

function mergeDashboardData(
  base: DashboardData,
  updates: Partial<DashboardData>,
): DashboardData {
  return {
    userName: updates.userName ?? base.userName,
    clarityScore: updates.clarityScore ?? base.clarityScore,
    xp: updates.xp ?? base.xp,
    xpToNextLevel: updates.xpToNextLevel ?? base.xpToNextLevel,
    levelName: updates.levelName ?? base.levelName,
    xpDeltaOnUnlock: updates.xpDeltaOnUnlock ?? base.xpDeltaOnUnlock,
    comparisonPercent: updates.comparisonPercent ?? base.comparisonPercent,
    highestMissionUnlocked: updates.highestMissionUnlocked ?? base.highestMissionUnlocked,
    activeMission: updates.activeMission ?? base.activeMission,
    completedMissions: updates.completedMissions ?? base.completedMissions,
    previousDiagnosis: updates.previousDiagnosis ?? base.previousDiagnosis,
  }
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>(defaultDashboardData)
  const [isIntroVisible, setIsIntroVisible] = useState(false)
  const [introWasTriggered, setIntroWasTriggered] = useState(false)
  const [showXpPulse, setShowXpPulse] = useState(false)
  const [showValueToast, setShowValueToast] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const hasSeenIntro = window.localStorage.getItem(DASHBOARD_INTRO_STORAGE_KEY)
    if (!hasSeenIntro) {
      setIsIntroVisible(true)
      setIntroWasTriggered(true)
      window.localStorage.setItem(DASHBOARD_INTRO_STORAGE_KEY, "true")
    }
  }, [])

  useEffect(() => {
    if (!introWasTriggered) return

    const INTRO_HIDE_DELAY = 8000
    const timer = window.setTimeout(() => {
      setIsIntroVisible(false)
      setIntroWasTriggered(false)
      setShowXpPulse(true)
    }, INTRO_HIDE_DELAY)

    return () => {
      window.clearTimeout(timer)
    }
  }, [introWasTriggered])

  useEffect(() => {
    if (!showXpPulse) return

    const XP_PULSE_HIDE_DELAY = 10000
    const xpTimer = window.setTimeout(() => {
      setShowXpPulse(false)
    }, XP_PULSE_HIDE_DELAY)

    return () => {
      window.clearTimeout(xpTimer)
    }
  }, [showXpPulse])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 240) {
        setShowValueToast(true)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    const toastTimer = window.setTimeout(() => {
      setShowValueToast(false)
    }, 12000)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.clearTimeout(toastTimer)
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      let idUnico: string | null = null

      try {
        idUnico = BrandplotCache.getIdUnico()
      } catch {
        idUnico = null
      }

      if (!idUnico) {
        try {
          idUnico = window.localStorage?.getItem("brandplot_idUnico") ?? null
        } catch {
          idUnico = null
        }
      }

      if (!idUnico) return

      try {
        const response = await fetch(`/api/brand-data?idUnico=${encodeURIComponent(idUnico)}`)
        if (!response.ok) return

        const result = await response.json()
        if (!result?.success || !result?.data) return

        const mapped = mapRecordToDashboardData(result.data as BrandRecord)
        setData((prev) => mergeDashboardData(prev, mapped))
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error)
      }
    }

    loadData()
  }, [])

  const dismissIntro = useCallback(() => {
    setIsIntroVisible(false)
    setIntroWasTriggered(false)
    setShowXpPulse(true)
  }, [])

  const missions = useMemo(() => computeMissionDisplays(data), [data])
  const agents = useMemo(() => computeAgentDisplays(missions), [missions])
  const firstName = useMemo(() => extractFirstName(data.userName), [data.userName])
  const levelProgress = useMemo(() => {
    if (!data.xpToNextLevel) return 0
    const percentage = Math.round((data.xp / data.xpToNextLevel) * 100)
    return Math.max(0, Math.min(100, Number.isFinite(percentage) ? percentage : 0))
  }, [data.xp, data.xpToNextLevel])
  const activeMission = missions.find((mission) => mission.isActive) ?? missions[0]
  const activeMissionCta = missionCtaConfig[activeMission.key]
  const completedMissionSummaries = useMemo(
    () =>
      missions
        .filter((mission) => mission.status === "completed")
        .map(({ key, title, description }) => ({ key, title, description })),
    [missions],
  )
  const nextMissionForChat = useMemo(() => {
    const available = missions.find((mission) => mission.status === "available")
    if (available) return available
    return missions.find((mission) => mission.status !== "completed") ?? null
  }, [missions])
  const xpTarget = data.xpToNextLevel || data.xp + 80

  return (
    <TooltipProvider delayDuration={120}>
      <div className="relative min-h-screen bg-gradient-to-br from-white via-[#f8f8fb] to-[#eef6ff] pb-20">
        <AnimatePresence>
          {isIntroVisible && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="fixed inset-x-4 bottom-6 z-30 flex justify-end sm:inset-auto sm:right-6 sm:bottom-6"
            >
              <div className="flex w-full max-w-[360px] items-end gap-3">
                <div className="hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[#f0e9ff] to-[#d5f4ff] text-[#6c58c8] shadow-lg shadow-[#bbc6ff]/40 sm:flex">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="relative w-full rounded-3xl border border-[#e0dcff] bg-white/95 px-5 py-4 text-[#211b45] shadow-[0_20px_45px_rgba(120,108,255,0.18)] backdrop-blur-md">
                  <div className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-[#7f6bc8]">
                    <Sparkles className="h-3.5 w-3.5 text-[#9c89ff]" />
                    <span>Liberacao confirmada</span>
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#3b3762]">
                    <p>
                      Excelente decisao,{" "}
                      <span className="font-semibold text-[#211b45]">{firstName || "por aqui"}</span>! Seu investimento
                      foi confirmado e o time Menos Mais ja esta a postos.
                    </p>
                    <p>
                      Voce agora tem acesso total a sua <strong>Sala da Marca</strong>, nosso centro de comando para
                      acompanhar progresso, missoes e evolucao em clareza.
                    </p>
                    <p className="font-semibold text-[#211b45]">Vamos dar uma olhada?</p>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={dismissIntro}
                      className="rounded-full bg-gradient-to-r from-[#a17cff] to-[#5fd6ff] px-4 py-2 text-xs font-semibold text-white shadow-none transition hover:from-[#8f78ff] hover:to-[#54cfff]"
                    >
                      Vamos la
                    </Button>
                    <button
                      type="button"
                      onClick={dismissIntro}
                      className="text-xs font-medium uppercase tracking-[0.3em] text-[#7f6bc8] transition hover:text-[#5f52b8]"
                    >
                      Depois
                    </button>
                  </div>
                  <span className="absolute bottom-5 -left-2 hidden h-5 w-5 rotate-45 border-b border-l border-[#e0dcff] bg-white/95 sm:block" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.main
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-10 pt-16 sm:px-6 lg:px-10"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
            <section className="flex flex-1 flex-col justify-between rounded-3xl border border-[#e2e2f6] bg-white/90 p-8 shadow-xl shadow-[#c8d6ff]/20">
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#9e7cf2]">
                      Sala da Marca
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight text-[#1c1c1c] sm:text-4xl">
                      Clareza da Marca: {Math.round(data.clarityScore)}%
                    </h1>
                  </div>

                </div>

                <p className="max-w-lg text-base text-[#4f4f63]">
                  “A cada missão, sua marca ganha mais foco e coerência. Continue e veja esse número subir.”
                </p>
              </div>
              <MentorRaizChat
                companyName={data.userName}
                completedMissions={completedMissionSummaries}
                nextMission={
                  nextMissionForChat
                    ? {
                        key: nextMissionForChat.key,
                        title: nextMissionForChat.title,
                        description: nextMissionForChat.description,
                      }
                    : null
                }
                className="mt-6"
              />
            </section>

            <section className="relative overflow-hidden rounded-3xl border border-[#dedefb] bg-gradient-to-br from-[#faf7ff] via-white to-[#eef6ff] p-8 shadow-lg shadow-[#d2defa]/40 lg:w-80">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9e7cf2]">
                    Nível da Marca
                  </span>
                  <h2 className="mt-2 text-2xl font-semibold text-[#1c1c1c]">{data.levelName}</h2>
                </div>
                <ShieldCheck className="h-8 w-8 text-[#9e7cf2]" />
              </div>

              <div className="mt-7 space-y-4">
                <div className="flex items-center justify-between text-sm font-medium text-[#5b5b72]">
                  <span>XP: {data.xp}</span>
                  <span>{xpTarget} para próximo nível</span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/60">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#9e7cf2] via-[#7f94ff] to-[#5dd6ff]"
                  />
                </div>
                <p className="text-xs text-[#67688a]">
                  Você está {Math.round(data.comparisonPercent)}% à frente de quem iniciou com a gente.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[#8a8ab0]">
                  Selos desbloqueáveis
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {badgeCatalog.map((badge) => {
                    const unlocked = data.completedMissions.includes(badge.key)
                    return (
                      <div
                        key={badge.key}
                        className={cn(
                          "flex flex-col rounded-2xl border px-4 py-3 text-xs font-semibold transition",
                          unlocked
                            ? "border-[#b5a3ff] bg-white text-[#433f6b] shadow-sm shadow-[#c6bbff]/60"
                            : "border-[#e4e4f7] bg-white/70 text-[#9a9ab5]",
                        )}
                      >
                        <span className="text-base">
                          {unlocked ? <Star className="h-4 w-4 text-[#9e7cf2]" /> : <Lock className="h-4 w-4" />}
                        </span>
                        <p className="mt-2">{badge.title}</p>
                        <span className="mt-1 text-[0.7rem] font-normal text-[#78789b]">{badge.description}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-[#d9dcff] bg-white/95 p-8 shadow-xl shadow-[#cdd8ff]/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[#1c1c1c]">Mapa de Missões</h2>
                <p className="text-sm text-[#63648a]">
                  Acompanhe cada agente e status. Complete para liberar a próxima fase.
                </p>
              </div>
              <div className="flex w-full flex-col items-start gap-3 sm:w-auto sm:items-end sm:text-right">
                <Badge className="rounded-full bg-[#9e7cf2]/10 px-4 py-2 text-[#7c63d4] sm:self-end">
                  Mentor-Raiz acompanha tudo em tempo real
                </Badge>
                <Button
                  asChild
                  size="lg"
                  className="group h-auto w-full rounded-full border-none bg-gradient-to-r from-[#7151ff] via-[#9b6cff] to-[#52d5ff] px-7 py-3 text-base font-semibold text-white shadow-[0_14px_30px_rgba(113,81,255,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(113,81,255,0.32)] focus-visible:ring-white/60 focus-visible:ring-offset-0 sm:w-auto"
                >
                  <Link href={activeMissionCta.href} className="flex items-center justify-center gap-3">
                    <span>{activeMissionCta.label}</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {missions.map((mission) => {
                const Icon = mission.icon
                const statusLabel =
                  mission.status === "completed"
                    ? "✅ Concluída"
                    : mission.status === "available"
                      ? "🔓 Liberada"
                      : "🔒 Bloqueada"

                return (
                  <motion.div
                    key={mission.key}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={cn(
                      "relative flex h-full flex-col justify-between rounded-3xl border bg-white/90 p-6 shadow-[0_12px_32px_rgba(158,124,242,0.08)] transition-all",
                      mission.status !== "locked"
                        ? "border-[#d3c8ff] hover:-translate-y-1 hover:border-[#9e7cf2]"
                        : "border-[#ececff] opacity-80",
                    )}
                  >
                    {mission.isActive ? (
                      <motion.span
                        layout
                        className="absolute -inset-px rounded-[26px] border border-[#9e7cf2]/40"
                        animate={{ boxShadow: ["0 0 0 0 rgba(158,124,242,0.15)", "0 0 0 12px rgba(158,124,242,0)"] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                      />
                    ) : null}

                    <div className="flex items-center justify-between gap-3">
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg",
                          mission.status !== "locked"
                            ? "bg-gradient-to-br from-[#9e7cf2] to-[#5dd6ff]"
                            : "bg-[#d8d8f5] text-[#666682]",
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          mission.status === "completed"
                            ? "bg-[#e2fbe1] text-[#1d7a34]"
                            : mission.status === "available"
                              ? "bg-[#f1ecff] text-[#5a4aff]"
                              : "bg-[#f5f5fb] text-[#8b8ba5]",
                        )}
                      >
                        {statusLabel}
                      </span>
                    </div>

              <div className="mt-6 space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f8fb4]">
                    {mission.agent}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-[#1f1f33]">{mission.title}</h3>
                </div>
                <p className="text-sm text-[#5b5c77]">{mission.description}</p>
              </div>

              {mission.status !== "locked" ? (
                <Button
                  asChild
                  variant="ghost"
                  className="mt-6 w-full justify-center rounded-full border border-[#d8d4ff] bg-white text-sm font-semibold text-[#5a4aff] hover:border-[#b9b2ff] hover:bg-[#f4f2ff]"
                >
                  <Link href={missionCtaConfig[mission.key].href}>Entrar na missão</Link>
                </Button>
              ) : (
                <p className="mt-6 text-center text-xs text-[#8f8fb4]">
                  Conclua a etapa anterior para liberar
                </p>
              )}
            </motion.div>
          )
        })}
      </div>

          </section>

          <section className="rounded-3xl border border-[#dbe4ff] bg-white/95 p-8 shadow-xl shadow-[#d2ddff]/40">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-semibold text-[#1c1c1c]">Time Menos Mais (Agentes IA)</h2>
              <p className="text-sm text-[#5f5f7b]">
                Cada agente entra em cena conforme novas missões liberam. O Mentor-Raiz envia mensagens automáticas a cada avanço.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {agents.map((agent) => {
                const Icon = agent.icon
                const statusBadge =
                  agent.status === "ativo"
                    ? { label: "Ativo", className: "bg-[#e6f9ef] text-[#1d7a34]" }
                    : agent.status === "aguardando"
                      ? { label: "Aguardando", className: "bg-[#fef6e8] text-[#b8812f]" }
                      : { label: "Bloqueado", className: "bg-[#f4f4fb] text-[#8181a1]" }

                const card = (
                  <motion.div
                    key={agent.key}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative flex h-full flex-col justify-between rounded-3xl border border-[#ececff] bg-white/80 p-6 shadow-[0_16px_32px_rgba(90,74,255,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9e7cf2]/10 to-[#5dd6ff]/10 text-[#6a55c8]">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusBadge.className)}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="mt-6 space-y-2">
                      <h3 className="text-lg font-semibold text-[#1f1f33]">{agent.name}</h3>
                      <p className="text-sm text-[#565671]">{agent.description}</p>
                    </div>
                  </motion.div>
                )

                if (agent.status === "bloqueado" && agent.tooltip) {
                  return (
                    <Tooltip key={agent.key}>
                      <TooltipTrigger asChild>{card}</TooltipTrigger>
                      <TooltipContent className="max-w-xs rounded-2xl border border-[#e5e7ff] bg-white p-4 text-sm text-[#5c5d80] shadow-lg shadow-[#d0d5ff]/50">
                        {agent.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return card
              })}
            </div>
          </section>
        </motion.main>

        <AnimatePresence>
          {showXpPulse && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="pointer-events-none fixed bottom-10 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[#d7d7ff] bg-white/90 px-4 py-2 text-sm font-semibold text-[#5a4aff] shadow-xl shadow-[#c7ccff]/80"
            >
              +{data.xpDeltaOnUnlock}XP por desbloquear a Sala da Marca
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showValueToast && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.4 }}
              className="fixed bottom-8 right-8 z-20 max-w-sm rounded-3xl border border-[#e1e1ff] bg-white/95 p-5 shadow-[0_16px_32px_rgba(90,74,255,0.12)]"
            >
              <div className="flex items-start gap-3">
                <Brain className="mt-0.5 h-5 w-5 text-[#9e7cf2]" />
                <div className="space-y-2 text-sm text-[#50506c]">
                  <p>
                    <strong>Mentor-Raiz:</strong> Cada missão é um passo real na construção da sua marca. Continue e me avise quando subir de nível!
                  </p>
                  <p className="text-xs text-[#7a7b91]">
                    Novas mensagens aparecerão sempre que você avançar.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </TooltipProvider>
  )
}
