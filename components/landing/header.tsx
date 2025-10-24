import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo-mentoor.svg" alt="Mentoor" width={120} height={32} className="h-8 w-auto" />
          <span className="hidden text-sm font-medium text-muted-foreground sm:inline">Marca em ordem</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <Link href="#beneficios" className="transition-colors hover:text-primary">
            Benefícios
          </Link>
          <Link href="#como-funciona" className="transition-colors hover:text-primary">
            Como funciona
          </Link>
          <Link href="#depoimentos" className="transition-colors hover:text-primary">
            Depoimentos
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="text-sm font-semibold">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button className="flex items-center gap-2 bg-primary px-5 text-primary-foreground hover:bg-primary/90" size="lg" asChild>
            <Link href="/onboarding">
              Começar agora
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

