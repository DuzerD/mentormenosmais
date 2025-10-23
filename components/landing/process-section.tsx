import Link from "next/link"

import { Button } from "@/components/ui/button"

const steps = [
  {
    number: "01",
    title: "Diagnóstico e clareza",
    description:
      "Descubra onde está o verdadeiro gargalo da sua marca — e por que trabalhar mais não tem gerado crescimento. Você vai enxergar onde focar e o que deixar de lado.",
  },
  {
    number: "02",
    title: "Reestruturação estratégica com IA",
    description:
      "Organize posicionamento, oferta e comunicação em um sistema simples que trabalha por você. Menos tarefas soltas, mais direção.",
  },
  {
    number: "03",
    title: "Aplicação e resultado",
    description:
      "Com o plano pronto, você aplica, testa e fatura — com tempo para viver o que realmente importa.",
  },
]

export function ProcessSection() {
  return (
    <section id="como-funciona" className="bg-white py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <span className="mb-6 inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            Como funciona?
          </span>
          <h2 className="text-balance text-4xl font-bold md:text-5xl">O plano que simplifica o seu negócio em 3 passos</h2>
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="order-2 rounded-3xl bg-gradient-to-br from-primary to-blue-600 p-8 text-white lg:order-1">
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src="/professional-person-with-confident-expression-oran.jpg"
                alt="Mentora explicando plano estratégico"
                className="relative z-10 h-auto w-full rounded-2xl object-cover"
              />
              <div className="absolute inset-x-8 bottom-8 z-20 rounded-2xl bg-white p-6 text-left text-zinc-900 shadow-2xl">
                <p className="text-xs font-medium text-gray-500">Como funciona?</p>
                <h3 className="mb-4 text-2xl font-semibold">O plano que simplifica o seu negócio</h3>
                <Button size="lg" className="bg-primary text-white hover:bg-primary/90" asChild>
                  <Link href="/onboarding" className="flex items-center gap-2">
                    Garanta sua vaga no Mentoor
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="order-1 space-y-8 lg:order-2">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-6">
                <span className="flex-shrink-0 text-5xl font-bold text-primary">{step.number}</span>
                <div>
                  <h3 className="text-2xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
