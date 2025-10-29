"use client"
import type { ReactNode } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Mic, MicOff, Upload, Sparkles, CheckCircle, Image as ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { MissionZeroProvider, useMissionZero } from "@/hooks/use-mission-zero"
import { AuthManager } from "@/lib/auth-utils"
import { BrandplotCache } from "@/lib/brandplot-cache"
type MissionQuestion = {
  id:
    | "brandName"
    | "brandOrigin"
    | "brandVoice"
    | "uniqueValue"
    | "idealCustomer"
    | "currentCustomer"
    | "desiredPerception"
    | "quarterGoals"
    | "instagramRef"
  stage: string
  title: string
  question: string
  placeholder: string
  mentorFeedback: string
  microFeedback?: string
  type: "text" | "file"
}
const QUESTIONS: MissionQuestion[] = [
  {
    id: "brandName",
    stage: "Fundamentos",
    title: "Etapa 1 · Fundamentos",
    question: "Qual é o nome da sua marca?",
    placeholder: "Ex.: Menos Mais Studio",
    mentorFeedback: "Ótimo, nomes são identidades.",
    type: "text",
  },
  {
    id: "brandOrigin",
    stage: "Fundamentos",
    title: "Etapa 1 · Fundamentos",
    question: "O que te motivou a criar essa marca?",
    placeholder: "Conte em poucas linhas o ponto de virada da sua jornada.",
    mentorFeedback: "Perfeito — propósito é a base da clareza.",
    type: "text",
  },
  {
    id: "brandVoice",
    stage: "Fundamentos",
    title: "Etapa 1 · Fundamentos",
    question: "Se sua marca fosse uma pessoa, como ela falaria?",
    placeholder: "Descreva rapidamente o tom de voz e vocabulário principal.",
    mentorFeedback: "Boa. O tom de voz define tudo.",
    microFeedback: "Excelente começo. Já conseguimos 30% de clareza sobre quem você é.",
    type: "text",
  },
  {
    id: "uniqueValue",
    stage: "Valor",
    title: "Etapa 2 · Valor",
    question: "O que sua marca entrega que outras não conseguem?",
    placeholder: "Quais diferenciais você já provou na prática?",
    mentorFeedback: "Aí está sua força.",
    type: "text",
  },
  {
    id: "idealCustomer",
    stage: "Valor",
    title: "Etapa 2 · Valor",
    question: "Quem é o cliente ideal para você?",
    placeholder: "Quais características tornam alguém perfeito para sua solução?",
    mentorFeedback: "Entendido — seu público é mais importante do que seu produto.",
    type: "text",
  },
  {
    id: "currentCustomer",
    stage: "Valor",
    title: "Etapa 2 · Valor",
    question: "Hoje, quem mais compra de você? (é o público ideal?)",
    placeholder: "Deixe exemplos reais: segmentos, cargos, regiões ou hábitos.",
    mentorFeedback: "Perfeito, isso mostra se sua mensagem está chegando nas pessoas certas.",
    microFeedback: "Ótimo. Agora temos 65% do mapa da sua marca definido.",
    type: "text",
  },
  {
    id: "desiredPerception",
    stage: "Direção",
    title: "Etapa 3 · Direção",
    question: "Como você gostaria que sua marca fosse percebida?",
    placeholder: "Liste adjetivos e sensações que seu público deve sentir.",
    mentorFeedback: "Excelente — essa é a bússola da sua identidade.",
    type: "text",
  },
  {
    id: "quarterGoals",
    stage: "Direção",
    title: "Etapa 3 · Direção",
    question: "Quais objetivos você quer alcançar nos próximos 3 meses?",
    placeholder: "Ex.: lançar um produto, criar conteúdo semanal, dobrar leads.",
    mentorFeedback: "Perfeito. Objetivos claros definem a estratégia que vamos montar.",
    type: "text",
  },
  {
    id: "instagramRef",
    stage: "Direção",
    title: "Etapa 3 · Direção",
    question: "Envie um print do Instagram da sua marca (upload ou pular).",
    placeholder: "",
    mentorFeedback: "Maravilha — isso vai ajudar nosso Designer e Copywriter.",
    type: "file",
  },
]
type ChatRole = "mentor" | "user" | "system"
type ChatTone = "intro" | "question" | "answer" | "feedback" | "summary" | "report" | "cta" | "progress"
type ChatEntry = {
  key: string
  role: ChatRole
  tone: ChatTone
  questionId?: MissionQuestion["id"]
  content: ReactNode
}
type RecognitionResultEvent = {
  results?: ArrayLike<ArrayLike<{ transcript?: string }>>
}
type RecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort?: () => void
  onresult: ((event: RecognitionResultEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: unknown) => void) | null
}
type RecognitionConstructor = new () => RecognitionInstance
type SpeechWindow = Window &
  Partial<{
    webkitSpeechRecognition: RecognitionConstructor
    SpeechRecognition: RecognitionConstructor
  }>
const INTRO_ENTRY: ChatEntry = {
  key: "intro",
  role: "mentor",
  tone: "intro",
  content: (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-sky-600">
        <Sparkles className="h-4 w-4" />
        Mentor-Raiz
      </div>
      <p className="text-base leading-relaxed text-slate-700">
        Bem-vindo à Missão Zero. Em menos de 7 minutos, vamos descobrir onde sua marca está hoje e preparar o plano com os agentes IA da Menos Mais.
      </p>
      <div className="space-y-2 rounded-2xl bg-sky-50/80 p-4 text-sm text-slate-700 ring-1 ring-sky-100">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-sky-500" />
          <span>Mensagem de marca clara</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-sky-500" />
          <span>Plano estratégico real</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-sky-500" />
          <span>Conteúdos prontos pra postar nos próximos dias</span>
        </div>
      </div>
      <p className="text-base font-medium text-slate-800">Topa começar agora?</p>
    </div>
  ),
}
const STAGE_ORDER = Array.from(new Set(QUESTIONS.map((question) => question.stage)))
const STAGE_DETAILS = STAGE_ORDER.map((stage) => ({
  stage,
  indices: QUESTIONS.reduce<number[]>((acc, question, index) => {
    if (question.stage === stage) {
      acc.push(index)
    }
    return acc
  }, []),
}))
const ENCOURAGEMENT_LEVELS = [
  { threshold: 25, message: "Ritmo ótimo. Vamos desbloquear a próxima peça do plano." },
  { threshold: 50, message: "Metade do caminho! Só mais um pouco para conectar as ideias." },
  { threshold: 75, message: "Estamos chegando lá. Segue firme com o Mentor-Raiz." },
  { threshold: 95, message: "Reta final: em instantes o relatório fica completo." },
]
function isStageComplete(statuses: boolean[], stage: string) {
  const detail = STAGE_DETAILS.find((item) => item.stage === stage)
  if (!detail) return false
  return detail.indices.every((index) => statuses[index])
}
function getStageStatus(
  statuses: boolean[],
  stage: string,
  activeIndex: number
): "complete" | "active" | "pending" {
  const detail = STAGE_DETAILS.find((item) => item.stage === stage)
  if (!detail) return "pending"
  const completed = detail.indices.every((index) => statuses[index])
  if (completed) return "complete"
  const inProgress =
    detail.indices.some((index) => statuses[index]) ||
    detail.indices.includes(activeIndex)
  return inProgress ? "active" : "pending"
}
function getEncouragement(percent: number) {
  const found = ENCOURAGEMENT_LEVELS.find((level) => percent < level.threshold)
  if (found) return found.message
  return "Só mais um pouquinho e chegaremos lá."
}
function getNextStage(stage: string) {
  const index = STAGE_ORDER.indexOf(stage)
  if (index === -1) return null
  return STAGE_ORDER[index + 1] ?? null
}
function buildProgressMessage({
  percent,
  stage,
  stageJustCompleted,
  customPrimary,
  isFinal,
}: {
  percent: number
  stage: string
  stageJustCompleted: boolean
  customPrimary?: string
  isFinal: boolean
}) {
  let primary =
    customPrimary ??
    (stageJustCompleted ? `Fechamos a etapa ${stage}.` : `Excelente ritmo: ${percent}% do diagnóstico pronto.`)
  if (isFinal) {
    return {
      primary,
      secondary: "Missão concluída! O Mentor-Raiz já está preparando a Missão 1.",
    }
  }
  if (stageJustCompleted) {
    const nextStage = getNextStage(stage)
    if (!customPrimary) {
      primary = `Fechamos a etapa ${stage}. ${percent}% do diagnóstico pronto.`
    }
    return {
      primary,
      secondary: nextStage ? `Agora mergulhamos em ${nextStage}.` : "Seguimos para o próximo passo.",
    }
  }
  return {
    primary,
    secondary: getEncouragement(percent),
  }
}
function MissionZeroChat() {
  const { answers, setAnswer, upload, setUpload, reset } = useMissionZero()
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>([INTRO_ENTRY])
  const [started, setStarted] = useState(false)
  const [flowCompleted, setFlowCompleted] = useState(false)
  const [stepIndex, setStepIndex] = useState<number>(-1)
  const [currentInput, setCurrentInput] = useState("")
  const [isLocked, setIsLocked] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [speechAvailable, setSpeechAvailable] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<RecognitionInstance | null>(null)
  const timeoutsRef = useRef<number[]>([])
  const totalQuestions = QUESTIONS.length
  const currentQuestion = useMemo(() => {
    if (!started || stepIndex < 0 || stepIndex >= totalQuestions) return null
    return QUESTIONS[stepIndex]
  }, [started, stepIndex, totalQuestions])
  const { questionStatuses, answeredCount } = useMemo(() => {
    const statuses = QUESTIONS.map((question) => {
      if (question.type === "file") {
        return Boolean(upload.file || upload.skipped)
      }
      return Boolean(answers[question.id]?.trim())
    })
    return {
      questionStatuses: statuses,
      answeredCount: statuses.filter(Boolean).length,
    }
  }, [answers, upload])
  const progressValue = flowCompleted ? 100 : Math.round((answeredCount / totalQuestions) * 100)
  const registerTimeout = (callback: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      callback()
      timeoutsRef.current = timeoutsRef.current.filter((storedId) => storedId !== id)
    }, delay)
    timeoutsRef.current.push(id)
    return id
  }
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id))
    timeoutsRef.current = []
  }
  const scrollToBottom = (instant = false) => {
    if (!endRef.current) return
    endRef.current.scrollIntoView({ behavior: instant ? "auto" : "smooth" })
  }
  const pushEntry = (entry: ChatEntry, options: { scrollInstant?: boolean } = {}) => {
    setChatEntries((prev) => [...prev, entry])
    registerTimeout(() => scrollToBottom(options.scrollInstant), 16)
  }
  const pushQuestion = (question: MissionQuestion) => {
    pushEntry({
      key: `${question.id}-question-${Date.now()}`,
      role: "mentor",
      tone: "question",
      questionId: question.id,
      content: (
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
            {question.title}
          </span>
          <p className="text-lg font-semibold text-slate-900">{question.question}</p>
          {question.type === "text" && (
            <p className="text-sm text-slate-500">
              Responda digitando ou use o microfone para registrar sua fala.
            </p>
          )}
          {question.type === "file" && (
            <p className="text-sm text-slate-500">
              Uma imagem recente ajuda o time criativo a alinhar estética e conteúdo.
            </p>
          )}
        </div>
      ),
    })
  }
  const queueProgressMessage = ({
    question,
    previousStatuses,
    nextStatuses,
    delay,
  }: {
    question: MissionQuestion
    previousStatuses: boolean[]
    nextStatuses: boolean[]
    delay: number
  }) => {
    const answeredTotal = nextStatuses.filter(Boolean).length
    const percent = Math.min(100, Math.round((answeredTotal / totalQuestions) * 100))
    const stageJustCompleted =
      !isStageComplete(previousStatuses, question.stage) && isStageComplete(nextStatuses, question.stage)
    const isFinal = answeredTotal >= totalQuestions
    const { primary, secondary } = buildProgressMessage({
      percent,
      stage: question.stage,
      stageJustCompleted,
      customPrimary: question.microFeedback,
      isFinal,
    })
    registerTimeout(
      () =>
        pushEntry({
          key: `${question.id}-progress-${Date.now()}`,
          role: "mentor",
          tone: "progress",
          questionId: question.id,
          content: (
            <div className="space-y-1 text-sm text-sky-800">
              <p className="font-semibold">{primary}</p>
              {secondary ? <p className="text-xs font-medium text-sky-600">{secondary}</p> : null}
            </div>
          ),
        }),
      delay
    )
  }
  const resetConversation = () => {
    clearAllTimeouts()
    recognitionRef.current?.abort?.()
    setChatEntries([INTRO_ENTRY])
    setStarted(false)
    setFlowCompleted(false)
    setStepIndex(-1)
    setCurrentInput("")
    setIsLocked(false)
    setIsRecording(false)
  }
  const handleStart = () => {
    reset()
    setUpload({})
    resetConversation()
    setStarted(true)
    setStepIndex(0)
    registerTimeout(() => pushQuestion(QUESTIONS[0]), 400)
  }
  const handleRestart = () => {
    reset()
    setUpload({})
    resetConversation()
  }
  const handleAdvance = () => {
    if (!currentQuestion) return
    const nextIndex = stepIndex + 1
    if (nextIndex >= totalQuestions) {
      setFlowCompleted(true)
      setStarted(false)
      setStepIndex(totalQuestions)
      const answerSnapshot = { ...answers }
      const uploadSnapshot = { ...upload }
      registerTimeout(
        () =>
          pushEntry({
            key: `summary-${Date.now()}`,
            role: "mentor",
            tone: "summary",
            content: <SummaryMessage />,
          }),
        450
      )
      registerTimeout(
        () =>
          pushEntry({
            key: `report-${Date.now()}`,
            role: "system",
            tone: "report",
            content: <SummaryReport answers={answerSnapshot} upload={uploadSnapshot} />,
          }),
        950
      )
      registerTimeout(
        () =>
          pushEntry({
            key: `cta-${Date.now()}`,
            role: "system",
            tone: "cta",
            content: <SummaryCTA onRestart={handleRestart} />,
          }),
        1350
      )
      registerTimeout(() => setIsLocked(false), 1400)
      return
    }
    setStepIndex(nextIndex)
    registerTimeout(() => pushQuestion(QUESTIONS[nextIndex]), 480)
    registerTimeout(() => setIsLocked(false), 520)
  }
  const handleTextSubmit = () => {
    if (!currentQuestion || currentQuestion.type !== "text") return
    const trimmed = currentInput.trim()
    if (!trimmed || isLocked) return
    setIsLocked(true)
    setAnswer(currentQuestion.id, trimmed)
    setCurrentInput("")
    pushEntry({
      key: `${currentQuestion.id}-answer-${Date.now()}`,
      role: "user",
      tone: "answer",
      questionId: currentQuestion.id,
      content: (
        <p className="text-base leading-relaxed text-white">
          {trimmed}
        </p>
      ),
    })
    registerTimeout(
      () =>
        pushEntry({
          key: `${currentQuestion.id}-feedback-${Date.now()}`,
          role: "mentor",
          tone: "feedback",
          questionId: currentQuestion.id,
          content: <p className="text-base text-slate-700">{currentQuestion.mentorFeedback}</p>,
        }),
      520
    )
    const questionIndex = stepIndex
    const previousStatuses = questionStatuses.slice()
    const nextStatuses = questionStatuses.map((status, index) =>
      index === questionIndex ? true : status
    )
    const progressDelay = currentQuestion.microFeedback ? 1100 : 950
    queueProgressMessage({
      question: currentQuestion,
      previousStatuses,
      nextStatuses,
      delay: progressDelay,
    })
    const advanceDelay = progressDelay + 720
    registerTimeout(handleAdvance, advanceDelay)
  }
  const handleFileSubmit = () => {
    if (!currentQuestion || currentQuestion.type !== "file" || isLocked) return
    if (!upload.file) return
    setIsLocked(true)
    pushEntry({
      key: `${currentQuestion.id}-file-${Date.now()}`,
      role: "user",
      tone: "answer",
      questionId: currentQuestion.id,
      content: (
        <div className="space-y-2 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
            <ImageIcon className="h-3.5 w-3.5" />
            Print enviado
          </div>
          {upload.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={upload.previewUrl}
              alt="Pré-visualização do Instagram"
            />
          ) : (
            <p className="text-sm opacity-80">Arquivo recebido: {upload.file.name}</p>
          )}
        </div>
      ),
    })
    registerTimeout(
      () =>
        pushEntry({
          key: `${currentQuestion.id}-feedback-${Date.now()}`,
          role: "mentor",
          tone: "feedback",
          questionId: currentQuestion.id,
          content: <p className="text-base text-slate-700">{currentQuestion.mentorFeedback}</p>,
        }),
      520
    )
    const questionIndex = stepIndex
    const previousStatuses = questionStatuses.slice()
    const nextStatuses = questionStatuses.map((status, index) =>
      index === questionIndex ? true : status
    )
    const progressDelay = 1050
    queueProgressMessage({
      question: currentQuestion,
      previousStatuses,
      nextStatuses,
      delay: progressDelay,
    })
    registerTimeout(handleAdvance, progressDelay + 650)
  }
  const handleSkipUpload = () => {
    if (!currentQuestion || currentQuestion.type !== "file" || isLocked) return
    setIsLocked(true)
    setUpload({ file: null, previewUrl: undefined, skipped: true })
    pushEntry({
      key: `${currentQuestion.id}-skip-${Date.now()}`,
      role: "user",
      tone: "answer",
      questionId: currentQuestion.id,
      content: (
        <p className="text-base leading-relaxed text-white">
          Prefiro enviar esse print depois.
        </p>
      ),
    })
    registerTimeout(
      () =>
        pushEntry({
          key: `${currentQuestion.id}-feedback-${Date.now()}`,
          role: "mentor",
          tone: "feedback",
          questionId: currentQuestion.id,
          content: <p className="text-base text-slate-700">{currentQuestion.mentorFeedback}</p>,
        }),
      520
    )
    const questionIndex = stepIndex
    const previousStatuses = questionStatuses.slice()
    const nextStatuses = questionStatuses.map((status, index) =>
      index === questionIndex ? true : status
    )
    const progressDelay = 1050
    queueProgressMessage({
      question: currentQuestion,
      previousStatuses,
      nextStatuses,
      delay: progressDelay,
    })
    registerTimeout(handleAdvance, progressDelay + 650)
  }
  const handleUploadChange = (fileList: FileList | null) => {
    const file = fileList?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const previewUrl = typeof event.target?.result === "string" ? event.target.result : undefined
      setUpload({
        file,
        previewUrl,
        skipped: false,
      })
    }
    reader.readAsDataURL(file)
  }
  const toggleRecording = () => {
    if (!recognitionRef.current || !speechAvailable || isLocked) return
    if (isRecording) {
      recognitionRef.current.stop()
      return
    }
    try {
      setIsRecording(true)
      recognitionRef.current.start()
    } catch (error) {
      console.warn("Speech recognition failed to start", error)
      setIsRecording(false)
    }
  }
  useEffect(() => {
    return () => {
      clearAllTimeouts()
    }
  }, [])
  useEffect(() => {
    if (!currentQuestion) {
      setCurrentInput("")
      return
    }
    if (currentQuestion.type === "text") {
      setCurrentInput("")
    }
  }, [currentQuestion?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (typeof window === "undefined") return
    const speechWindow = window as SpeechWindow
    const SpeechRecognitionConstructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!SpeechRecognitionConstructor) {
      setSpeechAvailable(false)
      return
    }
    const recognition = new SpeechRecognitionConstructor()
    recognition.lang = "pt-BR"
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event: RecognitionResultEvent) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? ""
      if (!transcript.trim()) return
      setCurrentInput((prev) => {
        const combined = prev ? `${prev} ${transcript}` : transcript
        return combined.trim()
      })
    }
    recognition.onend = () => setIsRecording(false)
    recognition.onerror = () => setIsRecording(false)
    recognitionRef.current = recognition
    setSpeechAvailable(true)
    return () => {
      recognition.onresult = null
      recognition.onend = null
      recognition.onerror = null
      recognitionRef.current = null
    }
  }, [])
  useEffect(() => {
    scrollToBottom(true)
  }, [])
  const renderInputArea = () => {
    if (flowCompleted) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white/80 px-6 py-5 text-center text-sm text-slate-500">
          Diagnóstico concluído. Explore o plano sugerido acima ou reinicie quando quiser.
        </div>
      )
    }
    if (!started) {
      return (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 px-6 py-8 text-center">
          <p className="text-base text-slate-600">
            Em cada etapa, você responde e o Mentor-Raiz devolve o próximo passo com feedback em tempo real.
          </p>
          <Button
            type="button"
            className="h-12 rounded-full bg-[#A980FF] px-6 text-base font-semibold text-white shadow-lg hover:bg-[#9570ff]"
            onClick={handleStart}
          >
            Começar Missão Zero
          </Button>
        </div>
      )
    }
    if (!currentQuestion) {
      return null
    }
    if (currentQuestion.type === "file") {
      return (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6">
          <label
            htmlFor="mission-zero-upload"
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/50 p-6 text-center transition hover:border-sky-300 hover:bg-sky-50"
          >
            <Upload className="h-8 w-8 text-sky-500" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-700">Arraste ou clique para enviar um print</p>
              <p className="text-xs text-slate-500">Aceita JPG, PNG ou WEBP até 5 MB</p>
            </div>
            <input
              id="mission-zero-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleUploadChange(event.target.files)}
            />
          </label>
          {upload.previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={upload.previewUrl} alt="Pré-visualização do Instagram" />
          )}
          {upload.file && (
            <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
              Arquivo selecionado: <span className="font-medium text-slate-800">{upload.file.name}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              className="border-slate-300 text-slate-600 hover:bg-slate-100"
              onClick={handleSkipUpload}
              disabled={isLocked}
            >
              Pular por enquanto
            </Button>
            <Button
              type="button"
              className="bg-[#A980FF] px-6 py-2 text-base font-semibold text-white shadow-md hover:bg-[#9570ff]"
              onClick={handleFileSubmit}
              disabled={isLocked || !upload.file}
            >
              Enviar para o Mentor
            </Button>
          </div>
        </div>
      )
    }
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6">
        <div className="relative">
          <textarea
            value={currentInput}
            onChange={(event) => setCurrentInput(event.target.value)}
            placeholder={currentQuestion.placeholder}
            className="min-h-[180px] w-full resize-none rounded-2xl border border-sky-100 bg-white px-4 py-4 text-base text-slate-800 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200 disabled:opacity-60"
            maxLength={1200}
            disabled={isLocked}
          />
          <Button
            type="button"
            size="icon"
            onClick={toggleRecording}
            disabled={!speechAvailable || isLocked}
            className={`absolute bottom-5 right-5 h-12 w-12 rounded-full border-none shadow-lg transition ${
              isRecording ? "bg-[#ff6fb7] hover:bg-[#ff5ea9]" : "bg-[#A980FF] hover:bg-[#9570ff]"
            } ${!speechAvailable ? "opacity-60" : ""}`}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>Use o microfone para capturar seu raciocínio em segundos.</span>
          <Button
            type="button"
            className="bg-[#A980FF] px-6 py-2 text-base font-semibold text-white shadow-md hover:bg-[#9570ff]"
            onClick={handleTextSubmit}
            disabled={isLocked || !currentInput.trim()}
          >
            Enviar resposta
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#E7F1FF] via-[#F6F8FF] to-white px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(132,205,255,0.22)_0%,_rgba(255,255,255,0)_60%)]" />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-base font-semibold text-white shadow-lg">
              MR
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Missão Zero · Diagnóstico de Marca</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">
              {flowCompleted ? "100% concluído" : `${answeredCount}/${totalQuestions} etapas completas`}
            </span>
            <Button variant="ghost" className="text-sm text-slate-500 hover:text-slate-700" onClick={handleRestart}>
              Recomeçar
            </Button>
          </div>
        </div>
        <Progress value={progressValue} className="h-3 overflow-hidden rounded-full bg-slate-200" />
        <div
          ref={chatContainerRef}
          className="relative flex min-h-[520px] flex-col gap-4 rounded-3xl border border-slate-200 bg-white/70 p-6 backdrop-blur"
        >
          <div className="flex-1 space-y-5 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {chatEntries.map((entry) => (
                <motion.div
                  key={entry.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex flex-col"
                >
                  <ChatBubble role={entry.role} tone={entry.tone}>
                    {entry.content}
                  </ChatBubble>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={endRef} />
          </div>
          <div className="space-y-4">
            <StageProgress
              progress={progressValue}
              questionStatuses={questionStatuses}
              currentStage={currentQuestion?.stage ?? null}
              currentIndex={stepIndex}
              started={started}
              flowCompleted={flowCompleted}
            />
            {renderInputArea()}
          </div>
        </div>
      </div>
    </div>
  )
}
function StageProgress({
  progress,
  questionStatuses,
  currentStage,
  currentIndex,
  started,
  flowCompleted,
}: {
  progress: number
  questionStatuses: boolean[]
  currentStage: string | null
  currentIndex: number
  started: boolean
  flowCompleted: boolean
}) {
  const displayProgress = flowCompleted ? 100 : progress
  const stageMeta = STAGE_DETAILS.map((detail) => {
    const lastIndex = detail.indices[detail.indices.length - 1] ?? 0
    const markerPosition = ((lastIndex + 1) / QUESTIONS.length) * 100
    const status = flowCompleted
      ? "complete"
      : getStageStatus(questionStatuses, detail.stage, started ? currentIndex : -1)
    return {
      ...detail,
      markerPosition,
      status,
    }
  })
  return (
    <div className="rounded-2xl border border-sky-100 bg-white/85 p-5 shadow-inner">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <span>Progresso</span>
        <span>{Math.min(100, Math.max(0, Math.round(displayProgress)))}%</span>
      </div>
      <div className="relative mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <motion.div
          initial={false}
          animate={{ width: `${Math.min(100, Math.max(0, displayProgress))}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600"
        />
        {stageMeta.map((stage) => {
          const dotClass =
            stage.status === "complete"
              ? "bg-gradient-to-br from-sky-500 to-blue-600 border-transparent shadow-md shadow-sky-300/40"
              : stage.status === "active"
                ? "bg-white border-2 border-sky-500 shadow-md shadow-sky-200/60"
                : "bg-white border-2 border-slate-300"
          return (
            <div
              key={stage.stage}
              className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full"
              style={{ left: `calc(${stage.markerPosition}% - 8px)` }}
            >
              <div className={`h-full w-full rounded-full ${dotClass}`} />
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-500">
        {stageMeta.map((stage) => {
          const isActive = stage.status === "active" || (stage.stage === currentStage && started)
          const isComplete = stage.status === "complete"
          const labelClass = isComplete
            ? "text-sky-600"
            : isActive
              ? "text-sky-700"
              : "text-slate-400"
          return (
            <span key={stage.stage} className={`uppercase tracking-[0.08em] ${labelClass}`}>
              {stage.stage}
            </span>
          )
        })}
      </div>
    </div>
  )
}
function ChatBubble({ role, tone, children }: { role: ChatRole; tone: ChatTone; children: ReactNode }) {
  const alignment =
    role === "mentor" ? "justify-start" : role === "user" ? "justify-end" : "justify-center"
  let bubbleClass: string
  if (role === "mentor") {
    bubbleClass =
      tone === "progress"
        ? "rounded-3xl rounded-bl-md border border-sky-100 bg-gradient-to-r from-sky-100 via-white to-sky-100 text-sky-800 shadow-lg"
        : "rounded-3xl rounded-bl-md border border-sky-100 bg-white/95 shadow-sm text-slate-700"
  } else if (role === "user") {
    bubbleClass = "rounded-3xl rounded-tr-md bg-[#A980FF] text-white shadow-lg"
  } else {
    bubbleClass =
      tone === "cta" || tone === "progress"
        ? "rounded-3xl bg-gradient-to-r from-sky-100 via-indigo-100 to-sky-100 text-slate-700 shadow-inner"
        : "rounded-3xl bg-sky-50/80 text-sky-800 shadow-inner"
  }
  return (
    <div className={`flex w-full ${alignment}`}>
      {role === "mentor" && (
        <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-semibold text-white shadow-md">
          MR
        </div>
      )}
      <div className={`max-w-[82%] px-5 py-4 ${bubbleClass}`}>
        {children}
      </div>
    </div>
  )
}
function SummaryMessage() {
  return (
    <div className="space-y-4 text-slate-800">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          ✨
        </span>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Mentor-Raiz</p>
          <p className="text-lg font-semibold text-slate-900">Excelente trabalho! ✨</p>
          <p className="text-base leading-relaxed">Você concluiu a Missão Zero com clareza.</p>
          <p className="text-base leading-relaxed">Com base nas suas respostas, já criei o mapa inicial da sua marca.</p>
        </div>
      </div>
    </div>
  )
}
function SummaryReport({
  answers: _answers,
  upload: _upload,
}: {
  answers: Record<string, string | undefined>
  upload: { file?: File | null; previewUrl?: string | null; skipped?: boolean }
}) {
  return (
    <div className="space-y-5 rounded-3xl border border-sky-100 bg-white/90 p-5 shadow-sm">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">🧭 Seu panorama</p>
        <div className="grid gap-3 text-slate-700 md:grid-cols-3">
          {[
            { label: "Clareza de mensagem", value: "62%" },
            { label: "Coerência visual", value: "48%" },
            { label: "Consistência estratégica", value: "54%" },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm shadow-sm"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
              <p className="text-2xl font-semibold text-slate-900">{metric.value}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-600">Esses números mostram que sua marca tem uma base muito boa, mas precisa de ajustes pra crescer com força.</p>
      </div>
      <div className="space-y-2 text-base leading-relaxed text-slate-700">
        <p>
          Agora é o momento de avançar pra Missão 1: Estratégia da Marca. Nela, o Estrategista de Marca vai te guiar pra:
        </p>
        <ul className="space-y-1 pl-5 text-sm">
          <li className="list-disc">definir sua proposta de valor,</li>
          <li className="list-disc">alinhar público e diferencial,</li>
          <li className="list-disc">e criar o plano estratégico real da sua marca.</li>
        </ul>
      </div>
      <p className="text-sm text-slate-600">
        Antes de te apresentar ao time, preciso liberar o acesso à sua próxima missão. Você pode escolher entre dois caminhos ✨
      </p>
    </div>
  )
}
function SummaryCTA({ onRestart }: { onRestart: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()
  type PlanOption = {
    id: string
    title: string
    subtitle: string
    price: string
    priceNote: string
    features: string[]
    checkoutUrl: string
    liberacao: string
    buttonLabel: string
    badge?: string
  }
  const planOptions: PlanOption[] = [
    {
      id: "missao-1-individual",
      title: "Caminho 1 – Missão 1 Individual",
      subtitle: "Perfeito se você quer validar o método com foco total na Estratégia.",
      price: "R$97",
      priceNote: "Pagamento único. Liberação da Missão 1 após confirmação.",
      features: [
        "Acesso completo à Missão 1 – Estratégia da Marca",
        "Guia passo a passo com o Estrategista de Marca",
        "Mapeamento de proposta de valor e público ideal",
        "Plano estratégico inicial e próximos passos priorizados",
      ],
      checkoutUrl: "https://mpago.la/1JHa5ZN",
      liberacao: "missao_1",
      buttonLabel: "Liberar Missão 1",
    },
    {
      id: "jornada-completa",
      title: "Caminho 2 – Jornada Completa (5 Missões)",
      subtitle: "Para quem quer todo o time IA acompanhando a execução.",
      price: "R$297",
      priceNote: "Pagamento único. Economia de 40% vs desbloqueios individuais.",
      features: [
        "Tudo da Missão 1 liberado imediatamente",
        "Missões 2 a 5 com Copywriter, Designer, Social Media e Analista",
        "Entrega da mensagem, identidade visual e kit de conteúdos prontos",
        "Suporte dos agentes IA para implementar semana a semana",
      ],
      checkoutUrl: "https://mpago.la/2Yq4Nun",
      liberacao: "jornada_completa",
      buttonLabel: "Liberar Jornada Completa",
      badge: "Mais escolhido",
    },
  ]
  const resolveIdUnico = (): string | null => {
    if (typeof window === "undefined") return null
    try {
      const authId = AuthManager.getIdUnico?.()
      if (authId) return authId
    } catch (error) {
      console.warn("AuthManager.getIdUnico falhou:", error)
    }
    try {
      const storedId = window.localStorage?.getItem("brandplot_idUnico")
      if (storedId) return storedId
    } catch (error) {
      console.warn("Leitura direta do localStorage falhou:", error)
    }
    try {
      return BrandplotCache.getIdUnico()
    } catch (error) {
      console.warn("BrandplotCache.getIdUnico falhou:", error)
      return null
    }
  }
  const persistSelection = async (plan: PlanOption): Promise<boolean> => {
    const idUnico = resolveIdUnico()
    if (!idUnico) return false
    try {
      const response = await fetch("/api/brand-data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idUnico,
          planoSelecionado: plan.id,
          missaoLiberada: plan.liberacao,
          onboardingMetadata: {
            planoSelecionadoEm: new Date().toISOString(),
            caminho: plan.id,
          },
        }),
      })
      return response.ok
    } catch (error) {
      console.error("Erro ao registrar plano:", error)
      return false
    }
  }
  const createCheckoutPreference = async (plan: PlanOption): Promise<string | null> => {
    const idUnico = resolveIdUnico()
    if (!idUnico) return null
    try {
      const response = await fetch("/api/mercadopago/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idUnico,
          product: plan.liberacao,
          planId: plan.id,
          returnPath: "/dashboard",
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || "Falha ao gerar checkout no Mercado Pago")
      }

      const json = (await response.json()) as { init_point?: string | null; sandbox_init_point?: string | null }
      return json.sandbox_init_point ?? json.init_point ?? null
    } catch (error) {
      console.error("Erro ao abrir checkout do Mercado Pago:", error)
      return null
    }
  }
  const handlePlanSelect = async (plan: PlanOption) => {
    if (isSaving) return
    setSelectedPlan(plan.id)
    setStatusMessage(null)
    setErrorMessage(null)
    let saved = false
    let checkoutUrl: string | null = null
    try {
      setIsSaving(true)
      saved = await persistSelection(plan)
      checkoutUrl = await createCheckoutPreference(plan)
      if (saved) {
        setStatusMessage("Plano registrado. Assim que o pagamento confirmar, a missão correspondente será liberada automaticamente.")
        router.push("/dashboard")
      } else {
        setErrorMessage("Não consegui registrar agora, mas você pode seguir com o desbloqueio normalmente.")
      }
    } catch (error) {
      console.error("Erro ao processar seleção de plano:", error)
      setErrorMessage("O registro automático falhou. Finalize o desbloqueio e nos avise pelo suporte, combinado?")
    } finally {
      setIsSaving(false)
      const fallbackUrl = plan.checkoutUrl
      const urlToOpen = checkoutUrl ?? fallbackUrl
      if (urlToOpen) {
        try {
          window.open(urlToOpen, "_blank", "noopener")
        } catch (openError) {
          console.warn("Não foi possível abrir a página de checkout automaticamente:", openError)
        }
      }
    }
  }
  return (
    <div className="space-y-6 rounded-3xl border border-sky-100 bg-white/95 p-6 shadow-inner">
      <div className="grid gap-5 md:grid-cols-2">
        {planOptions.map((plan) => {
          const isActive = selectedPlan === plan.id
          return (
            <div
              key={plan.id}
              className={`relative flex h-full flex-col justify-between rounded-3xl border bg-white px-6 py-7 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl ${isActive ? "border-[#A980FF] shadow-lg shadow-[#A980FF]/30 ring-2 ring-[#A980FF]/40" : "border-slate-200/70"}`}
            >
              {plan.badge ? (
                <span className="absolute right-6 top-6 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 shadow-sm">
                  {plan.badge}
                </span>
              ) : null}
              <div className="space-y-5">
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-slate-900">{plan.title}</h4>
                  <p className="text-sm text-slate-500">{plan.subtitle}</p>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-slate-900">{plan.price}</div>
                  <p className="text-xs font-medium text-slate-500">{plan.priceNote}</p>
                </div>
                <div className="space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                type="button"
                className={`mt-6 h-11 rounded-full px-4 text-base font-semibold !text-white shadow-md transition ${isActive ? "bg-[#7c5cff] hover:bg-[#6c4aff]" : "bg-slate-900 hover:bg-slate-800"}`}
                onClick={() => handlePlanSelect(plan)}
                disabled={isSaving && selectedPlan !== plan.id}
              >
                {isSaving && selectedPlan === plan.id ? "Liberando..." : plan.buttonLabel}
              </Button>
            </div>
          )
        })}
      </div>
      {statusMessage ? (
        <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-sky-700">
          {statusMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}
      <div className="flex flex-col items-center gap-3 pt-2">
        <p className="text-xs text-slate-500">
          Assim que o pagamento for confirmado, liberamos automaticamente o acesso à missão escolhida.
        </p>
        <Button
          type="button"
          variant="ghost"
          className="text-sm text-slate-500 hover:text-slate-700"
          onClick={onRestart}
        >
          Refazer diagnóstico
        </Button>
      </div>
    </div>
  )
}
function OnboardingPageInner() {
  return <MissionZeroChat />
}
export default function OnboardingPage() {
  return (
    <MissionZeroProvider>
      <OnboardingPageInner />
    </MissionZeroProvider>
  )
}
