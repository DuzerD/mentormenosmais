import Image from "next/image"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="container mx-auto grid gap-10 px-4 text-sm text-slate-600 lg:grid-cols-[1fr_auto] lg:px-8">
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/mentoor-wordmark.svg" alt="Mentoor" width={140} height={32} className="h-7 w-auto" />
            <span className="hidden text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 sm:inline">
              Marca em ordem
            </span>
          </Link>
          <p className="max-w-md text-sm leading-relaxed text-slate-600">
            O Mentoor ajuda marcas modernas a comunicarem seu valor com clareza. Diagnóstico inteligente, plano de 90 dias
            e materiais prontos para executar sem desperdício.
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 text-sm text-slate-600 sm:flex-row sm:items-center">
          <Link
            href="mailto:contato@mentoor.app"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 transition-colors hover:border-slate-400 hover:text-slate-900"
          >
            <span className="material-symbols-outlined text-base">mail</span>
            contato@mentoor.app
          </Link>
          <Link
            href="https://instagram.com/menosmaistd"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 transition-colors hover:border-slate-400 hover:text-slate-900"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="material-symbols-outlined text-base">photo_camera</span>
            @menosmaistd
          </Link>
        </div>
      </div>

      <div className="mt-10 border-t border-slate-200">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row lg:px-8">
          <span>© {new Date().getFullYear()} Mentoor. Todos os direitos reservados.</span>
          <div className="flex items-center gap-4">
            <Link href="#planos" className="transition-colors hover:text-slate-900">
              Planos
            </Link>
            <Link href="#faq" className="transition-colors hover:text-slate-900">
              FAQ
            </Link>
            <Link href="/login" className="transition-colors hover:text-slate-900">
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
