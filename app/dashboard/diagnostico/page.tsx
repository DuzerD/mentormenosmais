"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { BrandplotCache } from "@/lib/brandplot-cache"
import { AuthManager } from "@/lib/auth-utils"
import DiagnosticoCompleto from "../../../components/brilho-original/diagnostico-completo"

function DiagnosticoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [brandData, setBrandData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para recuperar o idUnico
  const getIdUnico = () => {
    // Primeiro tenta pegar dos dados do usuário logado usando AuthManager
    const user = AuthManager.getUser()
    if (user?.idUnico) {
      return user.idUnico
    }

    // Segundo, tenta pegar do BrandplotCache
    const cachedIdUnico = BrandplotCache.getIdUnico()
    if (cachedIdUnico) {
      return cachedIdUnico
    }
    
    // Fallback: tenta pegar diretamente do localStorage
    if (typeof window !== "undefined") {
      const storedIdUnico = localStorage.getItem("brandplot_idUnico")
      if (storedIdUnico) {
        return storedIdUnico
      }
    }
    return null
  }

  // Função para buscar os dados da marca
  const fetchBrandData = async (idUnico: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/brand-data?idUnico=${encodeURIComponent(idUnico)}`)
      const result = await response.json()

      if (!response.ok) {
        console.error("Erro ao buscar dados:", result.error)
        setError(result.error || "Erro ao buscar seus dados. Por favor, tente novamente mais tarde.")
        return
      }

      if (result.success && result.data) {
        console.log("Dados recuperados com sucesso:", result.data)
        setBrandData(result.data)
        setError(null)
      }
    } catch (err) {
      console.error("Erro ao buscar dados da marca:", err)
      setError("Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const idUnico = getIdUnico()
    
    if (idUnico) {
      fetchBrandData(idUnico)
    } else {
      console.error("IdUnico não encontrado")
      setError("Dados não encontrados. Redirecionando para o dashboard...")
      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1814] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-[#c8b79e]/30 border-t-[#c8b79e] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Carregando diagnóstico...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1814] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6">
            <p className="text-white mb-4">{error}</p>
            <button 
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-[#c8b79e] hover:bg-[#d0c0a8] text-[#1a1814] font-medium rounded-lg transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!brandData) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1814] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="bg-white/10 border border-white/20 rounded-lg p-6">
            <p className="text-white mb-4">Nenhum diagnóstico encontrado para sua marca.</p>
            <button 
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-[#c8b79e] hover:bg-[#d0c0a8] text-[#1a1814] font-medium rounded-lg transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    )
  }
  return (
    <DiagnosticoCompleto 
      brandData={brandData}
      onBack={() => router.push("/dashboard")}
    />
  )
}

function LoadingFallback() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1814] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 border-4 border-[#c8b79e]/30 border-t-[#c8b79e] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/70">Carregando diagnóstico...</p>
      </motion.div>
    </div>
  )
}

export default function DiagnosticoPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DiagnosticoContent />
    </Suspense>
  )
}
