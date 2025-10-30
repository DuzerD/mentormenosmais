import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

const promises = [
  "Diagnóstico guiado em menos de 10 minutos",
  "Plano de execução realista para os próximos 90 dias",
  "Mensagens e materiais prontos para aplicar imediatamente",
]

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/30 via-slate-950 to-blue-600/40" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-sky-400/40 blur-3xl" />
      <div className="absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />

      <div className="container relative z-10 mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-balance text-3xl font-semibold sm:text-4xl lg:text-5xl">
          Pare de refazer tudo a cada campanha. Coloque a mensagem da sua marca em ordem com o Mentoor.
        </h2>
        <p className="mt-4 text-lg text-white/75">
          Leve clareza para o time, direcione esforços e use materiais que já nascem alinhados ao posicionamento. Você
          merece crescer sem carregar a marca sozinho(a).
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="h-12 rounded-full bg-white px-8 text-base font-semibold text-slate-900 shadow-[0_20px_40px_rgba(59,130,246,0.3)] hover:bg-white/95"
            asChild
          >
            <Link href="/onboarding">
              Fazer meu diagnóstico gratuito
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="h-12 rounded-full px-6 text-base text-white/80 hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="https://instagram.com/menosmaistd" target="_blank" rel="noopener noreferrer">
              Falar com o time
              <span className="material-symbols-outlined text-lg">chat</span>
            </Link>
          </Button>
        </div>

        <ul className="mt-12 flex flex-col items-center justify-center gap-4 text-sm text-white/75 sm:flex-row">
          {promises.map((promise) => (
            <li key={promise} className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs text-sky-200">✓</span>
              {promise}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
