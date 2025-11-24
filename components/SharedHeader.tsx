"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BrandplotCache } from "@/lib/brandplot-cache"
import { AuthManager } from "@/lib/auth-utils"

export function SharedHeader({ companyName }: { companyName?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === "/dashboard"
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const updateAuthState = () => {
      setIsLoggedIn(AuthManager.isLoggedIn())
    }

    updateAuthState()

    const handleStorage = (event: StorageEvent) => {
      if (!event.key) {
        updateAuthState()
        return
      }

      const keysToWatch = ["user", "loginTimestamp", "brandplot_idUnico"]
      if (keysToWatch.includes(event.key)) {
        updateAuthState()
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const handleLogout = () => {
    BrandplotCache.clear()
    AuthManager.clearUser()

    if (typeof window !== "undefined") {
      localStorage.removeItem("brandplot_cache")
    }

    setIsLoggedIn(false)

    router.push("/")
  }

  return (
    <header className="bg-white/90 backdrop-blur border-b brand-border shadow-sm px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 border brand-border">
            <AvatarImage src="/images/brandplot-logo.png" />
            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-xs sm:text-sm">
              BP
            </AvatarFallback>
          </Avatar>
          <span className="text-slate-900 font-medium text-sm sm:text-base truncate">
            {companyName || "Sua Marca"}
          </span>
          {!isHome && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden md:flex ml-2 sm:ml-4 border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white text-xs sm:text-sm"
            >
              <Link href="/dashboard">← Voltar ao Dashboard</Link>
            </Button>
          )}
        </div>

        <nav className="flex items-center gap-3 sm:gap-6 md:gap-8">
          <Link
            href="/"
            className="text-xs sm:text-sm transition-colors text-slate-500 hover:text-blue-600 hidden sm:block"
          >
            Página Inicial
          </Link>
          <Link
            href="/dashboard"
            className={`text-xs sm:text-sm transition-colors ${
              isHome ? "text-blue-600" : "text-slate-500 hover:text-blue-600"
            }`}
          >
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Dash</span>
          </Link>
          {!isHome && (
            <Link
              href="/dashboard"
              className="md:hidden text-xs text-blue-600 hover:text-blue-500 transition-colors"
            >
              ← Voltar
            </Link>
          )}
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 sm:gap-2"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm hidden sm:inline">Sair</span>
            </button>
          ) : (
            <Button
              asChild
              size="sm"
              className="text-xs sm:text-sm bg-blue-600 text-white hover:bg-blue-500 px-3 sm:px-4 py-1"
            >
              <Link href="/login">Entrar</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
