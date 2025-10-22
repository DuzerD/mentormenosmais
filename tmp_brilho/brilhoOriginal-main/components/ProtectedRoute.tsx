"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BrandplotCache } from "@/lib/brandplot-cache"

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuthentication = () => {
      // Verificar se há dados de autenticação no cache
      const cachedData = BrandplotCache.get()
      let hasAuth = false

      if (cachedData && cachedData.idUnico) {
        hasAuth = true
      } else if (typeof window !== "undefined") {
        // Fallback: verificar localStorage
        const storedId = localStorage.getItem("brandplot_idUnico")
        if (storedId) {
          hasAuth = true
        }
      }

      if (!hasAuth) {
        // Usuário não autenticado - redirecionar para página inicial
        router.push("/")
        return
      }

      setIsAuthenticated(true)
    }

    checkAuthentication()
  }, [router])

  // Enquanto verifica autenticação, mostrar loading ou fallback
  if (isAuthenticated === null) {
    return (
      fallback || (
        <div className="min-h-screen bg-[#1a1814] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#c8b79e] border-t-transparent"></div>
        </div>
      )
    )
  }

  // Se autenticado, renderizar o conteúdo
  return <>{children}</>
} 