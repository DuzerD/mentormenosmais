import Image from "next/image"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-16 text-white">
      <div className="container mx-auto px-4">
        <div className="mb-12 max-w-md">
          <Link href="/" className="mb-4 flex items-center gap-2">
            <Image src="/logo-mentoor.svg" alt="Mentoor" width={120} height={32} className="h-8 w-auto brightness-0 invert" />
          </Link>
          <p className="text-sm leading-relaxed text-gray-400">
            Descubra o que falta para a sua marca vender mais fazendo menos. Diagnóstico com IA, plano acionável e
            suporte para colocar a estratégia em prática.
          </p>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-zinc-800 pt-8 text-sm text-gray-400 md:flex-row">
          <span>© {new Date().getFullYear()} Mentoor. Todos os direitos reservados.</span>
          <div className="flex items-center gap-4">
            <Link
              href="https://instagram.com/menosmaistd/"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 transition-colors hover:bg-primary"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="material-symbols-outlined text-lg">photo_camera</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
