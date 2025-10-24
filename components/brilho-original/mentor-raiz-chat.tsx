"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Bot, Loader2, Send, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

type ChatRole = "user" | "assistant"

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  semanticSearchUsed?: boolean
  webSearchUsed?: boolean
}

interface MentorMissionSummary {
  key: string
  title: string
  description: string
}

interface MentorRaizChatProps {
  companyName?: string | null
  className?: string
  completedMissions?: MentorMissionSummary[]
  nextMission?: MentorMissionSummary | null
}

export function MentorRaizChat({
  companyName,
  className,
  completedMissions,
  nextMission,
}: MentorRaizChatProps) {
  const completedSummaries = useMemo<MentorMissionSummary[]>(
    () => (completedMissions ?? []).filter((mission) => Boolean(mission?.key)),
    [completedMissions],
  )
  const nextMissionDetails = useMemo<MentorMissionSummary | null>(
    () => nextMission ?? null,
    [nextMission],
  )
  const hasCompletedAllMissions = useMemo(
    () => completedSummaries.some((mission) => mission.key === "missao_5"),
    [completedSummaries],
  )

  const resolvedCompanyName = useMemo(() => {
    const trimmed = companyName?.trim()
    return trimmed && trimmed.length > 0 ? trimmed : "Sua Marca"
  }, [companyName])

  const introMessage = useMemo(() => {
    const completedTitles = completedSummaries.length
      ? completedSummaries.map((mission) => mission.title).join(", ")
      : "nenhuma missao concluida ainda"

    if (hasCompletedAllMissions) {
      return [
        "Oi! Eu sou o Mentor-Raiz.",
        "Parabens por concluir as cinco missoes da clareza. A partir de agora podemos revisar resultados, consolidar aprendizados e manter o nivel alto.",
        `Missoes concluidas: ${completedTitles}.`,
        "Me conta o que voce quer revisar e eu direciono os ajustes finos.",
      ].join(" ")
    }

    const nextMissionSentence = nextMissionDetails
      ? `Proxima missao prioritaria: ${nextMissionDetails.title}.`
      : "Assim que a proxima missao for liberada eu te aviso."

    return [
      "Oi! Eu sou o Mentor-Raiz e vou responder apenas com base no que ja conquistamos nas missoes.",
      `Missoes concluidas ate agora: ${completedTitles}.`,
      nextMissionSentence,
      "Qual duvida voce quer esclarecer para seguir evoluindo?",
    ].join(" ")
  }, [completedSummaries, hasCompletedAllMissions, nextMissionDetails])

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: "mentor-intro", role: "assistant", content: introMessage },
  ])
  const [pendingInput, setPendingInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages((previous) => {
      if (previous.length === 1 && previous[0]?.id === "mentor-intro" && previous[0].content !== introMessage) {
        return [{ ...previous[0], content: introMessage }]
      }
      return previous
    })
  }, [introMessage])

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isSending])

  const buildPromptWithHistory = (userQuestion: string) => {
    const missionGuardrail = hasCompletedAllMissions
      ? [
          "Contexto: todas as missoes (1 a 5) ja foram concluidas.",
          "Atue como Mentor-Raiz analisando resultados, celebrando conquistas e sugerindo refinamentos praticos sem sair dos dados reais coletados nas missoes.",
        ].join(" ")
      : [
          "Contexto: ainda existem missoes pendentes.",
          "Voce DEVE responder somente sobre o progresso das missoes ja concluidas e os dados concretos coletados nelas. Se a pergunta sair desse escopo, redirecione a conversa para os aprendizados obtidos e convide a pessoa a seguir para a proxima missao.",
        ].join(" ")

    const completedList = completedSummaries.length
      ? completedSummaries
          .map(
            (mission) =>
              `- ${mission.title}: ${mission.description || "descricao nao informada"}. Resuma o que esta missao comprovou.`,
          )
          .join("\n")
      : "- Nenhuma missao concluida ate agora. Explique porque a Missao 1 e o primeiro passo e convide a iniciar imediatamente."

    const nextMissionReminder = hasCompletedAllMissions
      ? "Todas as missoes estao completas. Reforce a importancia de revisitar os resultados periodicamente e sugerir consolidacao de marca."
      : nextMissionDetails
        ? `Proxima missao obrigatoria: ${nextMissionDetails.title}. Foco desta missao: ${nextMissionDetails.description || "descricao nao informada"}. SEMPRE finalize a resposta orientando a pessoa a executar essa missao imediatamente.`
        : "A proxima missao ainda nao esta definida. Oriente o cliente a aguardar liberacao e manter os habitos das missoes ja concluidas."

    const historyMessages = messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .slice(-6)

    const historySection = historyMessages.length
      ? [
          "Historico recente entre empreendedor(a) e Mentor-Raiz:",
          historyMessages
            .map((message) =>
              message.role === "user"
                ? `Empreendedor(a): ${message.content}`
                : `Mentor-Raiz: ${message.content}`,
            )
            .join("\n"),
        ].join("\n")
      : ""

    const promptSections = [
      `Empresa: ${resolvedCompanyName}`,
      missionGuardrail,
      "Missoes concluidas:",
      completedList,
      nextMissionReminder,
      "Regras adicionais:",
      "- Responda sempre em portugues brasileiro.",
      "- Preserve o tom consultivo e direto do Mentor-Raiz.",
      "- Nao invente fatos fora dos dados das missoes.",
      "- Se a pergunta nao for sobre missoes, explique gentilmente que agora o foco e o acompanhamento das missoes e redirecione para o proximo passo.",
    ]

    if (historySection) {
      promptSections.push(historySection)
    }

    promptSections.push(
      `Pergunta atual do empreendedor(a): ${userQuestion}`,
      "Produza uma resposta clara, com poucos paragrafos, referenciando explicitamente os aprendizados das missoes concluidas e indicando a proxima missao a ser executada.",
    )

    return promptSections.join("\n\n")
  }

  const sendMessage = async () => {
    const trimmed = pendingInput.trim()
    if (!trimmed || isSending) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    }

    setMessages((previous) => [...previous, userMessage])
    setPendingInput("")
    setErrorMessage(null)
    setIsSending(true)

    try {
      const prompt = buildPromptWithHistory(trimmed)

      const response = await fetch("/api/voice/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
          companyName: resolvedCompanyName,
          mode: "text",
          webSearchEnabled: false,
          contextEnhancedEnabled: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`Falha ao conectar com o Mentor-Raiz (${response.status})`)
      }

      const payload = await response.json()

      if (!payload?.success) {
        throw new Error(payload?.error ?? "Nao foi possivel obter resposta agora.")
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: typeof payload.response === "string" ? payload.response : payload.text ?? "",
        semanticSearchUsed: Boolean(payload.semanticSearchUsed),
        webSearchUsed: Boolean(payload.webSearchUsed),
      }

      setMessages((previous) => [...previous, assistantMessage])
    } catch (error) {
      console.error("[MentorRaizChat] Erro ao enviar mensagem:", error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Algo deu errado ao falar com o Mentor-Raiz. Tente novamente em instantes.",
      )

      setMessages((previous) => [
        ...previous,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            "Ainda nao consegui falar com a central, mas e so tentar novamente e eu continuo por aqui com voce.",
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage()
  }

  const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border border-[#efe9ff] bg-[#f9f6ff] p-5 shadow-[0_18px_45px_rgba(158,124,242,0.12)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0e8ff] text-[#7c5cf3]">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9e7cf2]">
              Mentor-Raiz ao vivo
            </p>
            <p className="text-sm text-[#4c4b6a]">
              Tire duvidas especificas sobre suas missoes concluidas e o proximo passo
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-[#e9e2ff] bg-white/60 px-3 py-1 text-xs font-medium text-[#6f5bf5] shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          OpenAI
        </span>
      </div>

      <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex w-full", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                message.role === "user"
                  ? "rounded-br-md bg-[#5f4bff] text-white shadow-[0_10px_24px_rgba(95,75,255,0.25)]"
                  : "rounded-bl-md border border-[#ece4ff] bg-white text-[#3b3b54] shadow-[0_20px_45px_rgba(133,106,255,0.08)]",
              )}
            >
              <span className="whitespace-pre-wrap">{message.content}</span>

              {message.role === "assistant" && (message.semanticSearchUsed || message.webSearchUsed) && (
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8c82cf]">
                  {message.semanticSearchUsed ? (
                    <span className="rounded-full bg-[#f4f0ff] px-2.5 py-1">Diagnostico</span>
                  ) : null}
                  {message.webSearchUsed ? (
                    <span className="rounded-full bg-[#f4f0ff] px-2.5 py-1">Busca web</span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ))}
        {isSending ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-[#ece4ff] bg-white px-3 py-2 text-xs text-[#6f6a9b] shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Mentor-Raiz esta escrevendo
            </div>
          </div>
        ) : null}
        <div ref={endOfMessagesRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 border-t border-[#ebe5ff] pt-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <textarea
              value={pendingInput}
              onChange={(event) => setPendingInput(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Fale sobre o aprendizado atual e pergunte como destravar a proxima missao"
              rows={2}
              className="min-h-[60px] w-full resize-none rounded-2xl border border-[#e3ddff] bg-white px-4 py-3 text-sm text-[#373754] placeholder:text-[#9d9ac2] focus:border-[#7c64ff] focus:outline-none focus:ring-2 focus:ring-[#dcd4ff]"
            />
          </div>
          <button
            type="submit"
            disabled={!pendingInput.trim() || isSending}
            className={cn(
              "flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-[#5f4bff] text-white shadow-[0_18px_40px_rgba(95,75,255,0.35)] transition",
              (!pendingInput.trim() || isSending) && "opacity-60",
            )}
            aria-label="Enviar mensagem para o Mentor-Raiz"
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
        {errorMessage ? (
          <p className="mt-2 text-xs font-medium text-[#a8575f]">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </div>
  )
}
