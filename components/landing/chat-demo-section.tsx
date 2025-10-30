"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

type Message = {
  id: number
  text: string
  isUser: boolean
}

const demoConversation: Array<Omit<Message, "id">> = [
  { text: "Oi! Vamos encontrar os pontos que seguram o crescimento da sua marca?", isUser: false },
  { text: "Vamos! Quero entender onde a mensagem está desalinhada.", isUser: true },
  { text: "Perfeito. Primeiro, me conte qual promessa da sua marca precisa ganhar clareza agora.", isUser: false },
  { text: "Oferecemos uma plataforma de gestão de comunidades, mas os leads ainda confundem com consultoria.", isUser: true },
  {
    text: "Entendi. Vou analisar o seu posicionamento, proposta de valor e experiência atual para sugerir ajustes. Em minutos você recebe um plano priorizado com mensagens prontas.",
    isUser: false,
  },
]

export function ChatDemoSection() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < demoConversation.length) {
        setIsTyping(true)
        const { text, isUser } = demoConversation[currentIndex]

        setTimeout(() => {
          setMessages((prev) => [...prev, { id: currentIndex, text, isUser }])
          setIsTyping(false)
          currentIndex += 1
        }, 700)
      } else {
        clearInterval(interval)
      }
    }, 1900)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="bg-slate-900/10 py-24 text-slate-900">
      <div className="container mx-auto grid max-w-6xl items-center gap-14 px-4 lg:grid-cols-2 lg:px-8">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Mentoor LIVE
          </span>
          <h2 className="text-balance text-3xl font-semibold text-slate-900 sm:text-4xl">
            Converse com a IA do Mentoor e saia com um plano que faz sentido para o seu momento.
          </h2>
          <p className="text-base leading-relaxed text-slate-600">
            Você responde às perguntas certas, a IA cruza com nossa base estratégica e devolve um diagnóstico com as
            prioridades dos próximos 90 dias. Tudo acompanhado de mensagens prontas, argumentos e playbooks.
          </p>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 text-base text-sky-500">bolt</span>
              Diagnóstico personalizado em tempo real, sem planilhas complexas.
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 text-base text-sky-500">translate</span>
              Mensagens adaptadas a cada canal – landing, proposta, e-mails e social.
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 text-base text-sky-500">flag</span>
              Plano de execução que cabe no seu calendário e mostra o impacto esperado.
            </li>
          </ul>

          <Button
            size="lg"
            className="mt-6 h-12 rounded-full bg-slate-900 px-8 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(15,23,42,0.18)] hover:bg-slate-800"
            asChild
          >
            <Link href="/onboarding">
              Iniciar diagnóstico agora
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </Button>
        </div>

        <div className="relative">
          <div className="absolute -left-10 top-10 h-48 w-48 rounded-full bg-sky-400/40 blur-3xl" />
          <div className="absolute -right-10 bottom-10 h-48 w-48 rounded-full bg-blue-400/30 blur-3xl" />

          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_25px_70px_rgba(15,23,42,0.12)]">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4 text-slate-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
                <Image src="/images/mentoor-mark.svg" alt="Mentoor" width={24} height={24} className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Mentoor</p>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Online agora
                </span>
              </div>
            </div>

            <div className="h-[420px] space-y-4 overflow-hidden px-6 py-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    message.isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.isUser
                        ? "rounded-br-sm bg-sky-500 text-white shadow"
                        : "rounded-bl-sm bg-slate-100 text-slate-700"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  disabled
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-400 placeholder:text-slate-300"
                />
                <button type="button" disabled className="rounded-xl bg-slate-100 px-4 py-2 text-slate-400">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
