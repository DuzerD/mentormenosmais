"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Brush,
  CheckCircle2,
  Loader2,
  Palette,
  Sparkles,
  Wand2,
} from "lucide-react"

import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { BrandplotCache } from "@/lib/brandplot-cache"
import {
  type DirectionsResponsePayload,
  type LayoutPreference,
  type Mission2Snapshot,
  type Mission3GuideSummary,
  type Mission3Results,
  type VisualDirectionOption,
  type VisualEnergyChoice,
} from "@/lib/missao3-types"
import { toast } from "@/hooks/use-toast"

type ChatRole = "designer" | "user" | "mentor"

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
      kind: "options"
      role: "designer"
      prompt: string
      layout?: "grid" | "row"
      options: OptionDefinition[]
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
      kind: "image"
      role: "designer"
      src: string
      alt: string
      caption: string
    }
  | {
      id: string
      kind: "summary"
      role: "designer"
      guide: Mission3GuideSummary
      imageUrl: string
    }

type OptionDefinition = {
  id: string
  label: string
  value?: string
  variant?: "primary" | "secondary"
}

type MissionPhase =
  | "intro"
  | "energy"
  | "directions"
  | "image"
  | "layout"
  | "guide"
  | "complete"

type LoadingStage = "directions" | "image" | "guide" | "persist" | null

type Mission2StoredResults = {
  selectedPhrase: string
  subtitle: string
  bio: string
  insight?: string
  userPhrase?: string
  generatedAt: string
}

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

const MotionDiv = motion.div

const MISSION2_STORAGE_KEY = "missao2_result"
const MISSION3_STORAGE_KEY = "missao3_result"

const mission4CheckoutUrl = process.env.NEXT_PUBLIC_MISSION4_CHECKOUT_URL
const mission4WebhookUrl = process.env.NEXT_PUBLIC_MISSION4_WEBHOOK_URL

const energyOptions: OptionDefinition[] = [
  { id: "energy-profissionalismo", label: "💼 Profissionalismo e confiança", value: "profissionalismo" },
  { id: "energy-inspiracao", label: "✨ Inspiração e propósito", value: "inspiracao" },
  { id: "energy-criatividade", label: "🎨 Criatividade e ousadia", value: "criatividade" },
  { id: "energy-calma", label: "🌿 Calma e autenticidade", value: "calma" },
  { id: "energy-energia", label: "⚡ Energia e movimento", value: "energia" },
]

const layoutOptions: OptionDefinition[] = [
  { id: "layout-curves", label: "Curvas suaves", value: "curves" },
  { id: "layout-lines", label: "Reta e sólida", value: "lines" },
  { id: "layout-none", label: "Nenhuma preferência", value: "none" },
]

const missionProgress = [
  {
    id: "energia",
    title: "Energia da marca",
    description: "Definindo a sensação que guia as escolhas visuais.",
  },
  {
    id: "direcao",
    title: "Direção visual",
    description: "Selecionando a narrativa que representa sua mensagem.",
  },
  {
    id: "mockup",
    title: "Mockup ao vivo",
    description: "Visualizando a identidade em um cartão interativo.",
  },
  {
    id: "kit",
    title: "Kit visual completo",
    description: "Paleta, tipografia e assinatura aplicáveis agora.",
  },
]

export default function Mission3Page() {
  return (
    <ProtectedRoute>
      <Mission3Content />
    </ProtectedRoute>
  )
}

function Mission3Content() {
  const router = useRouter()
  const [phase, setPhase] = useState<MissionPhase>("intro")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null)
  const [energyChoice, setEnergyChoice] = useState<VisualEnergyChoice | null>(null)
  const [directions, setDirections] = useState<VisualDirectionOption[]>([])
  const [selectedDirection, setSelectedDirection] = useState<VisualDirectionOption | null>(null)
  const [layoutPreference, setLayoutPreference] = useState<LayoutPreference>("none")
  const [currentImage, setCurrentImage] = useState<{ url: string; alt: string; prompt: string } | null>(null)
  const [mission2Snapshot, setMission2Snapshot] = useState<Mission2Snapshot | null>(null)
  const [brandRecord, setBrandRecord] = useState<BrandRecord | null>(null)
  const [strategyData, setStrategyData] = useState<Record<string, unknown> | null>(null)
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null)
  const [finalResults, setFinalResults] = useState<Mission3Results | null>(null)
  const [zoomImage, setZoomImage] = useState<string | null>(null)
  const [creatorName, setCreatorName] = useState<string | null>(null)
  const [introDispatched, setIntroDispatched] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [idUnico, setIdUnico] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement | null>(null)
  const messageId = useRef(0)
  const imageMessageId = useRef<string | null>(null)

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
    hydrateMission2Snapshot()
  }, [])

  useEffect(() => {
    if (mission2Snapshot && !introDispatched && !isRestoring) {
      dispatchIntro()
    }
  }, [mission2Snapshot, introDispatched, isRestoring])

  useEffect(() => {
    if (messages.length > 0) {
      const handle = setTimeout(() => scrollToBottom(), 40)
      return () => clearTimeout(handle)
    }
  }, [messages])

  const stepStatuses = useMemo(
    () => ({
      energia: Boolean(energyChoice),
      direcao: Boolean(selectedDirection),
      mockup: Boolean(currentImage),
      kit: phase === "complete" && Boolean(finalResults),
    }),
    [energyChoice, selectedDirection, currentImage, phase, finalResults],
  )

  function scrollToBottom() {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
    }
  }

  function appendMessage(message: ChatMessage) {
    setMessages((prev) => [...prev, message])
  }

  function replaceMessage(id: string, updated: ChatMessage) {
    setMessages((prev) => prev.map((message) => (message.id === id ? updated : message)))
  }

  function dispatchIntro() {
    if (!mission2Snapshot) return
    setIntroDispatched(true)
    setPhase("intro")
    const firstName = extractFirstName(creatorName ?? mission2Snapshot.brandName ?? "")
    appendMessage({
      id: nextMessageId(),
      kind: "text",
      role: "designer",
      text: `Oi, ${firstName || "por aqui"}! Sou o Designer da Menos Mais.`,
    })
    appendMessage({
      id: nextMessageId(),
      kind: "text",
      role: "designer",
      text: "Agora que sua mensagem está clara, é hora de fazer o mundo enxergar isso.",
    })
    appendMessage({
      id: nextMessageId(),
      kind: "text",
      role: "designer",
      tone: "note",
      text: "Mas relaxa — você não vai escolher paletas nem fontes aleatórias. Eu crio, você só sente o que combina com a sua marca.",
    })
    appendMessage({
      id: nextMessageId(),
      kind: "cta",
      role: "designer",
      prompt: "Pronto pra começar?",
      actions: [{ id: "start-mission3", label: "Ver minha marca nascer ✨", variant: "primary" }],
    })
  }

  function extractFirstName(value: string) {
    if (!value) return ""
    const [first] = value.trim().split(/\s+/)
    return first
  }

  async function hydrateMission2Snapshot() {
    try {
      if (typeof window !== "undefined") {
        const stored = window.localStorage?.getItem(MISSION2_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as Mission2StoredResults
          if (parsed?.selectedPhrase) {
            setMission2Snapshot({
              selectedPhrase: parsed.selectedPhrase,
              subtitle: parsed.subtitle,
              bio: parsed.bio,
              insight: parsed.insight,
            })
            return
          }
        }
      }
    } catch (error) {
      console.warn("Não foi possível normalizar resultados da Missão 2:", error)
    }
  }

  async function fetchBrandRecord(id: string) {
    try {
      const response = await fetch(`/api/brand-data?idUnico=${encodeURIComponent(id)}`)
      if (!response.ok) {
        console.warn("Falha ao buscar dados da marca para Missão 3:", await response.text())
        return
      }

      const json = (await response.json()) as { data?: BrandRecord }
      if (!json?.data) return
      const record = json.data
      setBrandRecord(record)

      if (record.estrategia) {
        const strategy =
          typeof record.estrategia === "string" ? (JSON.parse(record.estrategia) as Record<string, unknown>) : record.estrategia
        setStrategyData(strategy ?? null)

        const mission2 = strategy?.missao2 as Mission2StoredResults | undefined
        if (!mission2Snapshot && mission2?.selectedPhrase) {
          setMission2Snapshot({
            selectedPhrase: mission2.selectedPhrase,
            subtitle: mission2.subtitle,
            bio: mission2.bio,
            insight: mission2.insight,
          })
        }

        const storedMission3 = strategy?.missao3 as Mission3Results | undefined
        if (storedMission3?.finalImageUrl) {
          restoreMission3(storedMission3)
        }
      }

      if (record.onboardingMetadata) {
        const metadataParsed =
          typeof record.onboardingMetadata === "string"
            ? (JSON.parse(record.onboardingMetadata) as Record<string, unknown>)
            : (record.onboardingMetadata as Record<string, unknown>)
        setMetadata(metadataParsed ?? null)
      }
    } catch (error) {
      console.warn("Falha ao restaurar dados da marca (Missão 3):", error)
    }
  }

  function restoreMission3(results: Mission3Results) {
    setIsRestoring(true)
    setEnergyChoice(results.energy)
    setLayoutPreference(results.layoutPreference)
    setCurrentImage({ url: results.finalImageUrl, alt: "Identidade visual aprovada", prompt: "" })
    setFinalResults(results)
    setPhase("complete")

    appendMessage({
      id: nextMessageId(),
      kind: "text",
      role: "designer",
      tone: "note",
      text: `Missão 3 já está entregue, ${extractFirstName(creatorName ?? "por aqui")}. Quer revisar o kit visual?`,
    })
    appendMessage({
      id: (imageMessageId.current = nextMessageId()),
      kind: "image",
      role: "designer",
      src: results.finalImageUrl,
      alt: "Preview da identidade visual aprovada",
      caption: results.socialPreviewIdea,
    })
    appendMessage({
      id: nextMessageId(),
      kind: "summary",
      role: "designer",
      guide: {
        palette: results.palette,
        typography: results.typography,
        visualNotes: results.visualNotes,
        signatureIdea: results.signatureIdea,
        socialPreviewIdea: results.socialPreviewIdea,
        toneReminder: results.toneReminder,
      },
      imageUrl: results.finalImageUrl,
    })
    appendMessage({
      id: nextMessageId(),
      kind: "cta",
      role: "mentor",
      prompt: "Pronto para transformar essa identidade em presença?",
      actions: [
        { id: "unlock-mission4", label: "📱 Desbloquear Missão 4", variant: "primary" },
        { id: "go-dashboard", label: "Voltar para a Sala da Marca" },
      ],
    })
    setIsRestoring(false)
  }

  async function handleOptionSelect(optionId: string, value?: string) {
    if (loadingStage) return

    if (optionId === "start-mission3") {
      setPhase("energy")
      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "designer",
        text: "Quando alguém olha pra sua marca, o que você quer que ela transmita?",
      })
      appendMessage({
        id: nextMessageId(),
        kind: "options",
        role: "designer",
        prompt: "Escolha a energia que mais combina:",
        layout: "grid",
        options: energyOptions,
      })
      return
    }

    if (optionId.startsWith("energy-") && value) {
      const choice = value as VisualEnergyChoice
      const selected = energyOptions.find((option) => option.value === choice)
      if (!selected || !mission2Snapshot) return
      setEnergyChoice(choice)
      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "user",
        text: selected.label,
      })
      await generateDirections(choice, mission2Snapshot)
      return
    }

    if (optionId.startsWith("direction-") && value) {
      const direction = directions.find((item) => item.id === value) ?? directions[Number(optionId.split("-")[1]) - 1]
      if (!direction || !energyChoice || !mission2Snapshot) return
      setSelectedDirection(direction)
      setPhase("image")
      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "user",
        text: `Quero a direção ${direction.name}`,
      })
      await generateMockup(direction, mission2Snapshot, energyChoice, "none")
      return
    }

    if (optionId === "image-regenerate" && selectedDirection && energyChoice && mission2Snapshot) {
      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "user",
        text: "Quero ver outra versão",
      })
      await generateMockup(selectedDirection, mission2Snapshot, energyChoice, layoutPreference, "alternative")
      return
    }

    if (optionId === "image-approve") {
      setPhase("layout")
      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "user",
        text: "Sim! 🔥",
      })
      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "designer",
        text: "Perfeito. Agora me diz: você prefere mais curvas ou linhas retas?",
      })
      appendMessage({
        id: nextMessageId(),
        kind: "options",
        role: "designer",
        prompt: "Escolha o acabamento da estrutura:",
        options: layoutOptions,
      })
      return
    }

    if (optionId.startsWith("layout-") && value && selectedDirection && energyChoice && mission2Snapshot) {
      const layout = value as LayoutPreference
      setLayoutPreference(layout)
      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "user",
        text: layoutOptions.find((option) => option.value === layout)?.label ?? "Nenhuma preferência",
      })
      await generateMockup(selectedDirection, mission2Snapshot, energyChoice, layout)
      await generateGuideSummary()
      return
    }

    if (optionId === "unlock-mission4") {
      handleUnlockMission4()
      return
    }

    if (optionId === "go-dashboard") {
      router.push("/dashboard")
      return
    }
  }

  async function generateDirections(energy: VisualEnergyChoice, snapshot: Mission2Snapshot) {
    setLoadingStage("directions")
    const loadingId = nextMessageId()
    appendMessage({
      id: loadingId,
      kind: "loading",
      role: "designer",
      text: "Deixa eu explorar duas direções que traduzem essa energia...",
    })

    try {
      const response = await requestMission3<DirectionsResponsePayload>({
        stage: "directions",
        energy,
        mission2: snapshot,
      })

      setDirections(response.directions)

      const summaryLines = response.directions
        .map((direction, index) => `${index + 1}️⃣ *${direction.name}* — ${direction.summary}`)
        .join("  \n")

      replaceMessage(loadingId, {
        id: loadingId,
        kind: "text",
        role: "designer",
        text: `Perfeito. Olha o que eu imaginei pra sua marca:\n\n${summaryLines}\n\nQual dessas energias combina mais com o que você sente?`,
      })

      appendMessage({
        id: nextMessageId(),
        kind: "options",
        role: "designer",
        prompt: "Escolha uma direção visual para ver ao vivo:",
        options: response.directions.map((direction, index) => ({
          id: `direction-${index + 1}`,
          label: `${index + 1}️⃣ ${direction.name}`,
          value: direction.id,
        })),
      })
      setPhase("directions")
    } catch (error) {
      console.error("Erro ao gerar direções:", error)
      replaceMessage(loadingId, {
        id: loadingId,
        kind: "text",
        role: "designer",
        text: "Não consegui gerar as direções agora. Atualize a página ou tente novamente.",
        tone: "note",
      })
      toast({
        title: "Não consegui criar as direções",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setLoadingStage(null)
    }
  }

  async function generateMockup(
    direction: VisualDirectionOption,
    snapshot: Mission2Snapshot,
    energy: VisualEnergyChoice,
    layout: LayoutPreference,
    variant: "primary" | "alternative" = "primary",
  ) {
    setLoadingStage("image")
    const loadingId = nextMessageId()
    appendMessage({
      id: loadingId,
      kind: "loading",
      role: "designer",
      text: variant === "alternative" ? "Segura aí... recarregando o pincel pra uma nova variação." : "Pincel carregando... estou renderizando a primeira visão da sua identidade.",
    })

    try {
      const response = await requestMission3<{ imageUrl: string; prompt: string; altText: string }>({
        stage: "image",
        energy,
        direction,
        mission2: snapshot,
        layout,
        variant,
      })

      setCurrentImage({ url: response.imageUrl, alt: response.altText, prompt: response.prompt })

      const imageMessage: ChatMessage = {
        id: imageMessageId.current ?? nextMessageId(),
        kind: "image",
        role: "designer",
        src: response.imageUrl,
        alt: response.altText,
        caption: direction.summary,
      }

      if (imageMessageId.current) {
        replaceMessage(imageMessageId.current, imageMessage)
      } else {
        imageMessageId.current = imageMessage.id
        appendMessage(imageMessage)
      }

      replaceMessage(loadingId, {
        id: loadingId,
        kind: "text",
        role: "designer",
        text: variant === "alternative" ? "Aqui vai outra possibilidade dentro da mesma energia 👇" : "Aqui está a primeira visão da sua identidade 👇",
      })

      if (variant === "primary" && phase !== "layout") {
        appendMessage({
          id: nextMessageId(),
          kind: "cta",
          role: "designer",
          prompt: "Sente que ela te representa?",
          actions: [
            { id: "image-approve", label: "Sim! 🔥", variant: "primary" },
            { id: "image-regenerate", label: "Quero ver outra versão", variant: "secondary" },
          ],
        })
      } else if (phase === "layout") {
        appendMessage({
          id: nextMessageId(),
          kind: "text",
          role: "designer",
          text: "Perfeito. Esse detalhe faz diferença no reconhecimento da marca. Veja o resultado atualizado 👇",
        })
      }
    } catch (error) {
      console.error("Erro ao gerar mockup:", error)
      replaceMessage(loadingId, {
        id: loadingId,
        kind: "text",
        role: "designer",
        text: "Algo travou na renderização. Atualize a página e vamos tentar de novo.",
        tone: "note",
      })
      toast({
        title: "Não consegui renderizar o mockup",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setLoadingStage(null)
    }
  }

  async function generateGuideSummary() {
    if (!selectedDirection || !energyChoice || !mission2Snapshot || !currentImage) return
    setLoadingStage("guide")
    const loadingId = nextMessageId()
    appendMessage({
      id: loadingId,
      kind: "loading",
      role: "designer",
      text: "Montando seu kit visual completo...",
    })

    try {
      const response = await requestMission3<Mission3GuideSummary>({
        stage: "guide",
        energy: energyChoice,
        direction: selectedDirection,
        mission2: mission2Snapshot,
        layout: layoutPreference,
        palette: selectedDirection.palette,
      })

      const results: Mission3Results = {
        energy: energyChoice,
        direction: selectedDirection,
        layoutPreference,
        palette: response.palette,
        typography: response.typography,
        visualNotes: response.visualNotes,
        signatureIdea: response.signatureIdea,
        socialPreviewIdea: response.socialPreviewIdea,
        toneReminder: response.toneReminder,
        finalImageUrl: currentImage.url,
        generatedAt: new Date().toISOString(),
      }

      setFinalResults(results)
      persistLocalMission3(results)

      replaceMessage(loadingId, {
        id: loadingId,
        kind: "text",
        role: "designer",
        tone: "celebration",
        text: "Missão 3 concluída! Aqui está seu Kit Visual Menos Mais:",
      })

      appendMessage({
        id: nextMessageId(),
        kind: "summary",
        role: "designer",
        guide: response,
        imageUrl: currentImage.url,
      })

      await persistMissionResults(results)
      setPhase("complete")
    } catch (error) {
      console.error("Erro ao gerar kit visual:", error)
      replaceMessage(loadingId, {
        id: loadingId,
        kind: "text",
        role: "designer",
        text: "Não consegui consolidar o kit agora. Atualize a página ou tente novamente.",
        tone: "note",
      })
      toast({
        title: "Não consegui montar o kit visual",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setLoadingStage(null)
    }
  }

  async function persistMissionResults(results: Mission3Results) {
    if (!idUnico) {
      toast({
        title: "Não consegui salvar no painel",
        description: "ID da marca não encontrado. Atualize a página.",
        variant: "destructive",
      })
      return
    }

    const loadingId = nextMessageId()
    setLoadingStage("persist")
    appendMessage({
      id: loadingId,
      kind: "loading",
      role: "mentor",
      text: "Mentor-Raiz validando e atualizando sua Sala da Marca...",
    })

    try {
      const updatedStrategy = { ...(strategyData ?? {}) }
      updatedStrategy.missao3 = results
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

      const xpBase =
        typeof existingMetadata.xpAtual === "number"
          ? (existingMetadata.xpAtual as number)
          : typeof brandRecord?.xpAtual === "number"
            ? (brandRecord?.xpAtual as number)
            : 0
      const xpAtualizado = xpBase + 120

      const comparativo = Math.max(
        95,
        typeof existingMetadata.comparativoPercentual === "number"
          ? (existingMetadata.comparativoPercentual as number)
          : typeof brandRecord?.comparativoPercentual === "number"
            ? (brandRecord?.comparativoPercentual as number)
            : 0,
      )

      const metadataAtualizada: Record<string, unknown> = {
        ...existingMetadata,
        missaoAtual: "missao_4",
        missoesConcluidas: Array.from(completed),
        xpAtual: xpAtualizado,
        xpProximoNivel:
          typeof existingMetadata.xpProximoNivel === "number"
            ? existingMetadata.xpProximoNivel
            : brandRecord?.xpProximoNivel ?? xpAtualizado + 200,
        comparativoPercentual: comparativo,
        nivelAtual: existingMetadata.nivelAtual ?? brandRecord?.nivelAtual ?? "Em evolução",
      }

      setMetadata(metadataAtualizada)

      const response = await fetch("/api/brand-data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idUnico,
          estrategia: updatedStrategy,
          missaoLiberada: "missao_4",
          onboardingMetadata: metadataAtualizada,
          xpAtual: xpAtualizado,
          comparativoPercentual: comparativo,
        }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      BrandplotCache.update({
        answers: [results.direction.name, results.signatureIdea, results.toneReminder],
      })

      replaceMessage(loadingId, {
        id: loadingId,
        kind: "text",
        role: "mentor",
        text: "Incrível. Sua marca agora tem voz e rosto. Missão 3 concluída ✅  |  +120 XP  |  Selo “Identidade Viva”  |  Clareza 88 → 95 %",
        tone: "celebration",
      })

      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "mentor",
        text: "A próxima missão é Conteúdo e Presença, onde o Social Media transforma essa identidade em posts e campanhas reais.",
      })

      appendMessage({
        id: nextMessageId(),
        kind: "cta",
        role: "mentor",
        prompt: "Quer desbloquear a Missão 4?",
        actions: [
          { id: "unlock-mission4", label: "📱 Desbloquear Missão 4", variant: "primary" },
          { id: "go-dashboard", label: "Voltar para a Sala da Marca" },
        ],
      })
    } catch (error) {
      console.error("Erro ao persistir Missão 3:", error)
      replaceMessage(loadingId, {
        id: loadingId,
        kind: "text",
        role: "mentor",
        text: "Recebi o kit, mas não consegui salvar no painel agora. Atualize a página ou tente novamente em instantes.",
        tone: "note",
      })
      toast({
        title: "Não consegui atualizar o dashboard",
        description: "Atualize a página ou tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setLoadingStage(null)
    }
  }

  function persistLocalMission3(results: Mission3Results) {
    try {
      if (typeof window !== "undefined") {
        window.localStorage?.setItem(MISSION3_STORAGE_KEY, JSON.stringify(results))
      }
    } catch (error) {
      console.warn("Não foi possível salvar Missão 3 no storage local:", error)
    }
  }

  function handleUnlockMission4() {
    toast({
      title: "Missão 4 — Conteúdo e Presença",
      description: "Você será redirecionado para o checkout seguro do Mercado Pago.",
    })
    if (mission4WebhookUrl) {
      fetch(mission4WebhookUrl, { method: "POST" }).catch((error) => {
        console.warn("Falha ao acionar webhook da Missão 4:", error)
      })
    }
    if (mission4CheckoutUrl) {
      window.open(mission4CheckoutUrl, "_blank")
    }
  }

  async function requestMission3<T>(payload: Record<string, unknown>): Promise<T> {
    const response = await fetch("/api/missao3/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || "Erro ao chamar API da Missão 3")
    }

    const json = (await response.json()) as { data: T }
    return json.data
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f3f0ff] via-[#ecf7ff] to-white">
      <MotionDiv
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="absolute -left-64 top-24 h-96 w-96 rounded-full bg-[#c8b7ff]/30 blur-3xl" />
        <div className="absolute right-[-220px] top-1/3 h-[420px] w-[420px] rounded-full bg-[#a6e4ff]/35 blur-3xl" />
        <div className="absolute bottom-[-200px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#e0f5ff]/50 blur-3xl" />
      </MotionDiv>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-[#d7d1ff]/60 bg-white/85 p-6 backdrop-blur">
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
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7f6bc8]">Missão 3</p>
                <h1 className="mt-1 text-2xl font-semibold text-[#211b45]">Identidade Visual</h1>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-[#d7d1ff] bg-[#f6f3ff] px-4 py-2 text-sm text-[#5a4ab0]">
              <Palette className="h-4 w-4" />
              <span>Designer IA — calmo, confiante e inspirador</span>
            </div>
          </div>
          <p className="text-sm text-[#5b597d]">
            Transforme a mensagem lapidada pelo Copywriter em presença visual. Cada escolha aqui gera assets prontos para sua
            marca se posicionar com consistência.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className="flex flex-col gap-5 rounded-3xl border border-[#d9d5ff]/70 bg-white/85 p-5 shadow-[0_18px_40px_rgba(109,99,255,0.12)]">
            <div
              ref={listRef}
              className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-2"
            >
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.24 }}
                  >
                    <ChatBubble
                      message={message}
                      onSelectOption={handleOptionSelect}
                      onSelectAction={handleOptionSelect}
                      onZoom={setZoomImage}
                      disableOptions={Boolean(loadingStage)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            <div className="rounded-3xl border border-[#d9d1ff] bg-white/85 p-5 shadow-[0_12px_34px_rgba(130,118,255,0.12)]">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#efe9ff] p-2 text-[#6a58c8]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2f275d]">Checklist da missão</p>
                  <p className="text-xs text-[#6d6b8b]">Cada passo gera uma peça visual pronta.</p>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                {missionProgress.map((step) => {
                  const completed = stepStatuses[step.id as keyof typeof stepStatuses]
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "rounded-2xl border px-4 py-3",
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
                            completed ? "bg-[#a98cff] text-white" : "border border-dashed border-[#d6d4ff] text-[#8c83c8]",
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
                <p className="font-semibold text-[#1f4560]">Fluxo criativo</p>
              </div>
              <p>
                O primeiro mockup foca na energia escolhida. Ajustes finos ficam para a etapa "curvas x linhas". Peça novas
                versões sempre que quiser comparar sensações.
              </p>
            </div>

            <div className="rounded-3xl border border-[#dcd9ff] bg-white/85 p-5 text-sm text-[#4f4e6d] shadow-[0_12px_34px_rgba(130,118,255,0.08)]">
              <div className="mb-3 flex items-center gap-2">
                <Brush className="h-5 w-5 text-[#7d68e0]" />
                <p className="font-semibold text-[#2f275d]">Status geral</p>
              </div>
              <ul className="space-y-2 text-xs text-[#5f5d7c]">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#7d68e0]" />
                  Tom: calmo, confiante e inspirador
                </li>
                <li className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-[#7d68e0]" />
                  Imagens 1024px geradas via OpenAI image_gen
                </li>
                <li className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-[#7d68e0]" />
                  Mockup com pincel carregando para novas versões
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <Dialog open={Boolean(zoomImage)} onOpenChange={(open) => !open && setZoomImage(null)}>
        <DialogContent className="max-w-3xl rounded-3xl border border-[#d9d5ff] bg-white/95 p-0">
          {zoomImage && (
            <div className="relative aspect-square w-full overflow-hidden rounded-[28px]">
              <Image src={zoomImage} alt="Zoom da identidade visual" fill className="object-cover" unoptimized />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ChatBubble({
  message,
  onSelectOption,
  onSelectAction,
  onZoom,
  disableOptions,
}: {
  message: ChatMessage
  onSelectOption: (id: string, value?: string) => void
  onSelectAction: (id: string, value?: string) => void
  onZoom: (src: string | null) => void
  disableOptions: boolean
}) {
  if (message.kind === "text") {
    const isDesigner = message.role === "designer"
    const isMentor = message.role === "mentor"
    const alignment = message.role === "user" ? "justify-end" : "justify-start"
    const bubbleClass = isDesigner
      ? "bg-gradient-to-br from-[#f2edff] to-[#e8f4ff] text-[#352a77]"
      : isMentor
        ? "bg-[#f4fbf7] text-[#1f4b34] border border-[#d7f4e5]"
        : "bg-[#6150c5] text-white"

    return (
      <div className={cn("flex w-full", alignment)}>
        <div
          className={cn(
            "max-w-[78%] rounded-3xl px-5 py-3 text-sm shadow-[0_12px_24px_rgba(109,99,255,0.1)]",
            bubbleClass,
            message.tone === "celebration" && "border border-[#c3b2ff]",
            message.tone === "note" && "border border-dashed border-[#c9c1ff]",
          )}
        >
          <p className="whitespace-pre-line leading-relaxed">{message.text}</p>
        </div>
      </div>
    )
  }

  if (message.kind === "options") {
    return (
      <div className="flex w-full justify-start">
        <div className="flex w-full max-w-[80%] flex-col gap-3 rounded-3xl border border-[#dcd7ff] bg-white/85 px-5 py-4 text-sm text-[#403886] shadow-[0_12px_24px_rgba(109,99,255,0.1)]">
          <p className="font-medium text-[#342d70]">{message.prompt}</p>
          <div
            className={cn(
              "flex flex-wrap gap-2",
              message.layout === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : "justify-start",
            )}
          >
            {message.options.map((option) => (
              <Button
                key={option.id}
                variant={option.variant === "primary" ? "default" : "outline"}
                onClick={() => onSelectOption(option.id, option.value)}
                disabled={disableOptions}
                className={cn(
                  "rounded-2xl border border-[#d9d1ff] bg-white px-4 py-2 text-sm font-semibold text-[#5846b0] hover:bg-[#f1edff]",
                  disableOptions && "opacity-60",
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (message.kind === "cta") {
    return (
      <div className="flex w-full justify-center">
        <div className="flex w-full max-w-[80%] flex-col items-center gap-3 rounded-3xl border border-[#dcd7ff] bg-white/90 px-5 py-4 text-center text-sm text-[#403886] shadow-[0_12px_30px_rgba(109,99,255,0.12)]">
          {message.prompt && <p className="font-medium text-[#352f74]">{message.prompt}</p>}
          <div className="flex flex-wrap justify-center gap-3">
            {message.actions.map((action) => (
              <Button
                key={action.id}
                onClick={() => onSelectAction(action.id, action.value)}
                variant={action.variant === "primary" ? "default" : action.variant === "secondary" ? "outline" : "secondary"}
                disabled={disableOptions}
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm font-semibold",
                  action.variant === "primary"
                    ? "bg-gradient-to-r from-[#8f7bff] to-[#5ad6ff] text-slate-950 shadow-lg shadow-[#bcb2ff]/50"
                    : action.variant === "secondary"
                      ? "border border-[#d9d1ff] text-[#5846b0]"
                      : "bg-[#f1edff] text-[#4c3fa1]",
                  disableOptions && "opacity-60",
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

  if (message.kind === "image") {
    return (
      <div className="flex w-full justify-center">
        <div className="flex w-full max-w-[85%] flex-col gap-3 rounded-[28px] border border-[#d8d5ff] bg-white/90 p-4 shadow-[0_24px_50px_rgba(109,99,255,0.14)]">
          <motion.div
            className="relative aspect-square w-full overflow-hidden rounded-[24px]"
            initial={{ opacity: 0.6, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Image
              src={message.src}
              alt={message.alt}
              fill
              unoptimized
              className="cursor-zoom-in object-cover"
              onClick={() => onZoom(message.src)}
            />
          </motion.div>
          <p className="text-center text-sm text-[#463c8c]">{message.caption}</p>
        </div>
      </div>
    )
  }

  if (message.kind === "summary") {
    return (
      <div className="flex w-full justify-start">
        <div className="flex w-full flex-col gap-5 rounded-3xl border border-[#dcd7ff] bg-white/95 p-5 text-sm text-[#403886] shadow-[0_20px_44px_rgba(109,99,255,0.16)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7f6bc8]">Paleta</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {message.guide.palette.map((swatch) => (
                <div key={swatch.hex} className="flex items-center gap-3 rounded-2xl border border-[#e6e2ff] bg-white/90 px-3 py-2">
                  <span
                    className="h-10 w-10 rounded-2xl border border-white shadow-inner"
                    style={{ backgroundColor: swatch.hex }}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#2d2860]">{swatch.hex}</p>
                    <p className="text-xs text-[#6a6499]">{swatch.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7f6bc8]">Tipografia</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <TypographyCard title="Primária" font={message.guide.typography.primary} />
              {message.guide.typography.secondary && (
                <TypographyCard title="Secundária" font={message.guide.typography.secondary} />
              )}
              {message.guide.typography.accent && (
                <TypographyCard title="Acento" font={message.guide.typography.accent} />
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7f6bc8]">Notas de uso</p>
            <ul className="mt-2 space-y-2 text-sm text-[#51489a]">
              {message.guide.visualNotes.map((note, index) => (
                <li key={`${note}-${index}`} className="flex gap-2">
                  <span>-</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#e4e0ff] bg-[#f7f5ff] p-4 text-sm text-[#4a4097]">
            <p className="font-semibold">Assinatura visual</p>
            <p className="mt-1 text-sm text-[#4d4599]">{message.guide.signatureIdea}</p>
          </div>

          <div className="rounded-2xl border border-[#e0f3ff] bg-[#f1faff] p-4 text-sm text-[#345667]">
            <p className="font-semibold">Preview sugerido</p>
            <p className="mt-1">{message.guide.socialPreviewIdea}</p>
          </div>

          <p className="text-sm text-[#4a3f96]">{message.guide.toneReminder}</p>
        </div>
      </div>
    )
  }

  return null
}

function TypographyCard({
  title,
  font,
}: {
  title: string
  font: NonNullable<Mission3GuideSummary["typography"]["primary"]>
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[#e6e2ff] bg-white/90 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a6ade]">{title}</p>
      <p className="text-base font-semibold text-[#342d70]">{font.name}</p>
      <p className="text-xs text-[#665fb0]">{font.style}</p>
      <p className="text-xs text-[#7b76aa]">{font.usage}</p>
    </div>
  )
}
