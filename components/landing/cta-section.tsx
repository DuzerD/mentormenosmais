import Link from "next/link"
import type { ComponentProps } from "react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

function Check(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-700 py-24 text-white">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      <div className="container relative z-10 mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-balance text-4xl font-bold md:text-6xl">
          Saia do modo �?ofazer tudo sozinho�?? e recupere o controle do seu tempo
        </h2>
        <p className="mt-6 text-xl text-white/90">
          A maioria dos empreendedores acredita que precisa fazer tudo para dar certo. A verdade Ǹ que crescimento
          sustentǭvel vem quando vocǦ foca no que importa e cria um sistema que trabalha por vocǦ.
        </p>

        <div className="mt-10 space-y-4 text-lg text-white/90">
          <p>O Mentoor entrega clareza, foco e tempo para vocǦ viver melhor o que construiu.</p>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" className="bg-white px-8 text-lg text-primary hover:bg-gray-100" asChild>
            <Link href="/onboarding">
              Quero ter clareza no meu negocio
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-white/90">
          <span className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            Diagn��stico inteligente
          </span>
          <span className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            MǸtodo validado na prǭtica
          </span>
          <span className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            Resultados com clareza, nǜo correria
          </span>
        </div>
      </div>

      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-400 opacity-20 blur-3xl" />
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-indigo-400 opacity-20 blur-3xl" />
    </section>
  )
}
