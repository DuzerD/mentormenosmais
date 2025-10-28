"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  CalendarCheck2,
  CheckCircle2,
  Flame,
  Loader2,
  MessageCircle,
  Rocket,
  Send,
  Smartphone,
  Sparkles,
  Wand2,
} from "lucide-react"

import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BrandplotCache } from "@/lib/brandplot-cache"
import { toast } from "@/hooks/use-toast"
import type { Mission3Results } from "@/lib/missao3-types"
import type {
  Mission1Snapshot,
  Mission4Calendar,
  Mission4Context,
  Mission4Idea,
  Mission4IdeasResponse,
  Mission4Legenda,
  Mission4Mission2Snapshot,
  Mission4Mission3Snapshot,
  Mission4Results,
  Mission4Roteiro,
} from "@/lib/missao4-types"

type ChatRole = "social" | "mentor" | "user"

type OptionDefinition = {
  id: string
  label: string
  variant?: "primary" | "secondary"
}

type ChatMessage =
  | {
      id: string
      kind: "text"
      role: ChatRole
      text: string
      tone?: "default" | "celebration" | "note"
    }
  | {
      id: string
      kind: "cta"
      role: ChatRole
      prompt?: string
      actions: OptionDefinition[]
    }
  | {
      id: string
      kind: "loading"
      role: ChatRole
      text?: string
    }
  | {
      id: string
      kind: "ideas"
      role: "social"
      ideas: Mission4Idea[]
    }
  | {
      id: string
      kind: "roteiro"
      role: "social"
      roteiro: Mission4Roteiro
    }
  | {
      id: string
      kind: "legenda"
      role: "social"
      legenda: Mission4Legenda
    }
  | {
      id: string
      kind: "calendar"
      role: "social"
      calendar: Mission4Calendar
    }
  | {
      id: string
      kind: "summary"
      role: ChatRole
      results: Mission4Results
      mainPhrase?: string
    }

type MissionPhase = "intro" | "ideas" | "roteiro" | "legenda" | "calendar" | "summary" | "complete"
type LoadingStage = "ideas" | "roteiro" | "legenda" | "calendar" | "persist" | null

type BrandRecord = {
  idUnico?: string | null
  nome_empresa?: string | null
  nomeMarca?: string | null
  missoesConcluidas?: string[] | null
  onboardingMetadata?: string | Record<string, unknown> | null
  estrategia?: string | Record<string, unknown> | null
  missaoLiberada?: string | null
  xpAtual?: number | null
  xpProximoNivel?: number | null
  comparativoPercentual?: number | null
  nivelAtual?: string | null
}

const missionSteps = [
  {
    id: "ideas",
    title: "Ideias prontas",
    description: "5 propostas alinhadas à mensagem.",
  },
  {
    id: "roteiro",
    title: "Roteiro completo",
    description: "Carrossel ou vídeo com 4 partes.",
  },
  {
    id: "legenda",
    title: "Legenda final",
    description: "150–250 caracteres com CTA leve.",
  },
  {
    id: "calendar",
    title: "Calendário de presença",
    description: "5 dias com tema, formato e CTA.",
  },
]

const MotionDiv = motion.div

const MISSION4_STORAGE_KEY = "missao4_result"
const mission5CheckoutUrl = process.env.NEXT_PUBLIC_MISSION5_CHECKOUT_URL
const mission5WebhookUrl = process.env.NEXT_PUBLIC_MISSION5_WEBHOOK_URL

export default function Mission4Page() {
  return (
    <ProtectedRoute>
      <Mission4Content />
    </ProtectedRoute>
  )
}

function Mission4Content() {
  const router = useRouter()
  const [phase, setPhase] = useState<MissionPhase>("intro")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null)
  const [ideasList, setIdeasList] = useState<Mission4Idea[]>([])
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [roteiro, setRoteiro] = useState<Mission4Roteiro | null>(null)
  const [legenda, setLegenda] = useState<Mission4Legenda | null>(null)
  const [calendar, setCalendar] = useState<Mission4Calendar | null>(null)
  const [finalResults, setFinalResults] = useState<Mission4Results | null>(null)
  const [mission1Snapshot, setMission1Snapshot] = useState<Mission1Snapshot | null>(null)
  const [mission2Snapshot, setMission2Snapshot] = useState<Mission4Mission2Snapshot | null>(null)
  const [mission3Snapshot, setMission3Snapshot] = useState<Mission4Mission3Snapshot | null>(null)
  const [brandRecord, setBrandRecord] = useState<BrandRecord | null>(null)
  const [strategyData, setStrategyData] = useState<Record<string, unknown> | null>(null)
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null)
  const [idUnico, setIdUnico] = useState<string | null>(null)
  const [creatorName, setCreatorName] = useState<string | null>(null)
  const [introDispatched, setIntroDispatched] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const listRef = useRef<HTMLDivElement | null>(null)
  const messageId = useRef(0)

  const nextMessageId = useCallback(() => {
    messageId.current += 1
    return `msg-${messageId.current}`
  }, [])

  useEffect(() => {
    const cache = BrandplotCache.get()
    if (cache) {
      setCreatorName(cache.companyName ?? null)
      if (cache.idUnico) {
        setIdUnico(cache.idUnico)
      }
    }
  }, [])

  useEffect(() => {
    if (idUnico) {
      fetchBrandRecord(idUnico)
    }
  }, [idUnico])

  useEffect(() => {
    if (!restoring) {
      tryRestoreFromStorage()
    }
  }, [])

  useEffect(() => {
    if (!introDispatched && !restoring && mission2Snapshot && mission3Snapshot) {
      dispatchIntro()
    }
  }, [mission2Snapshot, mission3Snapshot, introDispatched, restoring])

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

  const stepStatuses = useMemo(() => {
    const selectedIdea = selectedIdeaId != null
    return {
      ideas: ideasList.length === 5,
      roteiro: selectedIdea && Boolean(roteiro),
      legenda: Boolean(legenda),
      calendar: Boolean(calendar),
    }
  }, [ideasList, selectedIdeaId, roteiro, legenda, calendar])

  async function fetchBrandRecord(id: string) {
    try {
      const response = await fetch(`/api/brand-data?idUnico=${encodeURIComponent(id)}`)
      if (!response.ok) {
        console.warn("Falha ao buscar dados da marca para Missão 4:", await response.text())
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
        hydrateMissionSnapshots(strategy)

        const storedMission4 = strategy?.missao4 as Mission4Results | undefined
        if (storedMission4?.selectedIdeaId && !finalResults) {
          restoreMission4(storedMission4)
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
      console.warn("Não foi possível recuperar dados da marca (Missão 4):", error)
    }
  }

  function hydrateMissionSnapshots(strategy: Record<string, unknown>) {
    const mission1 = strategy?.missao1 as
      | {
          resumo?: Mission1Snapshot["resumo"]
          respostas?: Record<string, unknown>
        }
      | undefined

    if (mission1?.resumo) {
      setMission1Snapshot({
        resumo: mission1.resumo,
      })
    }

    const mission2 = strategy?.missao2 as Mission4Mission2Snapshot | undefined
    if (mission2?.selectedPhrase) {
      setMission2Snapshot({
        selectedPhrase: mission2.selectedPhrase,
        subtitle: mission2.subtitle,
        bio: mission2.bio,
        insight: mission2.insight,
        contentIdea: mission2.contentIdea ?? null,
        generatedAt: mission2.generatedAt,
      })
    }

    const mission3 = strategy?.missao3 as Mission3Results | undefined
    if (mission3?.direction?.name) {
      const snapshot: Mission4Mission3Snapshot = {
        energy: mission3.energy,
        direction: {
          id: mission3.direction.id,
          name: mission3.direction.name,
          summary: mission3.direction.summary,
          palette: mission3.direction.palette,
          typography: mission3.direction.typography,
          keywords: mission3.direction.keywords,
        },
        layoutPreference: mission3.layoutPreference,
        palette: mission3.palette,
        typography: mission3.typography,
        visualNotes: mission3.visualNotes,
        signatureIdea: mission3.signatureIdea,
        socialPreviewIdea: mission3.socialPreviewIdea,
        toneReminder: mission3.toneReminder,
        finalImageUrl: mission3.finalImageUrl,
        generatedAt: mission3.generatedAt,
      }
      setMission3Snapshot(snapshot)
    }
  }

  function restoreMission4(results: Mission4Results) {
    setRestoring(true)
    setIdeasList(results.ideas)
    setSelectedIdeaId(results.selectedIdeaId)
    setRoteiro(results.roteiro)
    setLegenda(results.legenda)
    setCalendar(results.calendar)
    setFinalResults(results)
    setPhase("complete")

    const phrase =
      mission2Snapshot?.selectedPhrase ?? results.ideas.find((idea) => idea.id === results.selectedIdeaId)?.title

    setMessages([
      {
        id: nextMessageId(),
        kind: "text",
        role: "social",
        tone: "note",
        text: "Resgatei o plano de conteúdo que já entreguei pra você. Se quiser gerar uma nova rodada, é só me avisar.",
      },
      {
        id: nextMessageId(),
        kind: "summary",
        role: "social",
        results,
        mainPhrase: phrase ?? undefined,
      },
      {
        id: nextMessageId(),
        kind: "text",
        role: "mentor",
        tone: "celebration",
        text: "Missão 4 já está concluída e registrada no painel. Parabéns por manter a constância viva na marca!",
      },
    ])

    setIntroDispatched(true)
    setRestoring(false)
  }

  function tryRestoreFromStorage() {
    try {
      if (typeof window === "undefined") return
      const stored = window.localStorage?.getItem(MISSION4_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Mission4Results
        if (parsed?.selectedIdeaId) {
          restoreMission4(parsed)
        }
      }
    } catch (error) {
      console.warn("Não foi possível restaurar Missão 4 do storage local:", error)
    }
  }

  function dispatchIntro() {
    if (introDispatched) return
    setIntroDispatched(true)

    const firstName = extractFirstName(creatorName ?? mission2Snapshot?.selectedPhrase ?? "")
    const displayName = firstName || "por aqui"

    const introMessages: ChatMessage[] = [
      {
        id: nextMessageId(),
        kind: "text",
        role: "social",
        text: `Oi, ${displayName}! Sou o Social Media da Menos Mais — o responsável por transformar tudo o que você construiu até aqui em presença de marca real.`,
      },
      {
        id: nextMessageId(),
        kind: "text",
        role: "social",
        text: "Eu já conheço sua estratégia, sua mensagem e sua identidade. Agora, meu trabalho é mostrar como isso aparece pro mundo.",
      },
      {
        id: nextMessageId(),
        kind: "text",
        role: "social",
        tone: "note",
        text: "\"Voce ja tem a mensagem. Eu vou colocar ela pra trabalhar.\"",
      },
      {
        id: nextMessageId(),
        kind: "cta",
        role: "social",
        prompt: "Pronto pra ver suas ideias de conteúdo prontas?",
        actions: [{ id: "start-plan", label: "Bora ver o plano 🔥", variant: "primary" }],
      },
    ]

    setMessages(introMessages)
  }

  function extractFirstName(value: string) {
    if (!value) return ""
    const [first] = value.trim().split(/\s+/)
    return first
  }

  async function handleAction(actionId: string) {
    switch (actionId) {
      case "start-plan":
        await startIdeasGeneration()
        return
      case "idea-1":
      case "idea-2":
      case "idea-3":
      case "idea-4":
      case "idea-5":
        await selectIdea(actionId)
        return
      case "approve-roteiro":
        await generateLegendaStage()
        return
      case "choose-other-idea":
        handleChooseOtherIdea()
        return
      case "unlock-mission5":
        handleUnlockMission5()
        return
      case "go-dashboard":
        router.push("/dashboard")
        return
      default:
        console.warn("Ação não reconhecida:", actionId)
    }
  }

  async function startIdeasGeneration() {
    if (!mission2Snapshot || !mission3Snapshot) {
      toast({
        title: "Contexto incompleto",
        description: "Preciso da mensagem e da identidade para sugerir ideias. Atualize a página.",
        variant: "destructive",
      })
      return
    }

    setPhase("ideas")
    setLoadingStage("ideas")

    const loadingId = nextMessageId()
    appendMessage({
      id: loadingId,
      kind: "loading",
      role: "social",
      text: "Vou montar 5 ideias prontas pra você, alinhadas à sua marca...",
    })

    try {
      const response = await requestMission4<Mission4IdeasResponse>({
        stage: "ideas",
        context: buildMissionContext(),
      })

      setIdeasList(response.ideas)
      replaceMessage(loadingId, {
        id: nextMessageId(),
        kind: "ideas",
        role: "social",
        ideas: response.ideas,
      })

      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "social",
        text: "Perfeito. Aqui estão 5 ideias que falam com o tom da sua marca.",
      })

      appendMessage({
        id: nextMessageId(),
        kind: "cta",
        role: "social",
        prompt: "Qual dessas você quer que eu transforme em roteiro?",
        actions: response.ideas.map((idea) => ({
          id: idea.id,
          label: idea.id.replace("idea-", ""),
          variant: "primary",
        })),
      })
    } catch (error) {
      console.error("Erro ao gerar ideias da Missão 4:", error)
      replaceMessage(loadingId, {
        id: loadingId,
        kind: "text",
        role: "social",
        text: "Algo travou aqui. Me dá um minuto e tenta de novo, beleza?",
        tone: "note",
      })
      toast({
        title: "Não consegui gerar as ideias",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setLoadingStage(null)
    }
  }

  async function selectIdea(ideaId: string) {
    const idea = ideasList.find((item) => item.id === ideaId)
    if (!idea) {
      toast({
        title: "Ideia não encontrada",
        description: "Gere as ideias novamente e escolha um número válido.",
        variant: "destructive",
      })
      return
    }

    setSelectedIdeaId(ideaId)
    setPhase("roteiro")
    setLoadingStage("roteiro")

    appendMessage({
      id: nextMessageId(),
      kind: "text",
      role: "social",
      text: `Boa. Vou transformar a ${idea.id.replace("idea-", "ideia ")} em roteiro agora.`,
    })

    const loadingId = nextMessageId()
    appendMessage({
      id: loadingId,
      kind: "loading",
      role: "social",
      text: "Roteirizando com base na sua identidade e mensagem...",
    })

    try {
      const response = await requestMission4<Mission4Roteiro>({
        stage: "roteiro",
        context: buildMissionContext(),
        idea,
      })

      setRoteiro(response)

      replaceMessage(loadingId, {
        id: nextMessageId(),
        kind: "roteiro",
        role: "social",
        roteiro: response,
      })

      appendMessage({
        id: nextMessageId(),
        kind: "cta",
        role: "social",
        prompt: "Quer que eu monte a legenda também?",
        actions: [
          { id: "approve-roteiro", label: "Sim 💬", variant: "primary" },
          { id: "choose-other-idea", label: "Não, quero outra ideia 🔁" },
        ],
      })
    } catch (error) {
      console.error("Erro ao gerar roteiro da Missão 4:", error)
      replaceMessage(loadingId, {
        id: loadingId,
        kind: "text",
        role: "social",
        text: "Não consegui fechar esse roteiro agora. Quer tentar outra ideia?",
        tone: "note",
      })
      toast({
        title: "Falha ao gerar roteiro",
        description: "Selecione novamente ou gere novas ideias.",
        variant: "destructive",
      })
    } finally {
      setLoadingStage(null)
    }
  }

  function handleChooseOtherIdea() {
    setSelectedIdeaId(null)
    setRoteiro(null)
    setLegenda(null)
    setCalendar(null)
    setPhase("ideas")

    appendMessage({
      id: nextMessageId(),
      kind: "text",
      role: "social",
      text: "Sem problema. Escolhe outra ideia que eu roteirizo pra você.",
    })

    appendMessage({
      id: nextMessageId(),
      kind: "cta",
      role: "social",
      prompt: "Qual outra ideia quer priorizar?",
      actions: ideasList.map((idea) => ({
        id: idea.id,
        label: idea.id.replace("idea-", ""),
        variant: "primary",
      })),
    })
  }

  async function generateLegendaStage() {
    if (!selectedIdeaId || !roteiro) return
    const idea = ideasList.find((item) => item.id === selectedIdeaId)
    if (!idea) return

    setPhase("legenda")
    setLoadingStage("legenda")

    const loadingId = nextMessageId()
    appendMessage({
      id: loadingId,
      kind: "loading",
      role: "social",
      text: "Lapidando uma legenda curta, humana e com CTA leve...",
    })

    try {
      const response = await requestMission4<Mission4Legenda>({
        stage: "legenda",
        context: buildMissionContext(),
        idea,
        roteiro,
      })

      setLegenda(response)

      replaceMessage(loadingId, {
        id: nextMessageId(),
        kind: "legenda",
        role: "social",
        legenda: response,
      })

      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "social",
        text: "Clara, humana e pronta pra postar.",
      })

      await generateCalendarStage(idea, roteiro, response)
    } catch (error) {
      console.error("Erro ao gerar legenda da Missão 4:", error)
      replaceMessage(loadingId, {
        id: loadingId,
        kind: "text",
        role: "social",
        text: "Não consegui fechar essa legenda agora. Vamos tentar de novo?",
        tone: "note",
      })
      toast({
        title: "Falha ao gerar legenda",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setLoadingStage(null)
    }
  }

  async function generateCalendarStage(
    idea: Mission4Idea,
    roteiroResult: Mission4Roteiro,
    legendaResult: Mission4Legenda,
  ) {
    setPhase("calendar")
    setLoadingStage("calendar")

    const loadingId = nextMessageId()
    appendMessage({
      id: loadingId,
      kind: "loading",
      role: "social",
      text: "Fechando um calendário de 5 dias pra manter sua presença em movimento...",
    })

    try {
      const response = await requestMission4<Mission4Calendar>({
        stage: "calendar",
        context: buildMissionContext(),
        idea,
        roteiro: roteiroResult,
        legenda: legendaResult,
      })

      setCalendar(response)

      replaceMessage(loadingId, {
        id: nextMessageId(),
        kind: "calendar",
        role: "social",
        calendar: response,
      })

      appendMessage({
        id: nextMessageId(),
        kind: "summary",
        role: "social",
        results: buildMissionResults(response, roteiroResult, legendaResult),
        mainPhrase: mission2Snapshot?.selectedPhrase,
      })

      await finalizeMission(response, roteiroResult, legendaResult)
    } catch (error) {
      console.error("Erro ao gerar calendário da Missão 4:", error)
      replaceMessage(loadingId, {
        id: loadingId,
        kind: "text",
        role: "social",
        text: "Não consegui montar o calendário agora. Me chama de novo e eu refaço pra você.",
        tone: "note",
      })
      toast({
        title: "Falha ao gerar calendário",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setLoadingStage(null)
    }
  }

  function buildMissionResults(
    calendarResult: Mission4Calendar,
    roteiroResult: Mission4Roteiro,
    legendaResult: Mission4Legenda,
  ): Mission4Results {
    const generatedAt = new Date().toISOString()
    const results: Mission4Results = {
      generatedAt,
      ideas: ideasList,
      selectedIdeaId: selectedIdeaId ?? ideasList[0]?.id ?? "idea-1",
      roteiro: roteiroResult,
      legenda: legendaResult,
      calendar: calendarResult,
    }
    setFinalResults(results)

    try {
      if (typeof window !== "undefined") {
        window.localStorage?.setItem(MISSION4_STORAGE_KEY, JSON.stringify(results))
      }
    } catch (error) {
      console.warn("Não foi possível salvar Missão 4 no storage local:", error)
    }

    return results
  }

  async function finalizeMission(
    calendarResult: Mission4Calendar,
    roteiroResult: Mission4Roteiro,
    legendaResult: Mission4Legenda,
  ) {
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
      const results = finalResults ?? buildMissionResults(calendarResult, roteiroResult, legendaResult)
      await persistMissionResults(results)

      replaceMessage(mentorLoadingId, {
        id: nextMessageId(),
        kind: "text",
        role: "mentor",
        tone: "celebration",
        text: "Missao 4 concluida  |  +150 XP  |  Selo Marca em Movimento  |  Clareza 95 -> 98 %",
      })

      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "mentor",
        text: "Agora sua marca tem constancia e clareza. Na proxima missao, vamos medir impacto e ajustar com precisao.",
      })

      appendMessage({
        id: nextMessageId(),
        kind: "cta",
        role: "mentor",
        prompt: "Quer desbloquear a Missao 5 - Analise & Ajuste?",
        actions: [
          { id: "unlock-mission5", label: "📊 Desbloquear Missão 5", variant: "primary" },
          { id: "go-dashboard", label: "Voltar para a Sala da Marca" },
        ],
      })
    } catch (error) {
      console.error("Erro ao persistir Missão 4:", error)
      replaceMessage(mentorLoadingId, {
        id: mentorLoadingId,
        kind: "text",
        role: "mentor",
        tone: "note",
        text: "Recebi os resultados, mas não consegui salvar agora. Atualize a página ou tente novamente.",
      })
      toast({
        title: "Não consegui atualizar o dashboard",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      })
    } finally {
      setLoadingStage(null)
    }
  }

  async function persistMissionResults(results: Mission4Results) {
    if (!idUnico) {
      throw new Error("ID único não encontrado para atualizar o dashboard.")
    }

    const updatedStrategy = { ...(strategyData ?? {}) }
    updatedStrategy.missao4 = results
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

    const xpBase =
      typeof existingMetadata.xpAtual === "number"
        ? (existingMetadata.xpAtual as number)
        : typeof brandRecord?.xpAtual === "number"
          ? (brandRecord?.xpAtual as number)
          : 0
    const xpAtualizado = xpBase + 150

    const comparativo = Math.max(
      98,
      typeof existingMetadata.comparativoPercentual === "number"
        ? (existingMetadata.comparativoPercentual as number)
        : typeof brandRecord?.comparativoPercentual === "number"
          ? (brandRecord?.comparativoPercentual as number)
          : 0,
    )

    const metadataAtualizada: Record<string, unknown> = {
      ...existingMetadata,
      missaoAtual: "missao_5",
      missoesConcluidas: Array.from(completed),
      xpAtual: xpAtualizado,
      xpProximoNivel:
        typeof existingMetadata.xpProximoNivel === "number"
          ? existingMetadata.xpProximoNivel
          : brandRecord?.xpProximoNivel ?? xpAtualizado + 200,
      comparativoPercentual: comparativo,
      nivelAtual: existingMetadata.nivelAtual ?? brandRecord?.nivelAtual ?? "Marca em movimento",
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
        mission2Snapshot?.selectedPhrase ?? "",
        results.roteiro.gancho,
        results.legenda.text,
      ].filter(Boolean),
    })
  }

  function handleUnlockMission5() {
    toast({
      title: "Missao 5 - Analise & Ajuste",
      description: "Voce sera direcionado para finalizar o desbloqueio com seguranca.",
    })

    if (mission5WebhookUrl) {
      fetch(mission5WebhookUrl, { method: "POST" }).catch((error) => {
        console.warn("Falha ao acionar webhook da Missão 5:", error)
      })
    }

    if (mission5CheckoutUrl) {
      window.open(mission5CheckoutUrl, "_blank")
    }
  }

  function appendMessage(message: ChatMessage) {
    setMessages((prev) => [...prev, message])
  }

  function replaceMessage(id: string, updated: ChatMessage) {
    setMessages((prev) => prev.map((message) => (message.id === id ? updated : message)))
  }

  function buildMissionContext(): Mission4Context {
    return {
      brandName: brandRecord?.nomeMarca ?? brandRecord?.nome_empresa ?? undefined,
      creatorName: creatorName ?? undefined,
      mission1: mission1Snapshot,
      mission2: mission2Snapshot,
      mission3: mission3Snapshot,
    }
  }

  async function requestMission4<T>(payload: Record<string, unknown>): Promise<T> {
    const response = await fetch("/api/missao4/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || "Erro ao chamar API da Missão 4")
    }

    const json = (await response.json()) as { data: T }
    return json.data
  }

  const showProgressAside = phase !== "intro" || ideasList.length > 0

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f4f0ff] via-[#eef7ff] to-white">
      <MotionDiv aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pointer-events-none absolute inset-0">
        <div className="absolute -left-36 top-24 h-80 w-80 rounded-full bg-[#cbb7ff]/30 blur-3xl" />
        <div className="absolute right-[-160px] top-1/3 h-[420px] w-[420px] rounded-full bg-[#96ecff]/35 blur-3xl" />
        <div className="absolute bottom-[-180px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#e7f2ff]/50 blur-3xl" />
      </MotionDiv>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
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
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7f6bc8]">Missão 4</p>
                <h1 className="mt-1 text-2xl font-semibold text-[#211b45]">Conteúdo & Presença</h1>
              </div>
            </div>
            <div className="rounded-full border border-[#c0e9ff] bg-gradient-to-r from-[#d5c9ff]/60 to-[#c0f4ff]/60 px-4 py-1 text-sm font-semibold text-[#4f44a8] shadow-lg shadow-[#c7dcff]/60">
              Social Media ativo <Sparkles className="ml-2 inline h-4 w-4" />
            </div>
          </div>
          <p className="max-w-2xl text-sm text-[#4d4c6d]">
            "Postar nao e gritar, e lembrar o mundo do que voce acredita." Vamos transformar sua mensagem em presenca
            diaria, sem improviso e com todo o contexto das missoes anteriores.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="flex h-[720px] flex-col rounded-3xl border border-[#d9d8ff] bg-white/80 shadow-[0_24px_60px_rgba(130,118,255,0.12)] backdrop-blur">
            <div className="border-b border-[#e5e3ff] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#a17cff] to-[#5fd6ff] text-lg text-white shadow-lg shadow-[#b8b4ff]/60">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2b245b]">Social Media Menos Mais</p>
                  <p className="text-xs text-[#6d6b8b]">"Voce ja tem a mensagem. Eu vou colocar ela pra trabalhar."</p>
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
            </div>
          </section>

          {showProgressAside && (
            <aside className="flex flex-col gap-5">
              <div className="rounded-3xl border border-[#d7d1ff] bg-white/80 p-5 shadow-[0_16px_40px_rgba(109,99,255,0.12)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#efe9ff] p-2 text-[#6a58c8]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2f275d]">Checklist da Missão</p>
                    <p className="text-xs text-[#6d6b8b]">Cada entrega vira um ativo real no seu painel.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  {missionSteps.map((step) => {
                    const completed = stepStatuses[step.id as keyof typeof stepStatuses]
                    return (
                      <div
                        key={step.id}
                        className={cn(
                          "rounded-2xl border px-4 py-3 transition-colors",
                          completed
                            ? "border-[#c1b5ff] bg-gradient-to-r from-[#efeaff] to-[#e8f9ff]"
                            : "border-[#e2e0ff] bg-white/60",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#322d63]">{step.title}</p>
                          <span
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                              completed
                                ? "bg-[#a98cff] text-white"
                                : "border border-dashed border-[#d6d4ff] text-[#8c83c8]",
                            )}
                          >
                            {completed ? <CheckCircle2 className="h-4 w-4" /> : step.title.slice(0, 1)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#6f6d8d]">{step.description}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-[#d7f0ff] bg-[#f0fbff] p-5 text-sm text-[#37546b] shadow-[0_12px_30px_rgba(95,214,255,0.12)]">
                <div className="mb-3 flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-[#45b6ff]" />
                  <p className="font-semibold text-[#1f4560]">Lembrete</p>
                </div>
                <p>
                  Tudo fica salvo no seu dashboard. Se quiser refazer, é só disparar de novo: eu trago novas ideias e
                  comparo com o que já foi entregue.
                </p>
              </div>

              <div className="rounded-3xl border border-[#e1ddff] bg-white/80 p-5 text-sm text-[#4f4e6d] shadow-[0_12px_34px_rgba(130,118,255,0.08)]">
                <div className="mb-3 flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-[#7d68e0]" />
                  <p className="font-semibold text-[#2f275d]">Gamificação</p>
                </div>
                <ul className="space-y-2 text-xs text-[#5f5d7c]">
                  <li className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-[#ff8b5f]" />
                    +150 XP
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-[#7d68e0]" />
                    Selo: Marca em Movimento
                  </li>
                  <li className="flex items-center gap-2">
                    <CalendarCheck2 className="h-4 w-4 text-[#4a9ed6]" />
                    Clareza 98 %
                  </li>
                  <li className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-[#5fb2ff]" />
                    Animacao: feed em movimento (papel no ar)
                  </li>
                </ul>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

function ChatBubble({ message, onAction }: { message: ChatMessage; onAction: (id: string) => void }) {
  if (message.kind === "text") {
    const isMentor = message.role === "mentor"
    const bubbleClasses = cn(
      "max-w-[85%] rounded-3xl border px-5 py-4 text-sm leading-relaxed shadow-[0_18px_40px_rgba(109,99,255,0.08)]",
      message.role === "social"
        ? "border-[#dcd6ff] bg-white/90 text-[#3f3a7a]"
        : message.role === "mentor"
          ? "border-[#cbe9ff] bg-[#f4faff] text-[#26445a]"
          : "border-[#ede9ff] bg-white/70 text-[#565472]",
      message.tone === "celebration" ? "border-[#cbb8ff] bg-gradient-to-r from-[#f5efff] to-[#edf7ff]" : null,
      message.tone === "note" ? "border-dashed text-[#5e5d80]" : null,
    )
    return (
      <div className={cn("flex w-full", isMentor ? "justify-end" : "justify-start")}>
        <div className={bubbleClasses}>{message.text}</div>
      </div>
    )
  }

  if (message.kind === "loading") {
    return (
      <div className="flex w-full justify-start">
        <div className="flex items-center gap-3 rounded-3xl border border-dashed border-[#d9d1ff] bg-white/70 px-5 py-3 text-sm text-[#4b3f97]">
          <Loader2 className="h-4 w-4 animate-spin text-[#7e6bff]" />
          <span>{message.text ?? "Processando..."}</span>
        </div>
      </div>
    )
  }

  if (message.kind === "cta") {
    return (
      <div className="flex w-full justify-start">
        <div className="flex flex-col gap-3 rounded-3xl border border-[#dcd7ff] bg-white/90 px-5 py-4 text-sm text-[#403886] shadow-[0_18px_44px_rgba(109,99,255,0.12)]">
          {message.prompt && <p className="font-semibold text-[#2f275d]">{message.prompt}</p>}
          <div className="flex flex-wrap gap-2">
            {message.actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant === "primary" ? "default" : "outline"}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5",
                  action.variant === "primary"
                    ? "bg-[#6d5fd2] text-white hover:bg-[#5b4ec2]"
                    : "border-[#d5d2ff] text-[#5c54ac] hover:bg-[#f5f3ff]",
                )}
                onClick={() => onAction(action.id)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (message.kind === "ideas") {
    return (
      <div className="flex w-full justify-start">
        <div className="flex w-full flex-col gap-4 rounded-[28px] border border-[#d4cfff] bg-white/95 p-5 shadow-[0_24px_50px_rgba(109,99,255,0.14)]">
          {message.ideas.map((idea, index) => (
            <div
              key={idea.id}
              className="flex flex-col gap-2 rounded-2xl border border-[#e2deff] bg-gradient-to-r from-[#f5f2ff] to-[#eef7ff] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6d5fd2]/15 text-sm font-semibold text-[#6d5fd2]">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2d2860]">{idea.title}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7f6bc8]">{idea.format}</p>
                </div>
              </div>
              <p className="text-sm text-[#4a4587]">{idea.caption}</p>
              {idea.angle && <p className="text-xs text-[#6b65a1]">Ângulo: {idea.angle}</p>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (message.kind === "roteiro") {
    return (
      <div className="flex w-full justify-start">
        <div className="flex w-full flex-col gap-3 rounded-[28px] border border-[#d8d5ff] bg-white/95 p-5 shadow-[0_24px_44px_rgba(109,99,255,0.12)]">
          <p className="text-sm font-semibold text-[#2b255c]">Roteiro pronto pra usar</p>
          <div className="grid gap-3">
            <ContentLine label="Gancho" value={message.roteiro.gancho} />
            {message.roteiro.desenvolvimento.map((line, index) => (
              <ContentLine key={`dev-${index}`} label={index === 0 ? "Desenvolvimento" : ""} value={line} />
            ))}
            <ContentLine label="Insight" value={message.roteiro.insight} />
            <ContentLine label="Chamada para acao" value={message.roteiro.callToAction} />
          </div>
        </div>
      </div>
    )
  }

  if (message.kind === "legenda") {
    return (
      <div className="flex w-full justify-start">
        <div className="flex w-full flex-col gap-3 rounded-[28px] border border-[#dbe9ff] bg-[#f3f9ff] p-5 text-sm text-[#2e455a] shadow-[0_24px_44px_rgba(91,150,255,0.16)]">
          <p className="text-sm font-semibold text-[#214157]">Legenda final</p>
          <p className="text-sm leading-relaxed">{`"${message.legenda.text}"`}</p>
          <p className="text-xs text-[#4b6c80]">Caracteres: {message.legenda.characterCount}</p>
        </div>
      </div>
    )
  }

  if (message.kind === "calendar") {
    return (
      <div className="flex w-full justify-start">
        <div className="flex w-full flex-col gap-3 rounded-[28px] border border-[#d7f0ff] bg-white/95 p-5 shadow-[0_24px_44px_rgba(91,150,255,0.14)]">
          <p className="text-sm font-semibold text-[#214157]">Calendario inicial (5 dias)</p>
          <div className="space-y-3">
            {message.calendar.entries.map((entry) => (
              <div key={entry.day} className="rounded-2xl border border-[#e4f3ff] bg-[#f5fbff] p-4 text-sm text-[#2d4561]">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[#244056]">Dia {entry.day}</p>
                  <span className="rounded-full bg-[#dcecff] px-3 py-1 text-xs font-semibold text-[#1f4a6a]">
                    {entry.format}
                  </span>
                </div>
                <p className="mt-2 font-medium text-[#1f3c52]">{entry.theme}</p>
                <p className="mt-1 text-xs text-[#4f6b7f]">CTA: {entry.callToAction}</p>
              </div>
            ))}
          </div>
          {message.calendar.rationale && (
            <p className="text-xs text-[#3e5a70]">Nota: {message.calendar.rationale}</p>
          )}
        </div>
      </div>
    )
  }

  if (message.kind === "summary") {
    const selectedIdea = message.results.ideas.find((idea) => idea.id === message.results.selectedIdeaId)
    return (
      <div className="flex w-full justify-start">
        <div className="flex w-full flex-col gap-4 rounded-[28px] border border-[#dcd9ff] bg-white/95 p-5 shadow-[0_24px_48px_rgba(109,99,255,0.16)]">
          <p className="text-sm font-semibold text-[#322b6a]">Missao 4 concluida</p>
          <ul className="space-y-2 text-sm text-[#47427d]">
            <li>5 ideias de post</li>
            <li>Roteiro completo ({selectedIdea?.format ?? "Carrossel/Video"})</li>
            <li>Legenda final pronta</li>
            <li>Calendario estrategico (5 dias)</li>
          </ul>
          {message.mainPhrase && (
            <p className="text-xs text-[#5a57a1]">
              Tudo isso feito sob medida pra sua mensagem: <strong>{message.mainPhrase}</strong>
            </p>
          )}
        </div>
      </div>
    )
  }

  return null
}

function ContentLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#ebe7ff] bg-white/80 px-4 py-3 text-sm text-[#3c3774]">
      {label && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7f6bc8]">{label}</p>}
      <p className="mt-1 leading-relaxed text-[#3a3470]">{value}</p>
    </div>
  )
}

