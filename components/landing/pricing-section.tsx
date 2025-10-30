import Link from "next/link"

import { Button } from "@/components/ui/button"

type Plan = {
  name: string
  subtitle: string
  price: string
  period?: string
  description: string
  features: string[]
  cta: string
  popular?: boolean
}

const plans: Plan[] = [
  {
    name: "Diagnóstico Mentoor",
    subtitle: "Ponto de partida",
    price: "Gratuito",
    description:
      "Conclua a Missão Zero, identifique gargalos e receba um panorama claro para organizar sua marca antes de liberar as missões.",
    features: [
      "Radiografia de mensagem, visual e consistência estratégica",
      "Mapa inicial de posicionamento e tom de voz sugerido",
      "Trilhas recomendadas para os próximos passos",
      "Sugestões de conteúdos imediatos para ativar a marca",
    ],
    cta: "Começar agora",
  },
  {
    name: "Jornada Completa Mentoor",
    subtitle: "Missões 0 a 5 liberadas",
    price: "R$ 297",
    description:
      "Para quem quer todo o time IA acompanhando a execução. Liberamos todas as missões para construir estratégia, ativos e operação completa.",
    features: [
      "Mensagem, identidade e operação comercial alinhadas em um só lugar",
      "Ativos prontos: scripts, kits visuais e calendário tático para lançar rápido",
      "Agentes IA acompanhando posicionamento, design, conteúdo e métricas",
      "Checkpoints semanais para garantir implementação sem travar",
      "Economia frente ao desbloqueio individual das missões",
    ],
    cta: "Liberar Jornada Completa",
    popular: true,
  },
  {
    name: "Missão 1 - Estratégia da Marca",
    subtitle: "Comece pela base",
    price: "R$ 97",
    description:
      "Perfeito para validar o método com foco total na estratégia. Você constrói a base da marca com o Estrategista Mentoor.",
    features: [
      "Framework completo da Missão 1 — Estratégia",
      "Proposta de valor e público ideal traduzidos com clareza",
      "Headline, pitch e pilares de mensagem aprovados pelo Estrategista",
      "Plano prático de 30 dias para experimentar e validar a narrativa",
    ],
    cta: "Liberar Missão 1",
  },
]

export function PricingSection() {
  return (
    <section id="planos" className="bg-white py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            Formas de trabalhar com a gente
          </span>
          <h2 className="mt-6 text-balance text-3xl font-semibold text-slate-900 sm:text-4xl lg:text-5xl">
            Escolha o nível de apoio ideal para o seu momento.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Comece com o diagnóstico gratuito para entender a sua situação. A partir daí, evolua com a IA do Mentoor ou
            traga o nosso time para executar ao seu lado.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`flex h-full flex-col rounded-3xl border p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.popular && (
                <span className="mb-4 inline-flex items-center rounded-full bg-indigo-600/10 px-3 py-1 text-xs font-semibold text-indigo-600">
                  Recomendado
                </span>
              )}
              <div>
                <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                <p className="mt-1 text-sm font-medium uppercase tracking-[0.25em] text-slate-500">{plan.subtitle}</p>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1 text-slate-900">
                  <span className="text-4xl font-semibold">{plan.price}</span>
                  {plan.period && <span className="text-sm text-slate-500">{plan.period}</span>}
                </div>
              </div>

              <Button
                size="lg"
                asChild
                className={`mt-8 h-11 rounded-full text-sm font-semibold ${
                  plan.popular ? "bg-slate-900 text-white hover:bg-slate-900/90" : "bg-indigo-600 text-white hover:bg-indigo-500"
                }`}
              >
                <Link href="/onboarding">{plan.cta}</Link>
              </Button>

              <ul className="mt-8 space-y-3 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5 text-base text-indigo-500">check_circle</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
