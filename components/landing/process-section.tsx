import Link from "next/link"

import { Button } from "@/components/ui/button"

const steps = [
  {
    number: "01",
    title: "Mapeie o cenário em minutos",
    description:
      "Responda perguntas guiadas sobre posicionamento, oferta e experiência. Nada de formulários infinitos — focamos no que muda o jogo.",
    deliverables: ["Análise de posicionamento atual", "Termômetro de clareza da mensagem"],
  },
  {
    number: "02",
    title: "IA + curadoria estratégica",
    description:
      "A IA do Mentoor cruza suas respostas com benchmarks do nosso time e gera um plano de execução que respeita seu momento e seus recursos.",
    deliverables: ["Prioridades de 90 dias", "Playbooks prontos para canais comerciais"],
  },
  {
    number: "03",
    title: "Aplique com apoio real",
    description:
      "Receba materiais de apoio, mensagens-chave e scripts prontos. Use o hub para acompanhar progresso e ajustar com feedback contínuo.",
    deliverables: ["Biblioteca de mensagens sob medida", "Check-ins e métricas para acompanhar evolução"],
  },
]

export function ProcessSection() {
  return (
    <section id="metodologia" className="bg-slate-900 py-24 text-white">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
            Metodologia Mentoor
          </span>
          <h2 className="mt-6 text-balance text-3xl font-semibold sm:text-4xl lg:text-5xl">
            Diagnóstico rápido, plano preciso, execução possível.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/85">
            Unimos automação com olhar estratégico para que founders e times enxutos tenham foco. Cada etapa libera um
            conjunto de materiais e decisões claras para avançar sem ruído.
          </p>
        </div>

        <div className="relative mt-16 grid gap-10 lg:grid-cols-3">
          <span className="pointer-events-none absolute inset-y-6 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-sky-300/50 via-white/20 to-transparent lg:block" />
          {steps.map((step) => (
            <article key={step.number} className="relative rounded-3xl border border-white/20 bg-white/10 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.35)] backdrop-blur">
              <div className="flex items-center gap-4 text-white/85">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/10 text-lg font-semibold text-white">
                  {step.number}
                </span>
                <p className="text-sm uppercase tracking-[0.2em] text-white/80">Etapa</p>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-white/85">{step.description}</p>
              <div className="mt-6 space-y-2 text-sm text-white">
                {step.deliverables.map((item) => (
                  <p key={item} className="flex items-start gap-2">
                    <span className="material-symbols-outlined mt-0.5 text-base text-sky-200">check</span>
                    <span>{item}</span>
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-5 text-center text-white/85 sm:flex-row sm:justify-center sm:text-left">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white">Pronto para começar?</p>
            <p className="mt-2 max-w-lg text-sm">
              Rode o diagnóstico gratuito, receba o plano inicial e veja como o Mentoor pode acompanhar o seu crescimento
              nos próximos 90 dias.
            </p>
          </div>
          <Button
            size="lg"
            className="h-12 rounded-full bg-white px-8 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(59,130,246,0.3)] hover:bg-white/90"
            asChild
          >
            <Link href="/onboarding">
              Fazer meu diagnóstico
              <span className="material-symbols-outlined text-base">rocket_launch</span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
