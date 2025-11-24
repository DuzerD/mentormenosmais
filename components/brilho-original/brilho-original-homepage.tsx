"use client"

import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { BrandplotCache } from "@/lib/brandplot-cache"
import { AuthManager } from "@/lib/auth-utils"

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay: 0.2 + i * 0.15,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
}

const heroChatMessages = [
  {
    id: "m1",
    author: "Ment⊖⊕r",
    role: "assistant",
    text: "Oi! Vamos encontrar os pontos que seguram o crescimento da sua marca?"
  },
  {
    id: "m2",
    author: "Voce",
    role: "user",
    text: "Temos campanhas rodando, mas a mensagem ainda parece desconectada."
  },
  {
    id: "m3",
    author: "Ment⊖⊕r",
    role: "assistant",
    text: "Perfeito. Vou analisar posicionamento, promessa e tom de voz. Em minutos voce recebe um plano priorizado."
  }
]

const heroTiles = [
  {
    icon: "insights",
    title: "Diagnostico guiado",
    description: "Responda poucas perguntas e veja onde sua marca perde tracao."
  },
  {
    icon: "chat_bubble",
    title: "Mensagens afinadas",
    description: "Receba headlines e argumentos que unem marketing e vendas."
  },
  {
    icon: "rocket_launch",
    title: "Plano acionavel",
    description: "Priorize o que muda resultado agora e siga com foco."
  }
]

const processSteps = [
  {
    label: "01",
    title: "Conte sobre a marca",
    description: "Posicionamento, proposta de valor e canais atuais. Sem formularios longos."
  },
  {
    label: "02",
    title: "Ment⊖⊕r analisa",
    description: "A IA cruza seus dados com benchmarks e aprendizados do nosso time."
  },
  {
    label: "03",
    title: "Receba o plano",
    description: "Veja prioridades, mensagens-chave e materiais de apoio em minutos."
  }
]

const faqs = [
  {
    question: "O diagnostico e realmente personalizado?",
    answer: "Sim. Usamos as suas respostas e o historico Ment⊖⊕r para gerar insights alinhados ao momento da sua marca."
  },
  {
    question: "Quanto tempo leva para receber o retorno?",
    answer: "O relatorio chega instantaneamente depois das perguntas. Em menos de cinco minutos voce ja tem um plano priorizado."
  },
  {
    question: "Preciso ter a marca pronta para fazer o teste?",
    answer: "Nao. O diagnostico ajuda tanto quem esta estruturando a marca quanto empresas que precisam organizar comunicacao e oferta."
  }
]

export default function BrilhoOriginalHomepage(): React.ReactElement {
  const [isLogged, setIsLogged] = useState(false)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [activeHeroMessage, setActiveHeroMessage] = useState(0)
  const [isHeroPaused, setIsHeroPaused] = useState(false)
  const totalHeroMessages = heroChatMessages.length
  const currentHeroMessage = heroChatMessages[activeHeroMessage] ?? null

  useEffect(() => {
    if (typeof window === "undefined") return

    const user = AuthManager.getUser()
    if (user && user.company) {
      setCompanyName(user.company)
      setIsLogged(true)
      return
    }

    const cache = BrandplotCache.get()
    if (cache?.companyName) {
      setCompanyName(cache.companyName)
    }
  }, [])

  useEffect(() => {
    if (isHeroPaused || totalHeroMessages <= 1) {
      return
    }

    const intervalId = window.setInterval(() => {
      setActiveHeroMessage((index) => (index + 1) % totalHeroMessages)
    }, 3200)

    return () => window.clearInterval(intervalId)
  }, [isHeroPaused, totalHeroMessages])

  const handleStart = () => {
    if (isLogged) {
      window.location.href = "/dashboard"
      return
    }
    window.location.href = "/onboarding"
  }

  const heroMessageStyle =
    currentHeroMessage?.role === "assistant"
      ? "bg-gradient-to-br from-[#2563eb] to-[#4338ca] text-white border border-blue-400/30 shadow-lg shadow-blue-200/40"
      : "bg-white text-slate-700 border border-slate-200 shadow-sm"

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f5f8ff] via-[#eef3ff] to-[#e2ecff] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-[55rem] -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute bottom-[-18rem] right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-indigo-200/25 blur-[140px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur">
          <div className="container mx-auto flex items-center justify-between px-4 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <Image src="/images/mentoor-wordmark.svg" alt="Mentoor" width={180} height={48} className="h-8 w-auto" priority />
              {companyName && <span className="hidden text-sm text-slate-500 md:inline">Bem-vindo, {companyName}</span>}
            </div>
            <nav className="flex items-center gap-3 text-sm font-medium text-slate-600">
              <Link href="#beneficios" className="transition hover:text-blue-600">Beneficios</Link>
              <Link href="#processo" className="transition hover:text-blue-600">Como funciona</Link>
              <Link href="#faq" className="transition hover:text-blue-600">FAQ</Link>
              {!isLogged && (
                <Link href="/login" className="inline-flex items-center rounded-full border border-blue-500 px-4 py-1.5 text-blue-600 transition hover:bg-blue-50">
                  Entrar
                </Link>
              )}
              <button
                onClick={handleStart}
                className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-white shadow-lg shadow-indigo-200 transition hover:shadow-xl"
              >
                {isLogged ? "Voltar ao dashboard" : "Comecar agora"}
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
                <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-8 flex flex-col items-center gap-3 lg:items-start">
                  <Image src="/images/mentoor-wordmark.svg" alt="Mentoor" width={320} height={100} className="h-auto w-64 md:w-72" />
                  <span className="rounded-full border border-slate-200 bg-white/80 px-4 py-1 text-sm font-medium text-slate-600">Marca em ordem</span>
                </motion.div>

                <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="visible" className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                  Descubra o que falta para a sua marca vender mais, fazendo menos.
                </motion.h1>

                <motion.p custom={2} variants={fadeUp} initial="hidden" animate="visible" className="mt-6 text-base text-slate-600 md:text-lg">
                  O diagnostico Ment⊖⊕r analisa posicionamento, comunicacao e experiencia para revelar oportunidades reais. Receba um plano acionavel com priorizacao clara e materiais de apoio criados para acelerar a sua marca.
                </motion.p>

                <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mt-10 flex flex-wrap justify-center gap-3 lg:justify-start">
                  <button
                    onClick={handleStart}
                    className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-3 text-base font-semibold text-white shadow-xl shadow-indigo-200 transition hover:scale-[1.02] hover:shadow-2xl"
                  >
                    {isLogged ? "Ir para o dashboard" : "Comecar diagnostico gratuito"}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>
                  <Link
                    href="#processo"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                  >
                    Ver como funciona
                  </Link>
                </motion.div>

                <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="mt-12 grid gap-4 sm:grid-cols-3">
                  {heroTiles.map((tile, index) => (
                    <div key={tile.title} className="rounded-3xl border border-slate-200/60 bg-white/80 p-5 text-left shadow-sm backdrop-blur">
                      <div className="text-sm font-semibold text-blue-500">0{index + 1}</div>
                      <div className="mt-2 text-base font-semibold text-slate-900">{tile.title}</div>
                      <p className="mt-2 text-sm text-slate-600">{tile.description}</p>
                    </div>
                  ))}
                </motion.div>
              </div>

              <motion.div
                custom={1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                onMouseEnter={() => setIsHeroPaused(true)}
                onMouseLeave={() => setIsHeroPaused(false)}
                className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-[0_35px_70px_-45px_rgba(30,64,175,0.5)] backdrop-blur"
              >
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/15 text-blue-600">AI</span>
                    Ment⊖⊕r Live
                  </span>
                  <span className="flex items-center gap-2 text-emerald-500">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    Online
                  </span>
                </div>

                <div className="mt-6">
                  <AnimatePresence mode="wait">
                    {currentHeroMessage && (
                      <motion.div
                        key={currentHeroMessage.id}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -18 }}
                        transition={{ duration: 0.35 }}
                        className={`${heroMessageStyle} rounded-3xl px-5 py-4`}
                      >
                        <div className="mb-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 font-semibold uppercase text-white/90">
                              {currentHeroMessage.author.slice(0, 1)}
                            </span>
                            <span className="text-sm font-medium">
                              {currentHeroMessage.author}
                            </span>
                          </div>
                          <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]">
                            {currentHeroMessage.role === "assistant" ? "IA" : "Voce"}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">
                          {currentHeroMessage.text}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.2)]" />
                    Ajustando narrativa
                  </div>
                  <div className="flex items-center gap-1.5">
                    {heroChatMessages.map((message, index) => (
                      <motion.span
                        key={message.id}
                        className="h-1.5 rounded-full bg-blue-500/30"
                        animate={{
                          width: index === activeHeroMessage ? 18 : 8,
                          opacity: index === activeHeroMessage ? 1 : 0.35,
                        }}
                        transition={{ duration: 0.25 }}
                      />
                    ))}
                  </div>
                </div>

                <motion.div
                  className="absolute -top-6 right-6 h-20 w-20 rounded-full bg-blue-200/30 blur-3xl"
                  animate={{ y: [0, -10, 0], opacity: [0.35, 0.5, 0.35] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute -bottom-8 left-8 h-24 w-24 rounded-full bg-indigo-200/25 blur-3xl"
                  animate={{ y: [0, 12, 0], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                />
              </motion.div>
            </div>
          </section>

          <section id="beneficios" className="pb-24 pt-12">
            <div className="container mx-auto px-4 md:px-6">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mb-12 max-w-3xl text-center">
                <h2 className="text-3xl font-bold text-slate-900">Organize a marca com clareza</h2>
                <p className="mt-3 text-base text-slate-600">
                  A Ment⊖⊕r combina inteligencia de marketing e roteiro de comunicacao para reduzir desperdicio e acelerar conversao.
                </p>
              </motion.div>

              <div className="grid gap-6 md:grid-cols-3">
                {heroTiles.map((tile) => (
                  <motion.div
                    key={tile.title}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-500">
                      {tile.icon}
                    </span>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-slate-900">{tile.title}</h3>
                      <p className="text-sm text-slate-600">{tile.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section id="processo" className="bg-white/70 py-24">
            <div className="container mx-auto px-4 md:px-6">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mb-12 max-w-3xl text-center">
                <h2 className="text-3xl font-bold text-slate-900">Como funciona o diagnostico Mentoor</h2>
                <p className="mt-3 text-base text-slate-600">Tres passos para alinhar posicionamento, promessa e mensagem.</p>
              </motion.div>
              <div className="grid gap-8 md:grid-cols-3">
                {processSteps.map((step, index) => (
                  <motion.div
                    key={step.label}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={index}
                    className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm"
                  >
                    <span className="text-sm font-semibold text-indigo-500">{step.label}</span>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-3 text-sm text-slate-600">{step.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-24 text-center">
            <div className="mx-auto max-w-3xl px-4">
              <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl font-bold text-slate-900">
                Pronto para colocar a marca em ordem?
              </motion.h2>
              <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-4 text-base text-slate-600">
                O diagnostico Ment⊖⊕r mostra onde focar e entrega materiais para sua equipe agir agora.
              </motion.p>
              <motion.button
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                onClick={handleStart}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-500"
              >
                Comecar agora
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </div>
          </section>

          <section id="faq" className="container mx-auto px-4 pb-24 md:px-6">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mb-10 max-w-3xl text-center">
              <h2 className="text-3xl font-bold text-slate-900">Perguntas frequentes</h2>
              <p className="mt-3 text-base text-slate-600">Tire duvidas rapidas antes de iniciar o diagnostico Mentoor.</p>
            </motion.div>
            <div className="mx-auto max-w-3xl space-y-4">
              {faqs.map((faq, index) => (
                <motion.details
                  key={faq.question}
                  custom={index}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm"
                >
                  <summary className="cursor-pointer text-base font-semibold text-slate-900 marker:hidden">
                    {faq.question}
                  </summary>
                  <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
                </motion.details>
              ))}
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-200 bg-white/80 py-6 backdrop-blur">
          <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 md:flex-row md:px-6">
            <div className="flex items-center gap-2">
              <Image src="/images/mentoor-wordmark.svg" alt="Mentoor" width={120} height={32} className="h-6 w-auto" />
              <span className="hidden text-slate-500 md:inline">Ment⊖⊕r</span>
            </div>
            <p>(c) 2024 Ment⊖⊕r. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}



