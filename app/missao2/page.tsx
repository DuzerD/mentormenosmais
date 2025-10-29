
"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Loader2,
  MessageCircle,
  PenSquare,
  Sparkles,
  Wand2,
} from "lucide-react"

import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { BrandplotCache } from "@/lib/brandplot-cache"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const MotionDiv = motion.div

type ChatRole = "copywriter" | "user" | "mentor" | "system"
type MissionPhase = "intro" | "collectingPhrase" | "selectingOption" | "contentDecision" | "complete"
type StageLoading = "variations" | "assets" | "content" | null

type VariationResponse = {
  options: string[]
  insight?: string
}

type AssetsResponse = {
  subtitle: string
  instagramBio: string
  positioningNote?: string
}

type ContentResponse = {
  title: string
  bullets: string[]
  callToAction?: string
}

type Mission2Results = {
  userPhrase: string
  variations: string[]
  selectedIndex: number
  selectedPhrase: string
  subtitle: string
  bio: string
  insight?: string
  contentIdea?: ContentResponse | null
  generatedAt: string
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
      kind: "options"
      role: "copywriter"
      prompt: string
      options: string[]
      insight?: string
    }
  | {
      id: string
      kind: "cta"
      role: ChatRole
      prompt?: string
      actions: { id: string; label: string; variant?: "primary" | "secondary" }[]
    }
  | {
      id: string
      kind: "loading"
      role: ChatRole
      text?: string
    }
  | {
      id: string
      kind: "summary"
      role: ChatRole
      summary: Mission2Results
    }

type BrandRecord = {
  nome_empresa?: string
  missoesConcluidas?: string[] | null
  onboardingMetadata?: string | Record<string, unknown> | null
  estrategia?: string | Record<string, unknown> | null
  xpAtual?: number | null
  xpProximoNivel?: number | null
  comparativoPercentual?: number | null
  nivelAtual?: string | null
  missaoLiberada?: string | null
}

const MISSION_STORAGE_KEY = "missao2_result"

const missionProgress = [
  {
    id: "frase",
    title: "Mensagem central",
    description: "Transformar a frase original em promessa que vende.",
  },
  {
    id: "subtitle",
    title: "Benefício claro",
    description: "Subtítulo que explica o ganho final do cliente.",
  },
  {
    id: "bio",
    title: "Bio irresistível",
    description: "Posicionamento afiado para o Instagram.",
  },
  {
    id: "gancho",
    title: "Gancho de conteúdo",
    description: "Ideia pronta para postar e gerar desejo.",
  },
]

export default function Mission2Page() {
  return (
    <ProtectedRoute>
      <Mission2Experience />
    </ProtectedRoute>
  )
}

function ChatBubble({
  message,
  currentSelection,
  onSelectOption,
  disableOptions,
  onAction,
}: {
  message: ChatMessage
  currentSelection: number | null
  onSelectOption: (index: number) => void
  disableOptions: boolean
  onAction: (actionId: string) => void
}) {
  if (message.kind === "loading") {
    return (
      <div className={cn("flex w-full", message.role === "user" ? "justify-end" : "justify-start")}>
        <div className="flex max-w-[80%] items-center gap-3 rounded-3xl border border-[#e0ddff] bg-white/80 px-4 py-3 text-sm text-[#5d5a7a] shadow">
          <Loader2 className="h-4 w-4 animate-spin text-[#7d68e0]" />
          <span>{message.text ?? "Gerando..."}</span>
        </div>
      </div>
    )
  }

  if (message.kind === "options") {
    return (
      <div className="flex w-full justify-start">
        <div className="w-full max-w-[90%] rounded-3xl border border-[#d5c8ff] bg-[#f7f4ff] p-4 text-sm text-[#2f2a5c] shadow">
          <p className="text-sm font-semibold text-[#332c66]">{message.prompt}</p>
          <ul className="mt-3 space-y-3">
            {message.options.map((option, index) => {
              const isSelected = currentSelection === index
              return (
                <li
                  key={option}
                  className={cn(
                    "rounded-2xl border px-4 py-3 transition",
                    isSelected
                      ? "border-[#9b87ff] bg-white text-[#2f2a5c] shadow-[0_12px_30px_rgba(130,118,255,0.18)]"
                      : "border-[#e2dcff] bg-white/70 text-[#4f4c6d]",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{option}</span>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => onSelectOption(index)}
                      disabled={disableOptions}
                      className={cn(
                        "rounded-full px-4 py-1 text-xs font-semibold",
                        isSelected
                          ? "bg-gradient-to-r from-[#a17cff] to-[#5fd6ff] text-white shadow-lg shadow-[#b9b0ff]/60"
                          : "border-[#d4ceff] text-[#6a58c8] hover:bg-[#f0edff]",
                      )}
                    >
                      {isSelected ? "Selecionada" : "Escolher"}
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
          {message.insight && (
            <p className="mt-3 rounded-2xl border border-dashed border-[#d9d3ff] bg-white/70 px-3 py-2 text-xs text-[#6a68a0]">
              {message.insight}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (message.kind === "cta") {
    return (
      <div className="flex w-full justify-start">
        <div className="flex w-full max-w-[90%] flex-col items-center gap-3 rounded-3xl border border-[#d2f0ff] bg-[#f3fbff] px-5 py-4 text-sm text-[#2f536a] shadow">
          {message.prompt && <p className="text-center text-sm text-[#2f536a]">{message.prompt}</p>}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {message.actions.map((action) => (
              <MissionActionButton key={action.id} action={action} onAction={onAction} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (message.kind === "summary") {
    const { summary } = message
    return (
      <div className="flex w-full justify-start">
        <div className="w-full max-w-[90%] rounded-3xl border border-[#d5c8ff] bg-gradient-to-br from-[#f3f0ff] via-white to-[#edfbff] p-6 text-sm text-[#312d63] shadow-[0_24px_60px_rgba(120,108,255,0.18)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7d68e0]">Kit de clareza</p>
              <h2 className="mt-2 text-xl font-semibold text-[#211b45]">Tudo pronto para comunicar</h2>
              <p className="mt-1 text-xs text-[#5f5d7c]">
                Resultado gerado em {new Date(summary.generatedAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#a17cff] to-[#5fd6ff] text-white shadow-lg shadow-[#b9b0ff]/60">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <SummaryLine icon="🪄" label="Frase principal">
              {summary.selectedPhrase || summary.variations[summary.selectedIndex] || "-"}
            </SummaryLine>
            <SummaryLine icon="📝" label="Subtítulo">
              {summary.subtitle}
            </SummaryLine>
            <SummaryLine icon="📱" label="Bio de Instagram">
              {summary.bio}
            </SummaryLine>
            {summary.contentIdea && (
              <SummaryLine icon="🎯" label="Gancho de conteúdo">
                <strong>{summary.contentIdea.title}</strong>
                <ul className="mt-1 list-disc pl-5 text-[13px] text-[#4b4a68]">
                  {summary.contentIdea.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                {summary.contentIdea.callToAction && (
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#6d6b8b]">
                    CTA: {summary.contentIdea.callToAction}
                  </p>
                )}
              </SummaryLine>
            )}
          </div>
        </div>
      </div>
    )
  }

  const alignment = message.role === "user" ? "justify-end" : "justify-start"
  const isCopywriter = message.role === "copywriter"
  const isMentor = message.role === "mentor"
  const bubbleClasses = cn(
    "max-w-[80%] rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-md",
    message.role === "user" && "bg-gradient-to-r from-[#6a58c8] to-[#5fd6ff] text-white shadow-lg shadow-[#a28bff]/60",
    isCopywriter &&
      cn(
        "border border-[#d5c8ff] bg-gradient-to-br from-white via-[#f7f5ff] to-[#ebf9ff] text-[#302c63]",
        message.tone === "celebration" && "border-[#c8b7ff] bg-gradient-to-r from-[#efe6ff] to-[#def6ff]",
        message.tone === "note" && "border-[#c6e7ff] bg-[#eef9ff] text-[#31586d]",
      ),
    isMentor && "border border-[#d7f0ff] bg-[#f0fbff] text-[#2f536a]",
    message.role === "system" && "border border-[#e2e0ff] bg-white text-[#4f4e6d]",
  )

  return (
    <div className={cn("flex w-full", alignment)}>
      {(isCopywriter || isMentor) && (
        <div
          className={cn(
            "mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-md",
            isMentor
              ? "bg-gradient-to-br from-[#7d68e0] to-[#5fd6ff] text-white"
              : "bg-gradient-to-br from-[#a17cff] to-[#5fd6ff] text-white",
          )}
        >
          {isMentor ? "🎓" : "✨"}
        </div>
      )}
      <div className={bubbleClasses}>
        {message.text.split("\n").map((line, index) => (
          <p key={`${message.id}-${index}`} className="mt-1 first:mt-0">
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}

function MissionActionButton({
  action,
  onAction,
}: {
  action: { id: string; label: string; variant?: "primary" | "secondary" }
  onAction: (actionId: string) => void
}) {
  const variantClass =
    action.variant === "primary"
      ? "bg-gradient-to-r from-[#a17cff] to-[#5fd6ff] text-white shadow-lg shadow-[#b9b0ff]/60"
      : "border border-[#d7d1ff] bg-white/90 text-[#6a58c8] hover:bg-[#f4f0ff]"

  return (
    <Button
      onClick={() => onAction(action.id)}
      className={cn("rounded-full px-5 py-2 text-sm font-semibold transition", variantClass)}
      variant={action.variant === "primary" ? "default" : "outline"}
    >
      {action.label}
    </Button>
  )
}

function SystemLoadingBubble({ stage }: { stage: StageLoading }) {
  const stageLabel =
    stage === "variations"
      ? "Gerando versões curtas e impactantes..."
      : stage === "assets"
        ? "Lapidando Subtítulo e bio..."
        : stage === "content"
          ? "Modelando sua ideia de conteúdo..."
          : "Processando..."

  return (
    <div className="flex w-full justify-start">
      <div className="flex max-w-[80%] items-center gap-3 rounded-3xl border border-[#e1defb] bg-white/80 px-4 py-3 text-sm text-[#5f5d7c] shadow">
        <Loader2 className="h-4 w-4 animate-spin text-[#7d68e0]" />
        <span>{stageLabel}</span>
      </div>
    </div>
  )
}

function SummaryLine({
  icon,
  label,
  children,
}: {
  icon: string
  label: string
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[#e1ddff] bg-white/80 px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="text-lg">{icon}</span>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.24em] text-[#7f6bc8]">{label}</p>
          <div className="mt-2 text-sm text-[#302c63]">{children}</div>
        </div>
      </div>
    </div>
  )
}

function extractFirstName(fullName: string) {
  if (!fullName) return ""
  return fullName.trim().split(/\s+/)[0]
}

function parseRecordField<T>(value: unknown): T | null {
  if (!value) return null
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T
    } catch (error) {
      console.warn("Falha ao converter campo para JSON:", error)
      return null
    }
  }
  if (typeof value === "object") {
    return value as T
  }
  return null
}

function normalizeMission2Result(raw: Record<string, unknown>): Mission2Results | null {
  try {
    const userPhrase = typeof raw.userPhrase === "string" ? raw.userPhrase : ""
    const variations = Array.isArray(raw.variations)
      ? raw.variations.filter((v): v is string => typeof v === "string")
      : []
    const selectedIndex =
      typeof raw.selectedIndex === "number"
        ? raw.selectedIndex
        : typeof raw.selectedIndex === "string"
          ? Number.parseInt(raw.selectedIndex, 10)
          : 0
    const selectedPhrase =
      typeof raw.selectedPhrase === "string" ? raw.selectedPhrase : variations[selectedIndex] ?? ""
    const subtitle = typeof raw.subtitle === "string" ? raw.subtitle : ""
    const bio = typeof raw.bio === "string" ? raw.bio : ""
    const insight = typeof raw.insight === "string" ? raw.insight : undefined
    const generatedAt =
      typeof raw.generatedAt === "string" && !Number.isNaN(Date.parse(raw.generatedAt))
        ? raw.generatedAt
        : new Date().toISOString()

    let contentIdea: ContentResponse | null = null
    if (raw.contentIdea && typeof raw.contentIdea === "object") {
      const idea = raw.contentIdea as Record<string, unknown>
      const bullets = Array.isArray(idea.bullets)
        ? idea.bullets.filter((value): value is string => typeof value === "string")
        : []
      contentIdea = {
        title: typeof idea.title === "string" ? idea.title : "",
        bullets,
        callToAction: typeof idea.callToAction === "string" ? idea.callToAction : undefined,
      }
    }

    return {
      userPhrase,
      variations,
      selectedIndex,
      selectedPhrase,
      subtitle,
      bio,
      insight,
      contentIdea,
      generatedAt,
    }
  } catch (error) {
    console.warn("Não foi possível normalizar resultados da Missão 2:", error)
    return null
  }
}

function formatContentIdea(idea: ContentResponse) {
  const bullets = idea.bullets.map((bullet) => `• ${bullet}`).join("\n")
  const cta = idea.callToAction ? `\nCTA sugerido: ${idea.callToAction}` : ""
  return `🎯 Título: ${idea.title}\n${bullets}${cta}`
}

function Mission2Experience() {
  const router = useRouter()
  const [phase, setPhase] = useState<MissionPhase>("intro")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingStage, setLoadingStage] = useState<StageLoading>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [introDispatched, setIntroDispatched] = useState(false)
  const [creatorName, setCreatorName] = useState<string>("")
  const [idUnico, setIdUnico] = useState<string | null>(null)
  const [brandRecord, setBrandRecord] = useState<BrandRecord | null>(null)
  const [strategyData, setStrategyData] = useState<Record<string, unknown> | null>(null)
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null)
  const [userPhraseInput, setUserPhraseInput] = useState("")
  const [userPhrase, setUserPhrase] = useState("")
  const [variations, setVariations] = useState<string[]>([])
  const [variationInsight, setVariationInsight] = useState<string | undefined>(undefined)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [subtitle, setSubtitle] = useState("")
  const [bio, setBio] = useState("")
  const [contentIdea, setContentIdea] = useState<ContentResponse | null>(null)
  const [finalResults, setFinalResults] = useState<Mission2Results | null>(null)
  const [restoring, setRestoring] = useState(false)

  const messageCounterRef = useRef(0)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const nextMessageId = () => {
    messageCounterRef.current += 1
    return `msg-${messageCounterRef.current}`
  }

  const appendMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }

  const showLoadingMessage = (text: string, role: ChatRole) => {
    const id = nextMessageId()
    const loading: ChatMessage = {
      id,
      kind: "loading",
      role,
      text,
    }
    setMessages((prev) => [...prev, loading])
    return id
  }

  const replaceMessage = (targetId: string, replacement: ChatMessage | null) => {
    setMessages((prev) => {
      const without = prev.filter((msg) => msg.id !== targetId)
      if (!replacement) return without
      return [...without, replacement]
    })
  }

  async function openMercadoPagoCheckout() {
    if (!idUnico) {
      toast({
        title: "Ops, falta uma informação",
        description: "Não consegui localizar seu cadastro. Faça login novamente ou fale com o suporte.",
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: "Gerando checkout",
        description: "Abrindo o pagamento seguro do Mercado Pago em uma nova aba.",
      })

      const response = await fetch("/api/mercadopago/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idUnico, product: "missao_3" }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || "Falha ao criar preferência de pagamento")
      }

      const json = (await response.json()) as { init_point?: string | null; sandbox_init_point?: string | null }
      const checkoutUrl = json.sandbox_init_point ?? json.init_point

      if (!checkoutUrl) {
        throw new Error("Não recebi o link do checkout")
      }

      if (typeof window !== "undefined") {
        window.open(checkoutUrl, "_blank", "noopener")
      }
    } catch (error) {
      console.error("Falha ao iniciar checkout da Missão 3:", error)
      toast({
        title: "Não consegui abrir o checkout",
        description: "Tente novamente em instantes ou fale com o time de suporte.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const cache = BrandplotCache.get()
    if (cache?.idUnico) {
      setIdUnico(cache.idUnico)
    } else {
      const stored = window.localStorage?.getItem("brandplot_idUnico")
      if (stored) {
        setIdUnico(stored)
      }
    }

    if (cache?.companyName) {
      setCreatorName(extractFirstName(cache.companyName))
    }

    const storedResults = window.localStorage?.getItem(MISSION_STORAGE_KEY)
    if (storedResults) {
      try {
        const parsed: Mission2Results = JSON.parse(storedResults)
        hydrateFromStoredResults(parsed)
      } catch (error) {
        console.warn("Falha ao restaurar resultados da Missão 2 armazenados localmente:", error)
      }
    }
  }, [])

  useEffect(() => {
    if (!introDispatched && creatorName && phase !== "complete" && !restoring) {
      const introMessages: ChatMessage[] = [
        {
          id: nextMessageId(),
          kind: "text",
          role: "copywriter",
          tone: "celebration",
          text: `E aí, ${creatorName}? ✍️ Eu sou o Copywriter da Menos Mais — minha missão é pegar o que você quis dizer e transformar em palavras que vendem.`,
        },
        {
          id: nextMessageId(),
          kind: "text",
          role: "copywriter",
          text: "Hoje você não vai escrever nada difícil. Só me conta, do seu jeito, o que você faz e eu te mostro como deixar irresistível. Topa?"
        },
        {
          id: nextMessageId(),
          kind: "cta",
          role: "copywriter",
          prompt: "Pronto para ver sua mensagem ganhar brilho?",
          actions: [{ id: "start", label: "Bora ver o que você faz de verdade 💬", variant: "primary" }],
        },
      ]
      setMessages(introMessages)
      setIntroDispatched(true)
    }
  }, [creatorName, introDispatched, phase, restoring])

  useEffect(() => {
    if (phase === "complete") {
      setLoadingStage(null)
    }
  }, [phase])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, loadingStage])

  useEffect(() => {
    if (!idUnico) return
    let cancelled = false

    ;(async () => {
      try {
        const response = await fetch(`/api/brand-data?idUnico=${encodeURIComponent(idUnico)}`)
        if (!response.ok) {
          if (response.status !== 404) {
            console.warn("Falha ao buscar dados da marca para Missão 2:", await response.text())
          }
          return
        }
        const payload = await response.json()
        if (cancelled || !payload?.data) return

        const data: BrandRecord = payload.data
        setBrandRecord(data)

        if (!creatorName && data?.nome_empresa) {
          setCreatorName(extractFirstName(data.nome_empresa))
        }

        const parsedMetadata = parseRecordField<Record<string, unknown>>(data.onboardingMetadata)
        if (parsedMetadata) {
          setMetadata(parsedMetadata)
        }

        const parsedStrategy = parseRecordField<Record<string, unknown>>(data.estrategia)
        if (parsedStrategy) {
          setStrategyData(parsedStrategy)
          const mission2Raw = parsedStrategy?.missao2
          if (mission2Raw && typeof mission2Raw === "object" && !finalResults) {
            const restored = normalizeMission2Result(mission2Raw as Record<string, unknown>)
            if (restored) {
              hydrateFromStoredResults(restored)
            }
          }
        }
      } catch (error) {
        console.warn("Erro ao obter dados da marca (Missão 2):", error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [idUnico, creatorName, finalResults])

  function hydrateFromStoredResults(results: Mission2Results) {
    setRestoring(true)
    setFinalResults(results)
    setUserPhrase(results.userPhrase)
    setVariations(results.variations)
    setVariationInsight(results.insight)
    setSelectedIndex(results.selectedIndex)
    setSubtitle(results.subtitle)
    setBio(results.bio)
    setContentIdea(results.contentIdea ?? null)
    setPhase("complete")

    const summaryMessages: ChatMessage[] = [
      {
        id: nextMessageId(),
        kind: "text",
        role: "copywriter",
        tone: "note",
        text: `Missão 2 já foi concluída, ${creatorName || "por aqui"}! Se quiser revisar, aqui está o kit que preparamos na última sessão.`,
      },
      {
        id: nextMessageId(),
        kind: "summary",
        role: "copywriter",
        summary: results,
      },
      {
        id: nextMessageId(),
        kind: "cta",
        role: "mentor",
        prompt: "Pronto para avançar com a Identidade Visual?",
        actions: [
          { id: "go-dashboard", label: "Voltar para a Sala da Marca" },
          { id: "unlock-mission3", label: "🎨 Desbloquear Missão 3 – R$ 197", variant: "primary" },
          { id: "restart", label: "Refazer Missão 2", variant: "secondary" },
        ],
      },
    ]

    setMessages(summaryMessages)
    setRestoring(false)
  }

  const currentStepStatuses = useMemo(() => {
    const statuses = {
      frase: selectedIndex !== null,
      subtitle: Boolean(subtitle),
      bio: Boolean(bio),
      gancho: phase === "complete" && Boolean(finalResults?.contentIdea || finalResults),
    }
    return statuses
  }, [selectedIndex, subtitle, bio, phase, finalResults])

  function handleAction(actionId: string) {
    if (actionId === "start") {
      setPhase("collectingPhrase")
      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "copywriter",
        text: "Manda ver: em uma frase simples, me conta o que você faz.",
      })
      return
    }

    if (actionId === "go-dashboard") {
      router.push("/dashboard")
      return
    }

    if (actionId === "restart") {
      resetMission()
      return
    }

    if (actionId === "unlock-mission3") {
      void openMercadoPagoCheckout()
      return
    }

    if (actionId === "skip-content") {
      finalizeMission()
      return
    }

    if (actionId === "generate-content") {
      generateContentIdea()
      return
    }
  }

  async function handleSubmitPhrase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userPhraseInput.trim() || loadingStage) return

    const phrase = userPhraseInput.trim()
    setUserPhrase(phrase)
    setUserPhraseInput("")
    setVariations([])
    setVariationInsight(undefined)
    setSelectedIndex(null)
    setSubtitle("")
    setBio("")
    setContentIdea(null)
    setPhase("collectingPhrase")

    appendMessage({
      id: nextMessageId(),
      kind: "text",
      role: "user",
      text: phrase,
    })

    setLoadingStage("variations")
    const loadingId = showLoadingMessage("Lapidando versões que vendem...", "copywriter")

    try {
      const response = await fetch("/api/missao2/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "variations", userPhrase: phrase }),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const payload = await response.json()
      const data = payload?.data as VariationResponse | undefined
      if (!data?.options?.length) {
        throw new Error("Não recebi opções suficientes da IA.")
      }

      setVariations(data.options)
      setVariationInsight(data.insight)

      replaceMessage(loadingId, {
        id: nextMessageId(),
        kind: "text",
        role: "copywriter",
        text: "Perfeito. Olha o que eu faria com isso:",
      })

      appendMessage({
        id: nextMessageId(),
        kind: "options",
        role: "copywriter",
        prompt: "Escolhe a que mais soa como você:",
        options: data.options,
        insight: data.insight,
      })
      setPhase("selectingOption")
    } catch (error) {
      console.error("Erro ao gerar variações:", error)
      replaceMessage(loadingId, {
        id: nextMessageId(),
        kind: "text",
        role: "copywriter",
        text: "Ops... tentei puxar ideias aqui e deu ruim. Topa tentar de novo com outra frase ou ajustar a forma como descreveu?",
      })
      setPhase("collectingPhrase")
      toast({
        title: "Não consegui gerar variações",
        description: "A IA não respondeu como esperado. Ajuste o texto e tente outra vez.",
        variant: "destructive",
      })
    } finally {
      setLoadingStage(null)
    }
  }

  async function handleSelectVariation(index: number) {
    if (loadingStage || phase !== "selectingOption") return
    setSelectedIndex(index)
    const chosen = variations[index]
    if (!chosen) return

    appendMessage({
      id: nextMessageId(),
      kind: "text",
      role: "user",
      text: `Fico com a ${index + 1}ª versão.`,
    })

    appendMessage({
      id: nextMessageId(),
      kind: "text",
      role: "copywriter",
      text: "Boa escolha. Essa vai ser a base da sua comunicação principal — simples, direta e memorável.",
    })

    setLoadingStage("assets")
    const loadingId = showLoadingMessage("Conectando benefício final e bio...", "copywriter")

    try {
      const response = await fetch("/api/missao2/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "assets",
          selectedPhrase: chosen,
          userPhrase,
        }),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const payload = await response.json()
      const data = payload?.data as AssetsResponse | undefined
      if (!data?.subtitle || !data?.instagramBio) {
        throw new Error("Resposta incompleta da IA para subtítulo ou bio.")
      }

      setSubtitle(data.subtitle)
      setBio(data.instagramBio)

      replaceMessage(loadingId, {
        id: nextMessageId(),
        kind: "text",
        role: "copywriter",
        text:
          "Perfeito. Essa frase sozinha já vende. Mas com um subtítulo e uma bio assim, ninguém fica em dúvida:",
      })
      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "copywriter",
        tone: "note",
        text: `💬 Subtítulo: ${data.subtitle}
📱 Bio: ${data.instagramBio}`,
      })

      setPhase("contentDecision")
      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "copywriter",
        text: "Quer que eu já puxe uma ideia de post pra você começar a aplicar isso?",
      })
      appendMessage({
        id: nextMessageId(),
        kind: "cta",
        role: "copywriter",
        actions: [
          { id: "generate-content", label: "Sim! 💡", variant: "primary" },
          { id: "skip-content", label: "Depois", variant: "secondary" },
        ],
      })
    } catch (error) {
      console.error("Erro ao gerar subtítulo e bio:", error)
      replaceMessage(loadingId, {
        id: nextMessageId(),
        kind: "text",
        role: "copywriter",
        text: "Não consegui montar o subtítulo e a bio agora. Vamos tentar de novo?",
      })
      setPhase("selectingOption")
      toast({
        title: "Falha ao gerar subtítulo",
        description: "Recarregue ou tente novamente daqui a pouco. Pode ser instabilidade da IA.",
        variant: "destructive",
      })
    } finally {
      setLoadingStage(null)
    }
  }

  async function generateContentIdea() {
    if (loadingStage || !subtitle || !bio || selectedIndex === null) return
    setLoadingStage("content")
    const loadingId = showLoadingMessage("Lapidando um gancho campeão...", "copywriter")

    try {
      const response = await fetch("/api/missao2/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "content",
          selectedPhrase: variations[selectedIndex],
          subtitle,
          bio,
        }),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const payload = await response.json()
      const data = payload?.data as ContentResponse | undefined
      if (!data?.title || !data?.bullets?.length) {
        throw new Error("Resposta incompleta da IA para conteúdo.")
      }

      setContentIdea(data)
      replaceMessage(loadingId, {
        id: nextMessageId(),
        kind: "text",
        role: "copywriter",
        text: "Olha o que pensei pra você postar já:",
      })

      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "copywriter",
        tone: "note",
        text: formatContentIdea(data),
      })

      finalizeMission()
    } catch (error) {
      console.error("Erro ao gerar conteúdo:", error)
      replaceMessage(loadingId, {
        id: nextMessageId(),
        kind: "text",
        role: "copywriter",
        text: "Não consegui criar a ideia de post agora. Quer seguir assim mesmo ou tenta outra vez?",
      })
      setLoadingStage(null)
      toast({
        title: "Falha ao gerar ideia de conteúdo",
        description: "A sugestão de post não foi criada. Você pode tentar novamente quando quiser.",
        variant: "destructive",
      })
    }
  }

  async function finalizeMission() {
    if (isSaving) return
    if (!userPhrase || selectedIndex === null || !subtitle || !bio) {
      return
    }

    const results: Mission2Results = {
      userPhrase,
      variations,
      selectedIndex,
      selectedPhrase: variations[selectedIndex] ?? "",
      subtitle,
      bio,
      insight: variationInsight,
      contentIdea,
      generatedAt: new Date().toISOString(),
    }

    setFinalResults(results)
    setPhase("complete")

    try {
      if (typeof window !== "undefined") {
        window.localStorage?.setItem(MISSION_STORAGE_KEY, JSON.stringify(results))
      }
    } catch (error) {
      console.warn("Não foi possível salvar Missão 2 no storage local:", error)
    }

    BrandplotCache.update({
      answers: [results.selectedPhrase, results.subtitle, results.bio],
    })

    appendMessage({
      id: nextMessageId(),
      kind: "text",
      role: "copywriter",
      tone: "celebration",
      text: "Agora sim: sua voz está afinada e sua mensagem fala sozinha.",
    })
    appendMessage({
      id: nextMessageId(),
      kind: "summary",
      role: "copywriter",
      summary: results,
    })
    appendMessage({
      id: nextMessageId(),
      kind: "text",
      role: "copywriter",
      text: `Missão 2 concluída, ${creatorName || "por aqui"}! Aqui vai seu kit de clareza em mãos.`,
    })

    const loadingId = showLoadingMessage("Mentor-Raiz conferindo tudo...", "mentor")
    setIsSaving(true)

    try {
      await persistMissionResults(results)
      replaceMessage(loadingId, {
        id: nextMessageId(),
        kind: "text",
        role: "mentor",
        text: "Excelente! Sua mensagem agora é nítida, convincente e pronta pra ser transformada em imagem.",
      })
      appendMessage({
        id: nextMessageId(),
        kind: "text",
        role: "mentor",
        tone: "note",
        text: "Missão 2 concluída ✅  |  +100 XP  |  Selo \"Voz Clara\"  |  Clareza 88%",
      })
      appendMessage({
        id: nextMessageId(),
        kind: "cta",
        role: "mentor",
        prompt: "Pronto para desbloquear a próxima etapa com o Designer?",
        actions: [
          { id: "unlock-mission3", label: "🎨 Desbloquear Missão 3 – R$ 197", variant: "primary" },
          { id: "go-dashboard", label: "Voltar para a Sala da Marca" },
        ],
      })
    } catch (error) {
      console.error("Erro ao persistir Missão 2:", error)
      replaceMessage(loadingId, {
        id: nextMessageId(),
        kind: "text",
        role: "mentor",
        text: "Recebi o kit, mas algo deu errado ao salvar no painel. Atualize a página ou tente de novo em instantes.",
      })
      toast({
        title: "Não consegui atualizar o dashboard",
        description: "Se o problema continuar, tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setLoadingStage(null)
    }
  }

  function resetMission() {
    setPhase("intro")
    setMessages([])
    setIntroDispatched(false)
    setUserPhrase("")
    setUserPhraseInput("")
    setVariations([])
    setVariationInsight(undefined)
    setSelectedIndex(null)
    setSubtitle("")
    setBio("")
    setContentIdea(null)
    setFinalResults(null)
    try {
      if (typeof window !== "undefined") {
        window.localStorage?.removeItem(MISSION_STORAGE_KEY)
      }
    } catch (error) {
      console.warn("Falha ao limpar storage da Missão 2:", error)
    }
  }

  async function persistMissionResults(results: Mission2Results) {
    if (!idUnico) {
      throw new Error("ID único não encontrado para atualização do dashboard.")
    }

    const currentStrategy = strategyData ? { ...strategyData } : {}
    currentStrategy.missao2 = {
      ...results,
    }
    setStrategyData(currentStrategy)

    const existingMetadata = metadata ? { ...metadata } : {}
    const completedSet = new Set<string>()
    const existingList = Array.isArray(existingMetadata.missoesConcluidas)
      ? (existingMetadata.missoesConcluidas as string[])
      : []
    existingList.forEach((value) => completedSet.add(value))
    completedSet.add("missao_1")
    completedSet.add("missao_2")

    const xpBase =
      typeof existingMetadata.xpAtual === "number"
        ? (existingMetadata.xpAtual as number)
        : typeof brandRecord?.xpAtual === "number"
          ? (brandRecord?.xpAtual as number)
          : 0

    const xpAtualizado = xpBase + 100
    const comparativo = Math.max(
      88,
      typeof existingMetadata.comparativoPercentual === "number"
        ? (existingMetadata.comparativoPercentual as number)
        : typeof brandRecord?.comparativoPercentual === "number"
          ? (brandRecord?.comparativoPercentual as number)
          : 0,
    )

    const metadataAtualizada: Record<string, unknown> = {
      ...existingMetadata,
      missaoAtual: "missao_3",
      missoesConcluidas: Array.from(completedSet),
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
        estrategia: currentStrategy,
        missaoLiberada: "missao_3",
        onboardingMetadata: metadataAtualizada,
        xpAtual: xpAtualizado,
        comparativoPercentual: comparativo,
      }),
    })

    if (!response.ok) {
      throw new Error(await response.text())
    }
  }

  const showInputArea = phase === "collectingPhrase" && !loadingStage
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#f4f0ff] via-[#edf8ff] to-white">
      <MotionDiv
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -left-52 top-24 h-96 w-96 rounded-full bg-[#bfa8ff]/30 blur-3xl" />
        <div className="absolute right-[-160px] top-1/3 h-[420px] w-[420px] rounded-full bg-[#8fe6ff]/40 blur-3xl" />
        <div className="absolute bottom-[-180px] left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#d9f1ff]/50 blur-3xl" />
      </MotionDiv>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-[#d5c8ff]/50 bg-white/80 p-6 backdrop-blur">
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
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7f6bc8]">Missão 2</p>
                <h1 className="mt-1 text-2xl font-semibold text-[#211b45]">Clareza da Mensagem</h1>
              </div>
            </div>
            <div className="rounded-full border border-[#c8d1ff] bg-gradient-to-r from-[#d7c7ff]/60 to-[#c0f0ff]/60 px-4 py-1 text-sm font-semibold text-[#6151c1] shadow-lg shadow-[#c3d2ff]/50">
              Copywriter ativo ✨
            </div>
          </div>
          <p className="max-w-2xl text-sm text-[#4d4c6d]">
            Vamos transformar sua explicação em uma promessa clara, desejável e impossível de ignorar. A cada etapa você só
            valida — quem faz a mágica é a IA.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="flex h-[700px] flex-col rounded-3xl border border-[#d9d8ff] bg-white/75 shadow-[0_24px_60px_rgba(130,118,255,0.12)] backdrop-blur">
            <div className="border-b border-[#e5e3ff] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#a17cff] to-[#5fd6ff] text-lg">
                  ✨
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2b245b]">Copywriter Menos Mais</p>
                  <p className="text-xs text-[#6d6b8b]">"Seu cliente não precisa te entender; precisa te desejar."</p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
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
                    <ChatBubble
                      message={message}
                      currentSelection={selectedIndex}
                      onSelectOption={handleSelectVariation}
                      disableOptions={loadingStage !== null || phase !== "selectingOption"}
                      onAction={handleAction}
                    />
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
                  <SystemLoadingBubble stage={loadingStage} />
                </MotionDiv>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-[#e5e3ff] p-5">
              {showInputArea ? (
                <form onSubmit={handleSubmitPhrase} className="flex flex-col gap-3">
                  <label htmlFor="userPhrase" className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8370d4]">
                    Em uma frase, o que você faz?
                  </label>
                  <textarea
                    id="userPhrase"
                    value={userPhraseInput}
                    onChange={(event) => setUserPhraseInput(event.target.value)}
                    placeholder="Ex: Eu ajudo pequenas marcas a organizar sua comunicação para vender com clareza."
                    className="min-h-[96px] w-full resize-none rounded-2xl border border-[#d7d3ff] bg-white/80 px-4 py-3 text-sm text-[#2f2c5c] shadow-inner focus:border-[#9a86ff] focus:outline-none focus:ring-2 focus:ring-[#c2b6ff]"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-[#6f6d8d]">
                      Dica: fale do resultado que você entrega, não só das tarefas. Eu traduzo o resto por você.
                    </p>
                    <Button
                      type="submit"
                      disabled={!userPhraseInput.trim() || loadingStage !== null}
                      className="rounded-full bg-gradient-to-r from-[#a17cff] to-[#5fd6ff] px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-[#b9b0ff]/60 transition focus-visible:ring-2 focus-visible:ring-[#a17cff] focus-visible:ring-offset-2"
                    >
                      {loadingStage === "variations" ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Gerando.
                        </span>
                      ) : (
                        "Gerar versões"
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[#d6d4ff] bg-[#f6f4ff]/70 px-4 py-3 text-xs text-[#6f6d8d]">
                  <span>
                    {phase === "complete"
                      ? "Missão entregue. Você pode revisar o kit acima ou voltar para a Sala da Marca."
                      : loadingStage
                        ? "Segura aí. O Copywriter está alinhando cada palavra pra você."
                        : "Assim que você responder, eu modelo a mensagem inteira."
                    }
                  </span>
                  {phase === "collectingPhrase" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPhase("collectingPhrase")}
                      className="text-xs font-semibold text-[#6a58c8]"
                    >
                      Escrever agora
                    </Button>
                  )}
                </div>
              )}
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            <div className="rounded-3xl border border-[#d7d1ff] bg-white/80 p-5 shadow-[0_16px_40px_rgba(109,99,255,0.12)]">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#efe9ff] p-2 text-[#6a58c8]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2f275d]">Checklist da Missão</p>
                  <p className="text-xs text-[#6d6b8b]">Todo passo gera um ativo pronto pra usar.</p>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                {missionProgress.map((step) => {
                  const completed = currentStepStatuses[step.id as keyof typeof currentStepStatuses]
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
                <p className="font-semibold text-[#1f4560]">Lembrete</p>
              </div>
              <p>
                Cada output é salvo automaticamente no seu painel. Se quiser ajustar algo depois, basta refazer a missão —
                o Mentor-Raiz mantém o histórico pra comparar evoluções.
              </p>
            </div>

            <div className="rounded-3xl border border-[#dcd9ff] bg-white/80 p-5 text-sm text-[#4f4e6d] shadow-[0_12px_34px_rgba(130,118,255,0.08)]">
              <div className="mb-3 flex items-center gap-2">
                <Brain className="h-5 w-5 text-[#7d68e0]" />
                <p className="font-semibold text-[#2f275d]">Status Geral</p>
              </div>
              <ul className="space-y-2 text-xs text-[#5f5d7c]">
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-[#7d68e0]" />
                  Tom: charmoso, brincalhão e direto
                </li>
                <li className="flex items-center gap-2">
                  <PenSquare className="h-4 w-4 text-[#7d68e0]" />
                  Modelo: gpt-4-turbo gerando copy sob medida
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#7d68e0]" />
                  Resultados salvos automaticamente na Sala da Marca
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}





























