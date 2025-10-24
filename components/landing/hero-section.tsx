import Link from "next/link"

import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 pt-24">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      <div className="container relative z-10 mx-auto grid items-center gap-12 px-4 pb-20 pt-10 lg:grid-cols-2">
        <div className="space-y-8 text-foreground">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary backdrop-blur-sm">
            Marca em ordem
          </span>
          <h1 className="text-balance text-5xl font-bold leading-tight md:text-7xl">
            Descubra o que falta para a sua marca vender mais fazendo menos.
          </h1>
          <p className="text-pretty text-xl leading-relaxed text-muted-foreground">
            O diagnóstico Mentoor analisa posicionamento, comunicação e experiência para revelar oportunidades reais.
            Receba um plano acionável com priorização clara e materiais de apoio feitos para acelerar a sua marca.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-10 text-lg font-semibold text-white shadow-xl transition-transform duration-200 hover:translate-y-[-2px] hover:shadow-2xl" asChild
            >
              <Link href="/onboarding">
                Começar agora
                <span className="material-symbols-outlined ml-2 text-2xl">arrow_forward</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="relative z-10 animate-float rounded-3xl border border-primary/20 bg-white/80 p-6 shadow-2xl backdrop-blur-md">
            <img
              src="/mentoor-dashboard-example.png"
              alt="Prévia do diagnóstico Mentoor"
              className="h-auto w-full rounded-xl object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -right-4 h-72 w-72 rounded-full bg-primary/30 opacity-30 blur-3xl" />
          <div className="absolute -top-4 -left-4 h-72 w-72 rounded-full bg-blue-400/30 opacity-30 blur-3xl" />
        </div>
      </div>
    </section>
  )
}

