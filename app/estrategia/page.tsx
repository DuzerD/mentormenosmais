"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  CircleDot,
  Loader2,
  MessageCircle,
  Rocket,
  Sparkles,
  Star,
  Target,
  Users,
  Volume2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { BrandplotCache } from "@/lib/brandplot-cache"

type Role = "estrategista" | "usuario" | "mentor" | "sistema"
type ActionId = "go-dashboard" | "continue-mission2" | "mentor-liberar" | "mentor-revisar"

type MissionOption = {
  label: string
  value: string
  emoji?: string
  description?: string
}

interface MissionStep {
  id: "q1" | "q2" | "q3" | "q4" | "q5"
  stageTitle: string
  question: string
  type: "single" | "singleWithOther" | "multi" | "text"
  options?: MissionOption[]
  placeholder?: string
  otherPlaceholder?: string
  feedback: string
}

interface SummaryData {
  name: string
  q1: string
  q2: string[]
  q3: string
  q4: string[]
  q5: string
}

type Message =
  | {
      id: string
      kind: "text"
      role: Role
      text: string
      tone?: "default" | "feedback" | "system" | "celebration"
    }
  | {
      id: string
      kind: "question"
      stageTitle: string
      question: string
    }
  | {
      id: string
      kind: "summary"
      role: "estrategista" | "mentor"
      summary: SummaryData
    }
  | {
      id: string
      kind: "cta"
      role: Role
      text?: string
      actions: { id: ActionId; label: string }[]
    }
  | {
      id: string
      kind: "loading"
      text: string
    }

type BrandRecord = {
  idUnico?: string | null
  nome_empresa?: string | null
  nomeMarca?: string | null
  nomeEmpresa?: string | null
  scoreDiagnostico?: string | number | null
  missaoLiberada?: string | null
  missoesConcluidas?: string[] | null
  onboardingMetadata?: string | Record<string, unknown> | null
  estrategia?: string | Record<string, unknown> | null
  xpAtual?: number | null
  xpProximoNivel?: number | null
  nivelAtual?: string | null
  comparativoPercentual?: number | null
  diagnosticoAnterior?: string | Record<string, unknown> | null
}

type RadarPoint = {
  dimension: string
  value: number
}

const DEFAULT_RADAR_BASE: RadarPoint[] = [
  { dimension: "Clareza", value: 48 },
  { dimension: "Consistencia", value: 36 },
  { dimension: "Visual", value: 28 },
  { dimension: "Execucao", value: 32 },
  { dimension: "Estrategia", value: 44 },
]

function parseRecordField<T>(value: unknown): T | null {
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

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  return null
}

function toStringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function normalizeMission1Responses(data: typeof initialResponses) {
  return {
    q1: data.q1,
    q1Other: data.q1Other,
    q2: [...data.q2],
    q3: data.q3,
    q4: [...data.q4],
    q4Other: data.q4Other,
    q5: data.q5,
  }
}

const missionSteps: MissionStep[] = [
  {
    id: "q1",
    stageTitle: "Etapa 1 – O que você realmente vende",
    question: "Quando alguém te procura, o que essa pessoa quer resolver?",
    type: "singleWithOther",
    options: [
      {
        label: "Economizar tempo",
        value: "economizar tempo",
        emoji: "??",
        description: "Simplificar processos e ganhar horas na agenda.",
      },
      {
        label: "Vender mais",
        value: "vender mais",
        emoji: "??",
        description: "Transformar interesse em vendas com previsibilidade.",
      },
      {
        label: "Parecer mais profissional",
        value: "parecer mais profissional",
        emoji: "??",
        description: "Refinar a imagem para transmitir confiança.",
      },
      {
        label: "Entender melhor o próprio negócio",
        value: "entender melhor o proprio negocio",
        emoji: "??",
        description: "Organizar ideias e enxergar o caminho estratégico.",
      },
      {
        label: "Outro (campo aberto)",
        value: "Outro",
        emoji: "??",
        description: "Descreva com suas palavras o resultado que busca.",
      },
    ],
    otherPlaceholder: "Conte com suas palavras qual transformação você entrega",
    feedback:
      "Perfeito. O que você vende de verdade é a transformação que entrega — e acabamos de descobrir qual é a sua.",
  },
  {
    id: "q2",
    stageTitle: "Etapa 2 – Quem mais valoriza isso",
    question: "Quem costuma comprar mais de você?",
    type: "multi",
    options: [
      {
        label: "Pessoas físicas",
        value: "pessoas fisicas (autonomos, criadores)",
        emoji: "?????",
        description: "Autônomos, criadores e profissionais liberais.",
      },
      {
        label: "Pequenas empresas",
        value: "pequenas empresas",
        emoji: "??",
        description: "Times enxutos que precisam de suporte próximo.",
      },
      {
        label: "Médias e grandes empresas",
        value: "empresas medias/grandes",
        emoji: "???",
        description: "Estruturas maiores com processos definidos.",
      },
      {
        label: "Quero começar a vender",
        value: "ainda nao vendo, mas quero comecar",
        emoji: "??",
        description: "Estou estruturando a oferta para chegar aos primeiros clientes.",
      },
    ],
    feedback:
      "Entendi. Esse é o público que mais sente o valor do que você faz — e onde sua mensagem precisa ser mais clara.",
  },
  {
    id: "q3",
    stageTitle: "Etapa 3 – Como você quer ser lembrado",
    question: "Se alguém falar da sua marca, o que você gostaria que essa pessoa dissesse?",
    type: "text",
    placeholder: "Ex: Eles são os que sempre entregam rápido.",
    feedback: "Excelente! Isso começa a moldar como sua marca deve ser percebida.",
  },
  {
    id: "q4",
    stageTitle: "Etapa 4 – O que te diferencia sem complicar",
    question: "O que as pessoas elogiam quando falam de você ou do seu produto?",
    type: "multi",
    options: [
      {
        label: "Atendimento acolhedor",
        value: "atendimento",
        emoji: "??",
        description: "Acompanhamento cuidadoso em cada etapa.",
      },
      {
        label: "Qualidade impecável",
        value: "qualidade",
        emoji: "??",
        description: "Entrega com padrão elevado e consistência.",
      },
      {
        label: "Estética marcante",
        value: "estetica",
        emoji: "??",
        description: "Visual que chama atenção e reforça a marca.",
      },
      {
        label: "Agilidade no resultado",
        value: "agilidade",
        emoji: "?",
        description: "Respostas rápidas e execução eficiente.",
      },
      {
        label: "Clareza estratégica",
        value: "clareza",
        emoji: "??",
        description: "Explica o caminho com segurança e simplicidade.",
      },
      {
        label: "Outro diferencial",
        value: "Outro",
        emoji: "?",
        description: "Compartilhe o que mais destacam sobre você.",
      },
    ],
    otherPlaceholder: "Qual é esse outro diferencial que sempre citam?",
    feedback:
      "Ótimo. Diferencial não é algo inventado — é o que já te destacam sem você perceber.",
  },
  {
    id: "q5",
    stageTitle: "Etapa 5 – Tom de voz e energia",
    question: "Se sua marca fosse uma pessoa, como ela falaria?",
    type: "single",
    options: [
      {
        label: "Simpática e leve",
        value: "simpatica e leve",
        emoji: "??",
        description: "Conversas acolhedoras, com humor na medida.",
      },
      {
        label: "Direta e objetiva",
        value: "direta e objetiva",
        emoji: "??",
        description: "Vai ao ponto, sem rodeios ou floreios.",
      },
      {
        label: "Inspiradora",
        value: "inspiradora",
        emoji: "??",
        description: "Motiva e puxa a visão de futuro.",
      },
      {
        label: "Criativa e divertida",
        value: "criativa e divertida",
        emoji: "??",
        description: "Cheia de referências, ideias e boas histórias.",
      },
    ],
    feedback:
      "Perfeito! Isso define como você vai se comunicar daqui pra frente — e o Copywriter vai usar esse tom.",
  },
]

const checklistStages = [
  {
    id: "q1",
    title: "Etapa 1",
    description: "O que voce realmente vende",
  },
  {
    id: "q2",
    title: "Etapa 2",
    description: "Quem mais valoriza isso",
  },
  {
    id: "q3",
    title: "Etapa 3",
    description: "Como voce quer ser lembrado",
  },
  {
    id: "q4",
    title: "Etapa 4",
    description: "O que te diferencia sem complicar",
  },
  {
    id: "q5",
    title: "Etapa 5",
    description: "Tom de voz e energia",
  },
  {
    id: "summary",
    title: "Etapa 6",
    description: "Mapa enviado ao Mentor-Raiz",
  },
]

const totalSteps = missionSteps.length

const initialResponses = {
  q1: "",
  q1Other: "",
  q2: [] as string[],
  q3: "",
  q4: [] as string[],
  q4Other: "",
  q5: "",
}

function formatList(items: string[]): string {
  const clean = items.map((item) => item.trim()).filter((item) => item.length > 0)
  if (clean.length === 0) return ""
  if (clean.length === 1) return clean[0]
  if (clean.length === 2) return `${clean[0]} e ${clean[1]}`
  return `${clean.slice(0, -1).join(", ")} e ${clean[clean.length - 1]}`
}

function computeSummary(responses: typeof initialResponses, name: string): SummaryData {
  const q1 = responses.q1 === "Outro" ? responses.q1Other.trim() : responses.q1.trim()
  const q2 = responses.q2.map((item) => item.trim()).filter(Boolean)
  const q3 = responses.q3.trim()
  const q4 = responses.q4
    .map((item) => (item === "Outro" ? responses.q4Other.trim() : item.trim()))
    .filter(Boolean)
  const q5 = responses.q5.trim()

  return {
    name,
    q1,
    q2,
    q3,
    q4,
    q5,
  }
}

function unique(array: string[]) {
  return Array.from(new Set(array))
}

function getFirstName(name?: string | null) {
  if (!name) return "Mentorado"
  const [first] = name.trim().split(/\s+/)
  return first || "Mentorado"
}

export default function StrategyPage() {
  const router = useRouter()
  const [creatorName, setCreatorName] = useState("Mentorado")
  const [idUnico, setIdUnico] = useState<string | null>(null)
  const [responses, setResponses] = useState(initialResponses)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [phase, setPhase] = useState<"intro" | "input" | "summary" | "mentor">("intro")
  const [activeStageId, setActiveStageId] = useState<string>("q1")
  const [completedStages, setCompletedStages] = useState<string[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [finalSummary, setFinalSummary] = useState<SummaryData | null>(null)
  const [mentorSequenceTriggered, setMentorSequenceTriggered] = useState(false)
  const [introDispatched, setIntroDispatched] = useState(false)
  const [brandRecord, setBrandRecord] = useState<BrandRecord | null>(null)
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null)
  const [strategyData, setStrategyData] = useState<Record<string, unknown> | null>(null)
  const [lastPersistedSummaryKey, setLastPersistedSummaryKey] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const messageCounterRef = useRef(0)
  const responsesRef = useRef(initialResponses)
  const persistInFlightRef = useRef(false)
  const summaryPersistPromiseRef = useRef<Promise<boolean> | null>(null)

  const nextMessageId = () => {
    messageCounterRef.current += 1
    return `msg-${messageCounterRef.current}`
  }

  useEffect(() => {
    responsesRef.current = responses
  }, [responses])

  useEffect(() => {
    if (typeof window === "undefined") return
    const cache = BrandplotCache.get()
    const cacheName = cache?.companyName ? getFirstName(cache.companyName) : null
    if (cache?.idUnico) {
      setIdUnico(cache.idUnico)
    } else {
      const stored = window.localStorage?.getItem("brandplot_idUnico")
      if (stored) setIdUnico(stored)
    }

    if (cacheName) {
      setCreatorName(cacheName)
    }

    const idToFetch = cache?.idUnico ?? window.localStorage?.getItem("brandplot_idUnico")
    if (!idToFetch) return

    ;(async () => {
      try {
        const response = await fetch(`/api/brand-data?idUnico=${encodeURIComponent(idToFetch)}`)
        if (!response.ok) throw new Error("brand-data request failed")
        const result = await response.json()
        const data = result?.data as BrandRecord | undefined
        if (!data) return

        setBrandRecord(data)

        const nameFromData =
          data.nome_empresa ??
          data.nomeEmpresa ??
          data.nomeMarca ??
          (typeof result?.data?.nome_empresa === "string" ? (result.data.nome_empresa as string) : null)
        if (nameFromData) {
          setCreatorName(getFirstName(nameFromData))
        }

        const parsedMetadata = parseRecordField<Record<string, unknown>>(data.onboardingMetadata)
        if (parsedMetadata) {
          setMetadata(parsedMetadata)
        }

        const parsedStrategy = parseRecordField<Record<string, unknown>>(data.estrategia)
        if (parsedStrategy) {
          setStrategyData(parsedStrategy)

          const mission1Block = parsedStrategy.missao1 as Record<string, unknown> | undefined
          const storedResponses = mission1Block?.respostas as Record<string, unknown> | undefined
          if (storedResponses) {
            setResponses((prev) => ({
              ...prev,
              q1: toStringValue(storedResponses.q1) ?? prev.q1,
              q1Other: toStringValue(storedResponses.q1Other) ?? prev.q1Other,
              q2: Array.isArray(storedResponses.q2)
                ? (storedResponses.q2.filter((item): item is string => typeof item === "string") as string[])
                : prev.q2,
              q3: toStringValue(storedResponses.q3) ?? prev.q3,
              q4: Array.isArray(storedResponses.q4)
                ? (storedResponses.q4.filter((item): item is string => typeof item === "string") as string[])
                : prev.q4,
              q4Other: toStringValue(storedResponses.q4Other) ?? prev.q4Other,
              q5: toStringValue(storedResponses.q5) ?? prev.q5,
            }))
          }
        }

        BrandplotCache.update({
          idUnico: data.idUnico ?? idToFetch,
          companyName: nameFromData ?? cacheName ?? undefined,
          scoreDiagnostico:
            typeof data.scoreDiagnostico === "number"
              ? String(data.scoreDiagnostico)
              : typeof data.scoreDiagnostico === "string"
                ? data.scoreDiagnostico
                : undefined,
        })
      } catch (error) {
        console.warn("Falha ao buscar nome da marca:", error)
      }
    })()
  }, [])

  const persistMissionSummary = useCallback(
    async (summary: SummaryData) => {
      if (!idUnico) return

      const responsesSnapshot = responsesRef.current
      const missionPayload = {
        respostas: normalizeMission1Responses(responsesSnapshot),
        resumo: summary,
        atualizadoEm: new Date().toISOString(),
      }

      const nextStrategy: Record<string, unknown> = {
        ...(strategyData ?? {}),
        missao1: missionPayload,
      }

      const metadataClone: Record<string, unknown> = metadata ? { ...metadata } : {}

      const completedSet = new Set<string>()
      const appendCompleted = (value: unknown) => {
        if (!value) return
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (typeof item === "string") completedSet.add(item)
          })
        }
      }
      appendCompleted(metadataClone.missoesConcluidas)
      appendCompleted(brandRecord?.missoesConcluidas ?? null)

      const alreadyCompleted = completedSet.has("missao_1")
      completedSet.add("missao_1")

      const baseXp = toNumber(metadataClone.xpAtual) ?? toNumber(brandRecord?.xpAtual) ?? 0
      const xpAtualizado = alreadyCompleted ? baseXp : baseXp + 80

      const baseXpProximoNivel =
        toNumber(metadataClone.xpProximoNivel) ?? toNumber(brandRecord?.xpProximoNivel) ?? xpAtualizado + 120
      const xpProximoNivelAtualizado = Math.max(baseXpProximoNivel, xpAtualizado + 120)

      const baseComparativo =
        toNumber(metadataClone.comparativoPercentual) ?? toNumber(brandRecord?.comparativoPercentual) ?? 62
      const comparativoAtualizado = alreadyCompleted ? baseComparativo : Math.max(baseComparativo, 75)

      const nivelBase =
        toStringValue(metadataClone.nivelAtual) ?? toStringValue(brandRecord?.nivelAtual) ?? "Aprendiz"

      let baseClarity = 62
      const claritySource = brandRecord?.scoreDiagnostico
      if (typeof claritySource === "number" && Number.isFinite(claritySource)) {
        baseClarity = claritySource
      } else if (typeof claritySource === "string") {
        const parsed = Number.parseInt(claritySource, 10)
        if (Number.isFinite(parsed)) {
          baseClarity = parsed
        }
      }
      const clarityAtualizada = alreadyCompleted ? baseClarity : Math.max(baseClarity, 75)

      const currentLiberada =
        typeof brandRecord?.missaoLiberada === "string" ? brandRecord?.missaoLiberada : null
      const missaoLiberadaAtualizada =
        currentLiberada && (currentLiberada === "missao_2" || currentLiberada === "todas")
          ? currentLiberada
          : "missao_2"

      const radarBase =
        parseRecordField<RadarPoint[]>(metadataClone.diagnosticoAnterior) ??
        parseRecordField<RadarPoint[]>(brandRecord?.diagnosticoAnterior) ??
        DEFAULT_RADAR_BASE

      metadataClone.missaoAtual = "missao_2"
      metadataClone.missoesConcluidas = Array.from(completedSet)
      metadataClone.xpAtual = xpAtualizado
      metadataClone.xpProximoNivel = xpProximoNivelAtualizado
      metadataClone.comparativoPercentual = comparativoAtualizado
      metadataClone.nivelAtual = nivelBase
      metadataClone.diagnosticoAnterior = radarBase

      const payload = {
        idUnico,
        estrategia: nextStrategy,
        missaoLiberada: missaoLiberadaAtualizada,
        onboardingMetadata: metadataClone,
        xpAtual: xpAtualizado,
        xpProximoNivel: xpProximoNivelAtualizado,
        comparativoPercentual: comparativoAtualizado,
        nivelAtual: nivelBase,
        scoreDiagnostico: clarityAtualizada,
        diagnosticoAnterior: radarBase,
      }

      const response = await fetch("/api/brand-data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Falha ao atualizar dados da missao 1")
      }

      setStrategyData(nextStrategy)
      setMetadata(metadataClone)
      setBrandRecord((prev) => ({
        ...(prev ?? {}),
        missaoLiberada: missaoLiberadaAtualizada,
        estrategia: nextStrategy,
        onboardingMetadata: metadataClone,
        xpAtual: xpAtualizado,
        xpProximoNivel: xpProximoNivelAtualizado,
        comparativoPercentual: comparativoAtualizado,
        nivelAtual: nivelBase,
        scoreDiagnostico: clarityAtualizada,
        diagnosticoAnterior: radarBase,
      }))

      const answersForCache = [
        summary.q1,
        summary.q3,
        summary.q5,
        ...summary.q2,
        ...summary.q4,
      ].filter((value): value is string => Boolean(value && value.length > 0))

      const cacheName =
        brandRecord?.nome_empresa ?? brandRecord?.nomeEmpresa ?? brandRecord?.nomeMarca ?? creatorName

      BrandplotCache.update({
        idUnico,
        companyName: cacheName,
        answers: answersForCache,
        scoreDiagnostico: String(clarityAtualizada),
      })
    },
    [brandRecord, creatorName, idUnico, metadata, strategyData],
  )

  const ensureMissionSummarySynced = useCallback(async (): Promise<boolean> => {
    if (!finalSummary || !idUnico) {
      return false
    }

    const summaryKey = JSON.stringify(finalSummary)

    if (!persistInFlightRef.current && summaryKey === lastPersistedSummaryKey) {
      return true
    }

    if (summaryPersistPromiseRef.current) {
      try {
        return await summaryPersistPromiseRef.current
      } catch {
        return false
      }
    }

    persistInFlightRef.current = true
    const promise = (async () => {
      try {
        await persistMissionSummary(finalSummary)
        setLastPersistedSummaryKey(summaryKey)
        return true
      } catch (error) {
        console.error("Falha ao persistir Missao 1:", error)
        return false
      } finally {
        persistInFlightRef.current = false
        summaryPersistPromiseRef.current = null
      }
    })()

    summaryPersistPromiseRef.current = promise
    return promise
  }, [finalSummary, idUnico, lastPersistedSummaryKey, persistMissionSummary])

  useEffect(() => {
    if (!introDispatched && creatorName) {
      const firstStep = missionSteps[0]
      setMessages([
        {
          id: nextMessageId(),
          kind: "text",
          role: "estrategista",
          text: `Oi, ${creatorName}! ? Eu sou o Estrategista da Menos Mais — minha missão é te ajudar a encontrar o norte da sua marca, mesmo que você ainda não saiba explicar direito o que faz.`,
        },
        {
          id: nextMessageId(),
          kind: "text",
          role: "estrategista",
          text: "Vamos descobrir isso juntos?",
        },
        {
          id: nextMessageId(),
          kind: "question",
          stageTitle: firstStep.stageTitle,
          question: firstStep.question,
        },
      ])
      setActiveStageId(firstStep.id)
      setPhase("input")
      setIntroDispatched(true)
    }
  }, [creatorName, introDispatched])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (typeof window === "undefined" || !finalSummary) return
    const payload = {
      idUnico,
      respostas: {
        q1: finalSummary.q1,
        q2: finalSummary.q2,
        q3: finalSummary.q3,
        q4: finalSummary.q4,
        q5: finalSummary.q5,
      },
      atualizadoEm: new Date().toISOString(),
    }
    try {
      window.localStorage?.setItem("missao1_respostas", JSON.stringify(payload))
    } catch (error) {
      console.warn("Falha ao salvar respostas da missao 1:", error)
    }
  }, [finalSummary, idUnico])

  useEffect(() => {
    if (!finalSummary) return
    ensureMissionSummarySynced()
  }, [finalSummary, ensureMissionSummarySynced])

  const progress = useMemo(() => {
    const completedUnique = unique(completedStages)
    return Math.min(100, Math.round((completedUnique.length / checklistStages.length) * 100))
  }, [completedStages])

  const currentStep = phase === "input" ? missionSteps[currentStepIndex] : null

  const canProceed = useMemo(() => {
    if (!currentStep) return false
    return !getStepError(currentStep, responses)
  }, [currentStep, responses])

  function handleResetMission() {
    setResponses(initialResponses)
    setValidationError(null)
    setCurrentStepIndex(0)
    setPhase("intro")
    setActiveStageId("q1")
    setCompletedStages([])
    setMessages([])
    setFinalSummary(null)
    setMentorSequenceTriggered(false)
    setIntroDispatched(false)
    setLastPersistedSummaryKey(null)
    persistInFlightRef.current = false
    responsesRef.current = initialResponses
  }

  async function handleAction(action: ActionId, label?: string) {
    if (action === "go-dashboard") {
      router.push("/dashboard")
      return
    }

    if (action === "continue-mission2") {
      if (!finalSummary || mentorSequenceTriggered) return
      setMentorSequenceTriggered(true)
      const userMessage: Message = {
        id: nextMessageId(),
        kind: "text",
        role: "usuario",
        text: label ?? "Quero enviar para o Mentor aprovar",
      }
      const loadingId = nextMessageId()
      const loadingMessage: Message = {
        id: loadingId,
        kind: "loading",
        text: "? Enviando para revisão...",
      }
      setMessages((prev) => [...prev, userMessage, loadingMessage])
      setPhase("mentor")
      const summaryForMentor = finalSummary
      setTimeout(() => {
        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.id !== loadingId)
          return [
            ...filtered,
            {
              id: nextMessageId(),
              kind: "text",
              role: "mentor",
              text: `Recebi o relatório do Estrategista, ${summaryForMentor.name}. Parabéns por concluir sua primeira missão. ??`,
            },
            {
              id: nextMessageId(),
              kind: "text",
              role: "mentor",
              text: "Acabei de aprovar tudo por aqui. Você agora tem um norte claro - algo que a maioria das marcas passa anos tentando definir. A partir de agora, todas as decisões vão girar em torno disso.",
            },
            {
              id: nextMessageId(),
              kind: "text",
              role: "mentor",
              text: "Isso é mais do que um mapa - é a essência da sua marca. Conte comigo para manter esse norte vivo em cada decisão.",
            },
            {
              id: nextMessageId(),
              kind: "text",
              role: "mentor",
              text: `Excelente trabalho, ${summaryForMentor.name}.\nAgora que temos o norte, é hora de aprender a falar com o mundo.\n\nNa próxima missão, o Copywriter vai transformar essa estratégia em mensagens que vendem, te ajudando a explicar o que você faz em segundos — sem parecer vendedor.\n\nPronto pra avançar?`,
            },
            {
              id: nextMessageId(),
              kind: "cta",
              role: "mentor",
              actions: [
                { id: "mentor-liberar", label: "Sim, quero liberar a Missão 2 ??" },
                { id: "mentor-revisar", label: "Quero revisar meu mapa antes ???" },
              ],
            },
          ]
        })
      }, 1100)
      return
    }

    if (action === "mentor-liberar") {
      const persisted = await ensureMissionSummarySynced()
      if (!persisted) {
        console.warn("Nao foi possivel confirmar a persistencia da Missao 1 antes do redirecionamento.")
      }
      router.push("/dashboard?unlock=missao_2")
      return
    }

    if (action === "mentor-revisar") {
      setMentorSequenceTriggered(false)
      const acknowledgement: Message[] = [
        {
          id: nextMessageId(),
          kind: "text",
          role: "usuario",
          text: label ?? "Quero revisar meu mapa antes ???",
        },
        {
          id: nextMessageId(),
          kind: "text",
          role: "mentor",
          text: "Perfeito. Revise com calma e, quando quiser avançar, é só me chamar. O Estrategista segue por perto caso queira ajustar algo.",
        },
      ]
      setMessages((prev) => [...prev, ...acknowledgement])
      setPhase("summary")
      return
    }
  }

  function handleSubmitCurrentStep() {
    const step = currentStep
    if (!step) return
    const error = getStepError(step, responses)
    if (error) {
      setValidationError(error)
      return
    }

    setValidationError(null)
    const updatedResponses = { ...responses }
    const answerText = formatAnswer(step, updatedResponses)
    const userMessage: Message = {
      id: nextMessageId(),
      kind: "text",
      role: "usuario",
      text: answerText,
    }
    const feedbackMessage: Message = {
      id: nextMessageId(),
      kind: "text",
      role: "estrategista",
      text: step.feedback,
      tone: "feedback",
    }

    if (currentStepIndex === totalSteps - 1) {
      const summary = computeSummary(updatedResponses, creatorName)
      setFinalSummary(summary)
      setPhase("summary")
      setActiveStageId("summary")
      setCompletedStages((prev) => unique([...prev, step.id, "summary"]))

      const celebrationMessage: Message = {
        id: nextMessageId(),
        kind: "text",
        role: "estrategista",
        text: `Incrível, ${summary.name}! ? Com base nas suas respostas, aqui está o mapa inicial da sua marca.`,
        tone: "celebration",
      }
      const summaryMessage: Message = {
        id: nextMessageId(),
        kind: "summary",
        role: "estrategista",
        summary,
      }
      const ctaMessage: Message = {
        id: nextMessageId(),
        kind: "cta",
        role: "estrategista",
        text: "O que você quer fazer agora?",
        actions: [
          { id: "go-dashboard", label: "Voltar para a Sala da Marca" },
          { id: "continue-mission2", label: "Enviar para o Mentor aprovar" },
        ],
      }

      setMessages((prev) => [...prev, userMessage, feedbackMessage, celebrationMessage, summaryMessage, ctaMessage])
    } else {
      const nextStep = missionSteps[currentStepIndex + 1]
      const nextQuestion: Message = {
        id: nextMessageId(),
        kind: "question",
        stageTitle: nextStep.stageTitle,
        question: nextStep.question,
      }
      setMessages((prev) => [...prev, userMessage, feedbackMessage, nextQuestion])
      setCompletedStages((prev) => unique([...prev, step.id]))
      setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1))
      setActiveStageId(nextStep.id)
    }
  }
  function formatAnswer(step: MissionStep, data: typeof initialResponses) {
    switch (step.id) {
      case "q1":
        if (step.type === "singleWithOther" && data.q1 === "Outro") {
          return data.q1Other.trim()
        }
        return step.options?.find((option) => option.value === data.q1)?.label ?? data.q1.trim()
      case "q2":
        return formatList(
          data.q2.map((value) => step.options?.find((option) => option.value === value)?.label ?? value),
        )
      case "q3":
        return data.q3.trim()
      case "q4":
        return formatList(
          data.q4
            .map((item) => {
              if (item === "Outro") return data.q4Other.trim()
              return step.options?.find((option) => option.value === item)?.label ?? item
            })
            .filter(Boolean),
        )
      case "q5":
        return step.options?.find((option) => option.value === data.q5)?.label ?? data.q5.trim()
      default:
        return ""
    }
  }

  function getStepError(step: MissionStep, data: typeof initialResponses) {
    switch (step.id) {
      case "q1":
        if (!data.q1) return "Escolha uma opcao para avancar."
        if (data.q1 === "Outro" && data.q1Other.trim().length === 0) {
          return "Conta pra mim qual transformacao voce entrega."
        }
        return null
      case "q2":
        if (data.q2.length === 0) return "Selecione pelo menos um publico que valoriza o que voce faz."
        return null
      case "q3":
        if (data.q3.trim().length === 0) return "Descreva como voce quer que falem da sua marca."
        return null
      case "q4":
        if (data.q4.length === 0) return "Escolha pelo menos um diferencial."
        if (data.q4.includes("Outro") && data.q4Other.trim().length === 0) {
          return "Qual é esse outro diferencial que te destacam?"
        }
        return null
      case "q5":
        if (!data.q5) return "Selecione um tom de voz para a sua marca."
        return null
      default:
        return null
    }
  }

  const stageStatuses = useMemo(() => {
    return checklistStages.map((stage) => {
      if (completedStages.includes(stage.id)) return "done"
      if (stage.id === activeStageId) return "active"
      return "pending"
    })
  }, [completedStages, activeStageId])
  return (
    <ProtectedRoute>
      <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-[#f4f0ff] via-[#edf8ff] to-white text-[#211b45]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-[#d2c9ff]/60 blur-3xl" />
          <div className="absolute right-[-160px] top-1/3 h-[420px] w-[420px] rounded-full bg-[#b7ecff]/50 blur-3xl" />
          <div className="absolute bottom-[-200px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#eef5ff]/70 blur-3xl" />
        </div>

        <main className="relative z-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
            <header className="flex flex-col gap-4 rounded-3xl border border-[#d9d1ff]/60 bg-white/80 p-6 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="h-9 w-9 rounded-full border border-[#d9d1ff] bg-white text-[#6c54c2] hover:bg-[#f4f0ff]"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7f6bc8]">Missão 1</p>
                    <h1 className="mt-1 text-2xl font-semibold text-[#211b45]">Estratégia da Marca</h1>
                  </div>
                </div>
                <div className="rounded-full border border-[#c8d1ff] bg-gradient-to-r from-[#d7c7ff]/60 to-[#c0f0ff]/60 px-4 py-1 text-sm font-semibold text-[#6151c1] shadow-lg shadow-[#c3d2ff]/50">
                  Estrategista ativo ✨
                </div>
              </div>
              <p className="max-w-2xl text-sm text-[#4d4c6d]">
                Vamos alinhar o norte da sua marca. Você responde e o Estrategista organiza foco, cliente certo e promessa
                central para liberar as próximas missões.
              </p>
            </header>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="flex min-h-[560px] flex-col rounded-3xl border border-[#d9d8ff] bg-white/85 p-4 shadow-[0_24px_60px_rgba(130,118,255,0.12)] backdrop-blur lg:p-6">
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="flex w-full"
                  >
                    <ChatMessage
                      message={message}
                      onAdjustSummary={handleResetMission}
                      summaryAvailable={Boolean(finalSummary)}
                      onAction={handleAction}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {phase === "input" && currentStep && (
              <div className="mt-6 rounded-3xl border border-[#dcd8ff] bg-white/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                {currentStep.type === "text" ? (
                  <textarea
                    value={responses.q3}
                    onChange={(event) =>
                      setResponses((prev) => ({
                        ...prev,
                        q3: event.target.value,
                      }))
                    }
                    className="min-h-[150px] w-full rounded-2xl border border-[#d9d1ff] bg-white px-4 py-3 text-base text-[#322d63] placeholder:text-[#a09bc4] focus:border-[#9b87ff] focus:outline-none focus:ring-0"
                    placeholder={currentStep.placeholder}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[#e2dcff] bg-[#f7f4ff] px-4 py-3 text-[#2f2a5c] shadow-sm">
                      <span className="text-xl">{currentStep.type === "multi" ? "??" : "??"}</span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7f6bc8]">
                          {currentStep.type === "multi" ? "Múltipla escolha" : "Escolha única"}
                        </p>
                        <p className="text-sm text-[#5f5d7c]">
                          {currentStep.type === "multi"
                            ? "Marque todas as alternativas que combinam com você."
                            : "Escolha a opção que mais representa seu jeito de atuar."}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {currentStep.options?.map((option) => {
                        const isSelected =
                          currentStep.id === "q1"
                            ? responses.q1 === option.value
                            : currentStep.id === "q5"
                              ? responses.q5 === option.value
                              : currentStep.id === "q2"
                                ? responses.q2.includes(option.value)
                                : responses.q4.includes(option.value)
                        const isMultiChoice = currentStep.type === "multi"
  
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              if (currentStep.id === "q1") {
                                setResponses((prev) => ({
                                  ...prev,
                                  q1: option.value,
                                  q1Other: option.value === "Outro" ? prev.q1Other : "",
                                }))
                              } else if (currentStep.id === "q5") {
                                setResponses((prev) => ({
                                  ...prev,
                                  q5: option.value,
                                }))
                              } else if (currentStep.id === "q2") {
                                setResponses((prev) => {
                                  const exists = prev.q2.includes(option.value)
                                  const updated = exists
                                    ? prev.q2.filter((item) => item !== option.value)
                                    : [...prev.q2, option.value]
                                  return {
                                    ...prev,
                                    q2: updated,
                                  }
                                })
                              } else if (currentStep.id === "q4") {
                                setResponses((prev) => {
                                  const exists = prev.q4.includes(option.value)
                                  const updated = exists
                                    ? prev.q4.filter((item) => item !== option.value)
                                    : [...prev.q4, option.value]
                                  return {
                                    ...prev,
                                    q4: updated,
                                    q4Other: updated.includes("Outro") ? prev.q4Other : "",
                                  }
                                })
                              }
                            }}
                            className={`group flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 transition-all ${
                              isSelected
                                ? "border-[#bda8ff] bg-gradient-to-r from-[#f4efff] to-[#eefaff] shadow-[0_18px_32px_rgba(130,118,255,0.18)]"
                                : "border-[#e2dcff] bg-white/85 text-[#4f4c6d] hover:border-[#cebffd] hover:bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl transition-all ${
                                  isSelected
                                    ? "bg-gradient-to-br from-[#a17cff]/20 to-[#5fd6ff]/20 text-[#6a58c8] shadow-[0_12px_24px_rgba(130,118,255,0.22)]"
                                    : "bg-[#f1edff] text-[#8c83c8] group-hover:bg-[#ebe2ff] group-hover:text-[#6a58c8]"
                                }`}
                              >
                                {option.emoji ?? "?"}
                              </span>
                              <div className="space-y-1 text-left">
                                <p className="text-sm font-semibold text-[#2f275d]">{option.label}</p>
                                {option.description && <p className="text-xs text-[#5f5d7c]">{option.description}</p>}
                              </div>
                            </div>
  
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                                isSelected
                                  ? "bg-[#9b87ff]/15 text-[#6a58c8]"
                                  : "bg-white/90 text-[#c5c1e6] group-hover:text-[#7d68e0]"
                              }`}
                            >
                              {isMultiChoice ? (
                                isSelected ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                  <Circle className="h-4 w-4" />
                                )
                              ) : isSelected ? (
                                <CircleDot className="h-4 w-4" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {currentStep.id === "q1" && responses.q1 === "Outro" && (
                  <textarea
                    value={responses.q1Other}
                    onChange={(event) =>
                      setResponses((prev) => ({
                        ...prev,
                        q1Other: event.target.value,
                      }))
                    }
                    className="mt-3 min-h-[120px] w-full rounded-2xl border border-[#d9d1ff] bg-white px-4 py-3 text-base text-[#322d63] placeholder:text-[#a09bc4] focus:border-[#9b87ff] focus:outline-none focus:ring-0"
                    placeholder="Conte com suas palavras qual transformacao voce entrega"
                  />
                )}

                {currentStep.id === "q4" && responses.q4.includes("Outro") && (
                  <textarea
                    value={responses.q4Other}
                    onChange={(event) =>
                      setResponses((prev) => ({
                        ...prev,
                        q4Other: event.target.value,
                      }))
                    }
                    className="mt-3 min-h-[120px] w-full rounded-2xl border border-[#d9d1ff] bg-white px-4 py-3 text-base text-[#322d63] placeholder:text-[#a09bc4] focus:border-[#9b87ff] focus:outline-none focus:ring-0"
                    placeholder="Qual e esse outro diferencial que sempre citam?"
                  />
                )}

                {validationError && (
                  <div className="mt-4 rounded-2xl border border-[#f6b7b7] bg-[#fff1f1] px-4 py-3 text-sm text-[#b42318]">
                    {validationError}
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleSubmitCurrentStep}
                    disabled={!canProceed}
                    className="rounded-2xl bg-gradient-to-r from-[#a17cff] to-[#5fd6ff] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#b9b0ff]/50 transition-transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-60"
                  >
                    Registrar etapa
                  </Button>
                </div>
              </div>
            )}
          </section>
          <aside className="space-y-6">
            <div className="rounded-3xl border border-[#d9d8ff] bg-white/85 p-6 shadow-[0_18px_44px_rgba(120,108,255,0.15)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f6bc8]">Progresso</span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a58c8]">{progress}%</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#ece9ff]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#a17cff] via-[#7d68e0] to-[#5fd6ff]"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                />
              </div>
              <div className="mt-6 space-y-3">
                {checklistStages.map((stage, index) => {
                  const status = stageStatuses[index]
                  return (
                    <div
                      key={stage.id}
                      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                        status === "done"
                          ? "border-[#c9f0d9] bg-[#f1fff6] text-[#276348]"
                          : status === "active"
                            ? "border-[#d9d5ff] bg-[#f6f4ff] text-[#3f398c]"
                            : "border-[#e4e2ff] bg-white text-[#8c89ab]"
                      }`}
                    >
                      <div className="mt-0.5">
                        {status === "done" ? (
                          <Check className="h-4 w-4 text-[#2f9460]" />
                        ) : status === "active" ? (
                          <CircleDot className="h-4 w-4 text-[#7d68e0]" />
                        ) : (
                          <Circle className="h-4 w-4 text-[#cbc9e8]" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#8c83c8]">{stage.title}</p>
                        <p className="text-sm font-medium text-[#2f275d]">{stage.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-[#d9f0ff] bg-[#f0fbff] p-6 shadow-[0_16px_40px_rgba(95,214,255,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3a7ca5]">Missao ativa</p>
              <h3 className="mt-3 text-lg font-semibold text-[#1f4560]">Entrar na Missao 1</h3>
              <p className="mt-2 text-sm text-[#4f6d80]">
                Complete as etapas e envie ao Mentor-Raiz. O Copywriter so libera a Missao 2 depois deste alinhamento.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[#3f6279]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#6ab7d6]" />
                  5 etapas guiadas com feedback imediato
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#6ab7d6]" />
                  Resumo automatico pronto para o Mentor-Raiz
                </li>
              </ul>
            </div>
          </aside>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
function ChatMessage({
  message,
  onAdjustSummary,
  summaryAvailable,
  onAction,
}: {
  message: Message
  onAdjustSummary: () => void
  summaryAvailable: boolean
  onAction: (action: ActionId, label?: string) => void
}) {
  if (message.kind === "question") {
    return (
      <div className="mx-auto w-full rounded-3xl border border-[#d9d5ff] bg-white px-6 py-5 text-[#211b45] shadow-[0_16px_32px_rgba(120,108,255,0.16)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7d68e0]">{message.stageTitle}</p>
        <p className="mt-2 text-lg font-semibold text-[#211b45]">{message.question}</p>
      </div>
    )
  }

  if (message.kind === "loading") {
    return (
      <div className="flex w-full justify-center">
        <div className="flex items-center gap-3 rounded-full border border-[#e1defb] bg-white/80 px-4 py-2 text-sm text-[#5f5d7c] shadow">
          <Loader2 className="h-4 w-4 animate-spin text-[#7d68e0]" />
          {message.text}
        </div>
      </div>
    )
  }

  if (message.kind === "summary") {
    return (
      <SummaryCard
        summary={message.summary}
        role={message.role}
        onAdjust={onAdjustSummary}
        canAdjust={message.role === "estrategista" && summaryAvailable}
      />
    )
  }

  if (message.kind === "cta") {
    return <CtaBlock role={message.role} text={message.text} actions={message.actions} onAction={onAction} />
  }

  return <TextBubble role={message.role} tone={message.tone}>{message.text}</TextBubble>
}
function TextBubble({
  role,
  tone = "default",
  children,
}: {
  role: Role
  tone?: "default" | "feedback" | "system" | "celebration"
  children: string
}) {
  const alignment =
    role === "usuario" ? "justify-end" : role === "estrategista" || role === "mentor" ? "justify-start" : "justify-center"

  const baseClasses =
    role === "usuario"
      ? "force-white bg-gradient-to-r from-[#6a58c8] to-[#5fd6ff] text-white shadow-[0_16px_32px_rgba(130,118,255,0.24)]"
      : role === "mentor"
        ? "border border-[#d7f0ff] bg-[#f0fbff] text-[#2f536a] shadow-[0_18px_36px_rgba(95,214,255,0.16)]"
        : role === "estrategista"
          ? "border border-[#d5c8ff] bg-gradient-to-br from-white via-[#f7f5ff] to-[#ebf9ff] text-[#312d63] shadow-[0_18px_40px_rgba(130,118,255,0.18)]"
          : "border border-[#e5e3ff] bg-white/95 text-[#4f4e6d] shadow-[0_16px_32px_rgba(15,23,42,0.08)]"

  const toneClasses =
    tone === "feedback"
      ? "border-[#c9f0d9] bg-[#f6fff8] text-[#276348] shadow-[0_16px_32px_rgba(76,175,80,0.18)]"
      : tone === "system"
        ? "border-[#c6e7ff] bg-[#eef9ff] text-[#2f536a] shadow-[0_12px_24px_rgba(95,214,255,0.14)]"
        : tone === "celebration"
          ? "border-[#fbe2a6] bg-[#fff8e7] text-[#8a5b13] shadow-[0_18px_36px_rgba(251,191,36,0.2)]"
          : ""

  return (
    <div className={`flex w-full ${alignment}`}>
      {(role === "estrategista" || role === "mentor") && (
        <div
          className={`mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-md ${
            role === "mentor"
              ? "force-white bg-gradient-to-br from-[#7d68e0] to-[#5fd6ff]"
              : "force-white bg-gradient-to-br from-[#a17cff] to-[#5fd6ff]"
          }`}
        >
          {role === "mentor" ? "MR" : "ES"}
        </div>
      )}
      <div className={`max-w-[80%] rounded-3xl px-5 py-4 text-sm leading-relaxed ${baseClasses} ${toneClasses}`}>
        {children.split("\n").map((line, index) => (
          <p key={index} className="mt-1 first:mt-0">
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
function SummaryCard({
  summary,
  role,
  onAdjust,
  canAdjust,
}: {
  summary: SummaryData
  role: "estrategista" | "mentor"
  onAdjust: () => void
  canAdjust: boolean
}) {
  const headerTitle = role === "mentor" ? "Resumo validado da Missao 1" : "Missao 1 concluida"
  const introText = role === "mentor" ? "Aqui esta o que alinhamos com o Estrategista:" : "Aqui esta o mapa inicial da sua marca:"

  return (
    <div className="w-full rounded-3xl border border-[#d5c8ff] bg-gradient-to-br from-[#f3f0ff] via-white to-[#edfbff] p-6 text-[#312d63] shadow-[0_24px_60px_rgba(120,108,255,0.18)] md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7d68e0]">{headerTitle}</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#211b45]">Incrivel, {summary.name}!</h2>
          <p className="mt-1 text-sm text-[#5f5d7c]">{introText}</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#a17cff] to-[#5fd6ff] text-white shadow-lg shadow-[#b9b0ff]/40">
          <Sparkles className="h-7 w-7" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <SummaryLine icon={<Target className="h-5 w-5 text-[#7d68e0]" />} label="Voce ajuda as pessoas a">
          {summary.q1 || "destravar a transformacao certa"}
        </SummaryLine>
        <SummaryLine icon={<Users className="h-5 w-5 text-[#7d68e0]" />} label="Quem mais valoriza isso">
          {formatList(summary.q2.length ? summary.q2 : ["clientes em busca de clareza"])}
        </SummaryLine>
        <SummaryLine icon={<MessageCircle className="h-5 w-5 text-[#7d68e0]" />} label="Como querem lembrar de voce">
          {summary.q3 || "uma marca que conduz com confianca"}
        </SummaryLine>
        <SummaryLine icon={<Star className="h-5 w-5 text-[#7d68e0]" />} label="Seu diferencial esta em">
          {formatList(summary.q4.length ? summary.q4 : ["um jeito unico de cuidar de cada cliente"])}
        </SummaryLine>
        <SummaryLine icon={<Volume2 className="h-5 w-5 text-[#7d68e0]" />} label="Tom de voz da marca">
          {summary.q5 || "cheio de clareza e presenca"}
        </SummaryLine>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-[#e4e2ff] bg-white/90 p-4 text-sm text-[#4f4e6d]">
          {role === "mentor" ? (
            <p>
              Essa base segue para o Copywriter transformar em mensagens que vendem. Qualquer ajuste que fizer por aqui e
              atualizado automaticamente para o time inteiro.
            </p>
          ) : (
            <p>
              Vou enviar isso ao Mentor-Raiz para revisar e alinhar com o plano completo. Assim que ele aprovar, o Copywriter
              entra em campo para transformar tudo em mensagens que vendem.
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.24em] text-[#8c83c8]">
            <span className="rounded-full border border-[#d9d5ff] px-3 py-1">Estrategista - Missao 1</span>
            <span className="rounded-full border border-[#d9d5ff] px-3 py-1">
              {role === "mentor" ? "Validado pelo Mentor-Raiz" : "Plano em andamento"}
            </span>
          </div>
        </div>
        <div className="rounded-3xl border border-[#d7f0ff] bg-[#f0fbff] p-4 text-sm text-[#2f536a] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3a7ca5]">Gamificacao</p>
          <div className="mt-3 space-y-2">
            <p className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#6ab7d6]" />
              +80 XP - Marca com Norte
            </p>
            <p className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-[#6ab7d6]" />
              Clareza 62% -> 75%
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#6ab7d6]" />
              Selo desbloqueado: Marca com Norte
            </p>
          </div>
        </div>
      </div>

      {role === "estrategista" && canAdjust && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={onAdjust}
            className="rounded-2xl border border-[#d9d1ff] bg-white text-sm text-[#6a58c8] hover:bg-[#f4f0ff]"
          >
            Ajustar respostas
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="rounded-2xl border border-[#d9d1ff] bg-white text-sm text-[#6a58c8] hover:bg-[#f4f0ff]"
          >
            Revisar etapas
          </Button>
        </div>
      )}
    </div>
  )
}
function SummaryLine({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#e1ddff] bg-white/90 px-4 py-3 text-sm text-[#312d63]">
      <div className="mt-1">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-[#7f6bc8]">{label}</p>
        <p className="mt-1 text-sm text-[#312d63]">{children}</p>
      </div>
    </div>
  )
}

function CtaBlock({
  role,
  text,
  actions,
  onAction,
}: {
  role: Role
  text?: string
  actions: { id: ActionId; label: string }[]
  onAction: (action: ActionId, label?: string) => void | Promise<void>
}) {
  const alignment = role === "usuario" ? "justify-end" : "justify-center"
  return (
    <div className={`flex w-full ${alignment}`}>
      <div className="flex max-w-[80%] flex-col items-center gap-4 rounded-3xl border border-[#d5c8ff] bg-[#f7f4ff] px-5 py-4 text-sm text-[#2f2a5c] shadow-[0_18px_44px_rgba(120,108,255,0.12)]">
        {text && <p className="text-center text-sm text-[#2f2a5c]">{text}</p>}
        <div className="flex flex-wrap justify-center gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              onClick={() => onAction(action.id, action.label)}
              className="rounded-2xl bg-gradient-to-r from-[#a17cff] to-[#5fd6ff] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#b9b0ff]/40 hover:scale-[1.01]"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}



















