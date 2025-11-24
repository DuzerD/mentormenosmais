"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BrandplotCache } from "@/lib/brandplot-cache"

export function SharedHeader({ companyName }: { companyName?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === "/dashboard"

  const handleLogout = () => {
    // Limpar dados do cache
    BrandplotCache.clear()
    
    // Limpar dados do localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("brandplot_idUnico")
      localStorage.removeItem("brandplot_cache")
      localStorage.removeItem("user") // Limpar dados do usuário logado
    }
    
    // Redirecionar para a página inicial
    router.push("/")
  }
  return (
    <header className="bg-[#1a1814] border-b border-[#c8b79e]/20 px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
            <AvatarImage src="/images/brandplot-logo.png" />
            <AvatarFallback className="bg-[#c8b79e] text-[#1a1814] font-semibold text-xs sm:text-sm">BP</AvatarFallback>
          </Avatar>
          <span className="text-white font-medium text-sm sm:text-base truncate">{companyName || "Sua Marca"}</span>
          {!isHome && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden md:flex ml-2 sm:ml-4 border-[#c8b79e]/40 text-[#c8b79e] hover:bg-[#c8b79e] hover:text-[#1a1814] text-xs sm:text-sm"
            >
              <Link href="/dashboard">← Voltar ao Dashboard</Link>
            </Button>
          )}
        </div>

        <nav className="flex items-center gap-3 sm:gap-6 md:gap-8">
          <Link
            href="/"
            className="text-xs sm:text-sm transition-colors text-white/80 hover:text-[#c8b79e] hidden sm:block"
          >
            Página Inicial
          </Link>
          <Link
            href="/dashboard"
            className={`text-xs sm:text-sm transition-colors ${isHome ? "text-[#c8b79e]" : "text-white/80 hover:text-[#c8b79e]"}`}
          >
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Dash</span>
          </Link>
          {!isHome && (
            <Link
              href="/dashboard"
              className="md:hidden text-xs text-[#c8b79e] hover:text-[#c8b79e]/80 transition-colors"
            >
              ← Voltar
            </Link>
          )}
          <button 
            onClick={handleLogout}
            className="text-white/80 hover:text-[#c8b79e] transition-colors flex items-center gap-1 sm:gap-2"
          >
            <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm hidden sm:inline">Sair</span>
          </button>
        </nav>
      </div>
    </header>
  )
}
