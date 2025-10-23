import Link from "next/link"

import { Button } from "@/components/ui/button"

type Plan = {
  emoji: string
  name: string
  subtitle: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  popular?: boolean
}

const plans: Plan[] = [
  {
    emoji: "🧭",
    name: "Diagnóstico gratuito",
    subtitle: "O primeiro passo para clarear sua mensagem",
    price: "Gratuito",
    period: "",
    description:
      "Entenda por que sua marca ainda não comunica o valor que entrega e descubra onde está o gargalo que trava o seu crescimento.",
    features: [
      "Análise automática com IA",
      "Relatório personalizado de clareza de marca",
      "Indicação do próximo passo ideal",
      "100% gratuito",
    ],
    cta: "Fazer meu diagnóstico",
  },
  {
    emoji: "🚀",
    name: "Mentoor IA",
    subtitle: "Plano para fazer menos e faturar mais",
    price: "R$ 250",
    period: "/mês",
    description:
      "Tenha um acompanhamento inteligente que organiza seu posicionamento, simplifica suas ofertas e te ajuda a vender com leveza.",
    features: [
      "Diagnóstico e posicionamento com IA",
      "Plano de ação guiado e revisões mensais",
      "Comunidade e suporte direto",
      "Ideias de conteúdo e vendas automatizadas",
      "Resultados mensuráveis em até 90 dias",
    ],
    cta: "Quero entrar no Mentoor IA",
    popular: true,
  },
  {
    emoji: "🎯",
    name: "MenosMais Studio",
    subtitle: "Pra quem quer o resultado pronto, sem executar",
    price: "Sob medida",
    period: "",
    description:
      "Projeto feito do zero pela equipe MenosMais Studio — estratégia, identidade e posicionamento prontos para colocar sua marca no próximo nível.",
    features: [
      "Planejamento e posicionamento completo",
      "Design e comunicação alinhados à estratégia",
      "Execução feita pela equipe MenosMais",
      "Acompanhamento de performance",
      "Resultados premium sob medida",
    ],
    cta: "Solicitar proposta",
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="bg-zinc-950 py-24 text-white">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="text-balance text-4xl font-bold text-white md:text-5xl">
            Escolha o passo certo para simplificar o seu negócio
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-xl text-gray-400">
            Três formas de sair do modo “fazer tudo sozinho” e começar a crescer com clareza, estratégia e tempo de
            sobra.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-3xl p-8 transition-transform ${
                plan.popular ? "scale-105 bg-gradient-to-br from-primary to-blue-600" : "border border-zinc-800 bg-zinc-900"
              }`}
            >
              {plan.popular && (
                <span className="mb-4 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  RECOMENDADO
                </span>
              )}

              <div className="mb-4 text-4xl">{plan.emoji}</div>
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className={`mt-3 text-sm font-medium ${plan.popular ? "text-white/90" : "text-gray-300"}`}>
                {plan.subtitle}
              </p>
              <p className={`mt-4 text-sm ${plan.popular ? "text-white/80" : "text-gray-400"}`}>{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-bold">{plan.price}</span>
                {plan.period && <span className={`text-lg ${plan.popular ? "text-white/80" : "text-gray-400"}`}>{plan.period}</span>}
              </div>

              <Button
                size="lg"
                asChild
                className={`mt-6 w-full ${
                  plan.popular ? "bg-white text-primary hover:bg-gray-100" : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                <Link href="/onboarding">{plan.cta}</Link>
              </Button>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span
                      className={`material-symbols-outlined text-xl ${plan.popular ? "text-white" : "text-primary"}`}
                    >
                      check_circle
                    </span>
                    <span className={plan.popular ? "text-sm text-white/90" : "text-sm text-gray-300"}>{feature}</span>
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
