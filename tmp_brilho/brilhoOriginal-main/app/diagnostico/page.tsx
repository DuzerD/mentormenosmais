"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { BrandplotCache } from "@/lib/brandplot-cache"
import { AuthManager } from "@/lib/auth-utils"
import DiagnosticoCompleto from "../../components/brilho-original/diagnostico-completo"

function DiagnosticoContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [brandData, setBrandData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      let idUnico = null
      if (typeof window !== "undefined") {
        const cache = BrandplotCache.get()
        if (cache && cache.idUnico) {
          idUnico = cache.idUnico
        } else {
          const storedId = localStorage.getItem("brandplot_idUnico")
          if (storedId) idUnico = storedId
        }
      }
      if (idUnico) {
        try {
          const response = await fetch(`/api/brand-data?idUnico=${encodeURIComponent(idUnico)}`)
          const result = await response.json()
          if (result.success && result.data) {
            setBrandData(result.data)
            setLoading(false)
            return
          }
        } catch {}
      }
      setBrandData(null)
      setLoading(false)
    }
    loadData()
  }, [])

  const handleBack = () => {
    // Verificar se o usuário está realmente logado usando AuthManager
    const user = AuthManager.getUser()
    if (user?.idUnico) {
      router.push("/dashboard")
      return
    }
    
    // Se não está logado, voltar para a homepage
    router.push("/")
  }

  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1814] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#c8b79e]/30 border-t-[#c8b79e] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Carregando diagnóstico...</p>
        </div>
      </div>
    )
  }
  if (!brandData) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1814] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white/10 border border-white/20 rounded-lg p-6">
            <p className="text-white mb-4">Nenhum diagnóstico encontrado para sua marca.</p>
            <button 
              onClick={handleBack}
              className="px-4 py-2 bg-[#c8b79e] hover:bg-[#d0c0a8] text-[#1a1814] font-medium rounded-lg transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DiagnosticoCompleto 
      brandData={brandData}
      onBack={handleBack}
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
