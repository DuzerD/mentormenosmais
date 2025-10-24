"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

type Message = {
  id: number
  text: string
  isUser: boolean
}

const demoConversation: Array<Omit<Message, "id">> = [
  { text: "Olá! Vamos encontrar os pontos que seguram o crescimento da sua marca?", isUser: false },
  { text: "Sim! Por onde começamos?", isUser: true },
  { text: "Primeiro, me conta: qual é o principal desafio que você enfrenta hoje com sua marca?", isUser: false },
  { text: "Tenho dificuldade em atrair clientes de forma consistente.", isUser: true },
  {
    text: "Entendi. Vou analisar seu posicionamento, comunicação e experiência para revelar oportunidades reais. Em poucos minutos você recebe um plano acionável com priorização clara e materiais de apoio para acelerar a sua marca.",
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
        }, 800)
      } else {
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="bg-zinc-900 px-4 py-24">
      <div className="container mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <span className="material-symbols-outlined text-base">smart_toy</span>
            IA Mentoor LIVE
          </span>
          <h2 className="mb-6 text-4xl font-bold text-white">
            Converse com a IA e descubra o que falta para a sua marca vender mais
          </h2>
          <p className="mb-8 text-lg text-zinc-400">
            O diagnóstico Mentoor analisa posicionamento, comunicação e experiência para revelar oportunidades reais.
            Receba um plano acionável com priorização clara e materiais de apoio para acelerar a sua marca.
          </p>
          <ul className="mb-8 space-y-4 text-zinc-300">
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary">check_circle</span>
              Diagnóstico personalizado em tempo real
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary">check_circle</span>
              Análise de posicionamento e comunicação
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary">check_circle</span>
              Plano de ação de 90 dias sob medida
            </li>
          </ul>
          <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
            <Link href="/onboarding">
              Iniciar diagnóstico gratuito
              <span className="material-symbols-outlined ml-2">arrow_forward</span>
            </Link>
          </Button>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <span className="material-symbols-outlined text-primary">smart_toy</span>
              </div>
              <div>
                <p className="font-semibold text-white">Mentoor</p>
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Online
                </span>
              </div>
            </div>

            <div className="h-[400px] space-y-4 overflow-y-auto px-6 py-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    message.isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.isUser ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm bg-zinc-800 text-zinc-100"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm bg-zinc-800 px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "0ms" }} />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-zinc-500"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-zinc-500"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-800 px-6 py-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  disabled
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-500"
                />
                <button type="button" disabled className="rounded-lg bg-zinc-800 px-4 py-2 text-zinc-600">
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

