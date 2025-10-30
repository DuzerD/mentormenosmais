"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navigation = [
  { href: "#solucao", label: "Solução" },
  { href: "#metodologia", label: "Metodologia" },
  { href: "#resultados", label: "Resultados" },
  { href: "#planos", label: "Planos" },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        isScrolled
          ? "border-b border-white/30 bg-white/90 pb-4 pt-3 backdrop-blur"
          : "bg-transparent pb-10 pt-8"
      )}
    >
      <div className="container mx-auto flex items-center justify-between rounded-full border border-white/30 bg-white/90 px-5 py-3 text-slate-900 shadow-[0_15px_50px_rgba(15,23,42,0.18)] backdrop-blur-lg lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <Image src="/logo-mentoor.svg" alt="Mentoor" width={120} height={32} className="h-8 w-auto" priority />
          <span className="hidden lg:inline text-slate-500">Menos tarefas, mais resultado</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-500 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative transition-colors hover:text-slate-900"
            >
              {item.label}
              <span className="absolute inset-x-0 -bottom-1 block h-px scale-x-0 bg-slate-900/60 transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="hidden h-10 rounded-full px-5 text-sm font-semibold text-slate-600 hover:text-slate-900 sm:inline-flex">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button
            className="h-10 rounded-full bg-slate-900 px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.28)] hover:bg-slate-800"
            asChild
          >
            <Link href="/onboarding">
              Começar agora
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
