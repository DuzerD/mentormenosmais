"use client"

import Link from "next/link"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"

const heroStats = [
  { value: "5 min", label: "para receber o diagnóstico completo" },
  { value: "90 dias", label: "de plano guiado para executar com foco" },
  { value: "+120 marcas", label: "já organizaram a mensagem com o Mentoor" },
]

const heroHighlights = [
  {
    icon: "chat_bubble",
    title: "Diagnóstico guiado por IA",
    description: "Encontre os pontos cegos do posicionamento sem formulários intermináveis.",
  },
  {
    icon: "stacked_line_chart",
    title: "Playbooks priorizados",
    description: "Receba um roteiro de 90 dias com as ações que destravam vendas rapidamente.",
  },
  {
    icon: "record_voice_over",
    title: "Mensagens sob medida",
    description: "Gere headlines, argumentos e scripts que mantêm a marca consistente em qualquer canal.",
  },
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 pt-32 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_rgba(15,23,42,0.75))]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -left-40 top-1/3 h-72 w-72 rounded-full bg-indigo-500/40 blur-3xl" />
        <div className="absolute -right-32 top-10 h-80 w-80 rounded-full bg-blue-400/30 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto grid items-center gap-16 px-4 pb-24 lg:grid-cols-[1.05fr_1fr] lg:px-8">
        <div className="space-y-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur">
            <span className="material-symbols-outlined text-lg text-sky-300">auto_awesome</span>
            Diagnóstico inteligente de marca
          </span>

          <div className="space-y-6">
            <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Clareza para vender mais com metade do esforço.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-white/90">
              O Mentoor combina diagnóstico com IA e o olhar estratégico da nossa equipe para revelar onde sua mensagem
              perde força, priorizar ações e entregar materiais prontos para você aplicar agora.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button size="lg" className="h-12 rounded-full px-8 text-base font-semibold shadow-lg shadow-blue-500/30" asChild>
              <Link href="/onboarding">
                Iniciar diagnóstico gratuito
                <span className="material-symbols-outlined ml-2 text-lg">arrow_forward</span>
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-12 rounded-full px-6 text-base text-white/80 hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="#metodologia">
                Ver como funciona
                <span className="material-symbols-outlined ml-2 text-lg">play_circle</span>
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur">
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
                <p className="mt-2 text-sm text-white">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex justify-center">
          <div className="absolute -top-10 right-0 h-60 w-60 rounded-full bg-sky-500/50 blur-3xl sm:h-72 sm:w-72" />
          <div className="absolute -bottom-14 left-4 h-56 w-56 rounded-full bg-blue-400/40 blur-3xl sm:h-64 sm:w-64" />

          <div className="relative flex w-full max-w-md flex-col gap-6">
            {heroHighlights.map((highlight, index) => (
              <motion.div
                key={highlight.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: [0, -10, 0] }}
                transition={{
                  opacity: { delay: 0.25 + index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                  y: {
                    delay: 0.8 + index * 0.2,
                    duration: 6,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                  },
                }}
                className="relative rounded-3xl border border-white/30 bg-white p-6 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.35)]"
              >
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-2xl text-sky-600">
                    {highlight.icon}
                  </span>
                  <div className="space-y-2">
                    <p className="text-base font-semibold">{highlight.title}</p>
                    <p className="text-sm text-slate-600">{highlight.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: [0, -14, 0] }}
              transition={{
                opacity: { delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                y: { delay: 1.2, duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
              }}
              className="rounded-3xl border border-white/30 bg-white p-6 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.35)]"
            >
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Mentoor LIVE • IA analisando sua marca agora
              </div>
              <div className="mt-5 space-y-3 text-sm leading-relaxed text-slate-700">
                <p className="rounded-2xl bg-slate-100 px-4 py-3 text-slate-800">
                  <span className="block text-xs uppercase tracking-wide text-slate-500">Mentoor</span>
                  Identifiquei uma desconexão entre promessa e oferta. Sugiro reposicionar o headline da landing para
                  reforçar a entrega de tempo livre.
                </p>
                <p className="ml-auto max-w-[85%] rounded-2xl bg-sky-500 px-4 py-3 text-white shadow">
                  Perfeito. Quais mensagens posso usar na próxima campanha?
                </p>
                <p className="rounded-2xl bg-slate-100 px-4 py-3 text-slate-800">
                  <span className="block text-xs uppercase tracking-wide text-slate-500">Mentoor</span>
                  Gere estes argumentos nas seções “Mensagem-chave” e “Scripts de proposta”. Eles já estão alinhados ao
                  novo posicionamento.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
