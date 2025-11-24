"use client"

import { Button } from "@/components/ui/button"
import { Download, Palette, Type, ImageIcon, MessageCircle, FileDown, Loader2, Award, ArrowRight, Zap, CheckCircle2, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BrandplotCache } from "@/lib/brandplot-cache"
import ScoreCounter from "../ScoreCounter"
import { SharedHeader } from "@/components/SharedHeader"

const sections = [
  { id: "/logo", title: "Logo", icon: FileDown },
  { id: "/colors", title: "Colors", icon: Palette },
  { id: "/typography", title: "Typography", icon: Type },
  { id: "/imagery", title: "Imagery", icon: ImageIcon },
  { id: "/tone", title: "Tone of voice", icon: MessageCircle },
  { id: "/download", title: "Download", icon: Download },
]

async function fetchBrandData(idUnico: string) {
  const response = await fetch(`/api/brand-data?idUnico=${encodeURIComponent(idUnico)}`)
  if (!response.ok) return null
  const result = await response.json()
  if (result.success && result.data) return result.data
  return null
}

export default function Dashboard() {
  const [score, setScore] = useState<number>(0)
  const [companyName, setCompanyName] = useState<string>("Sua Marca")
  const [estrategia, setEstrategia] = useState<any>(null)
  const [loadingEstrategia, setLoadingEstrategia] = useState(false)
  const [erroEstrategia, setErroEstrategia] = useState<string | null>(null)
  const [enviadoDesigner, setEnviadoDesigner] = useState<boolean | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const startTime = Date.now()
      
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
        const response = await fetch(`/api/brand-data?idUnico=${encodeURIComponent(idUnico)}`)
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            const scoreValue = result.data.scoreDiagnostico ? parseInt(result.data.scoreDiagnostico, 10) : 95
            setScore(scoreValue)
            setCompanyName(result.data.nome_empresa || "Sua Marca")
            if (result.data.estrategia) {
              try {
                setEstrategia(JSON.parse(result.data.estrategia))
              } catch {
                setEstrategia(result.data.estrategia)
              }
            }
            if (typeof result.data.enviadoDesigner !== 'undefined') {
              setEnviadoDesigner(result.data.enviadoDesigner)
            }
          }
        }
      }

      // Garantir que o loading dure pelo menos 2 segundos
      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, 2000 - elapsedTime)
      
      setTimeout(() => {
        setIsInitialLoading(false)
      }, remainingTime)
    }
    loadData()
  }, [])

  async function handleGerarEstrategia() {
    setLoadingEstrategia(true)
    setErroEstrategia(null)
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
    if (!idUnico) {
      setErroEstrategia("ID não encontrado. Faça login novamente.")
      setLoadingEstrategia(false)
      return
    }
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idUnico })
      })
      if (!response.ok) {
        if (response.status === 429) {
          try {
            const errorData = await response.json()
            setErroEstrategia(errorData.message || "Limite de requisições excedido. Tente novamente mais tarde.")
          } catch {
            setErroEstrategia("Limite de requisições excedido. Tente novamente mais tarde.")
          }
        } else {
          throw new Error("Erro ao gerar estratégia")
        }
        return
      }
      const result = await response.json()
      if (result.estrategia) {
        setEstrategia(result.estrategia)
      }
    } catch (err) {
      setErroEstrategia("Erro ao gerar estratégia. Tente novamente.")
    } finally {
      setLoadingEstrategia(false)
    }
  }

  async function handleEnviarDesigner() {
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
    if (!idUnico) {
      setErroEstrategia("ID não encontrado. Faça login novamente.")
      return
    }
    try {
      const response = await fetch("/api/brand-data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idUnico, enviadoDesigner: true })
      })
      if (!response.ok) throw new Error("Erro ao enviar ao designer")
      setEnviadoDesigner(true)
    } catch {
      setErroEstrategia("Erro ao enviar ao designer. Tente novamente.")
    }
  }

  // Skeleton Components para o novo design
  const SkeletonCard = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl"
    >
      <div className="animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-white/10"></div>
          <div className="h-6 bg-white/10 rounded w-1/2"></div>
        </div>
        <div className="h-4 bg-white/5 rounded mb-4 w-3/4"></div>
        <div className="h-4 bg-white/5 rounded mb-6 w-full"></div>
        
        <div className="flex items-center justify-center mb-6">
          <div className="w-32 h-32 bg-white/10 rounded-full"></div>
        </div>
        
        <div className="text-center">
          <div className="h-10 bg-white/10 rounded w-full"></div>
        </div>
      </div>
    </motion.div>
  )

  if (isInitialLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1814]">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-amber-700/[0.05] blur-3xl" />
        
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/[0.05] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-700/[0.05] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        {/* Header */}
        <div className="relative z-10">
          <div className="bg-[#1a1814] border-b border-[#c8b79e]/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse"></div>
                <div className="h-5 bg-white/10 rounded w-24 animate-pulse"></div>
              </div>
              <div className="flex items-center gap-8">
                <div className="h-4 bg-white/10 rounded w-16 animate-pulse"></div>
                <div className="h-4 bg-white/10 rounded w-8 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <main className="relative z-10 container mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="h-8 bg-white/10 rounded mb-8 w-1/3 mx-auto animate-pulse"></div>
            </motion.div>

            <div className="space-y-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1814]">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-amber-700/[0.05] blur-3xl" />
      
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/[0.05] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-700/[0.05] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <div className="relative z-10">
        <SharedHeader companyName={companyName} />
      </div>      {/* Main content */}
      <main className="relative z-10 container mx-auto px-4 md:px-6 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center mb-8"
          >            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6 max-w-full">
              <Image
                src="/images/brilho-original-logo.png"
                alt="BrandPlot"
                width={20}
                height={20}
                className="rounded-full flex-shrink-0"
              />
              <span className="text-xs sm:text-sm text-white/60 tracking-wide truncate">
                Dashboard de <span className="text-[#c8b79e] font-medium">{companyName}</span>
              </span>
            </div>            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Bem-vindo de volta
            </h1>
            <p className="text-white/60 text-sm sm:text-base">
              Acompanhe o progresso da sua marca e acesse todas as ferramentas
            </p>
          </motion.div>          <div className="space-y-4 sm:space-y-6">
            {/* Card: Diagnóstico da Marca */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 flex items-center justify-center border border-amber-500/30">
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">Diagnóstico da Marca</h2>
              </div>
                <p className="text-white/80 mb-6 leading-relaxed text-sm sm:text-base">
                Veja o resultado do diagnóstico completo de <span className="font-bold text-[#c8b79e] break-words">{companyName}</span>, 
                com insights personalizados e score de clareza & emoção da marca.
              </p>              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 md:gap-8 mb-6">
                <div className="flex flex-col items-center">
                  <div className="relative mb-3 md:mb-4">
                    <ScoreCounter targetScore={score} duration={2000} />
                  </div>
                  <p className="text-white/60 text-xs sm:text-sm text-center">
                    Nota de Clareza & Emoção
                  </p>
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-white/80 text-xs sm:text-sm">Diagnóstico Completo</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <Star className="w-4 h-4 text-[#c8b79e] flex-shrink-0" />
                      <span className="text-white/80 text-xs sm:text-sm">Insights Personalizados</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <Zap className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-white/80 text-xs sm:text-sm">Próximos Passos Definidos</span>
                    </div>
                  </div>
                </div>
              </div>              <div className="text-center">
                <Button asChild className="bg-gradient-to-r from-[#c8b79e] to-[#b09e85] hover:from-[#d0c0a8] hover:to-[#c8b79e] text-[#1a1814] font-medium border-0 w-full py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                  <Link href="/diagnostico" className="flex items-center justify-center gap-2">
                    <span className="hidden sm:inline">Ver diagnóstico completo</span>
                    <span className="sm:hidden">Ver diagnóstico</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Card: Estratégia de Marca */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl"
            >              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">Estratégia de Marca</h2>
                </div>
                <span className="text-[#c8b79e]/60 text-xs italic bg-[#c8b79e]/10 px-2 py-1 rounded-full border border-[#c8b79e]/20 self-start sm:self-center whitespace-nowrap">
                  Gerado por IA
                </span>
              </div>
                <p className="text-white/80 mb-6 leading-relaxed text-sm sm:text-base">
                Acesse a análise de perfil e direcionamento estratégico para sua marca, com insights personalizados e
                recomendações acionáveis para crescimento.
              </p>

              <div className="space-y-4">
                {!estrategia ? (
                  <Button
                    className="bg-gradient-to-r from-[#c8b79e] to-[#b09e85] hover:from-[#d0c0a8] hover:to-[#c8b79e] text-[#1a1814] font-medium border-0 w-full py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                    onClick={handleGerarEstrategia}
                    disabled={loadingEstrategia}
                  >                    {loadingEstrategia ? (
                      <>
                        <Loader2 className="animate-spin mr-2 w-4 h-4" />
                        <span className="hidden sm:inline">Gerando estratégia...</span>
                        <span className="sm:hidden">Gerando...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 w-4 h-4" />
                        <span className="hidden sm:inline">Gerar estratégia de marca</span>
                        <span className="sm:hidden">Gerar estratégia</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">                    <Button asChild className="bg-gradient-to-r from-[#c8b79e] to-[#b09e85] hover:from-[#d0c0a8] hover:to-[#c8b79e] text-[#1a1814] font-medium border-0 flex-1 py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                      <Link href="/estrategia" className="flex items-center justify-center gap-2">
                        <span className="hidden sm:inline">Visualizar estratégia</span>
                        <span className="sm:hidden">Ver estratégia</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 text-green-300 border border-green-500/30 flex-1 py-2.5 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleEnviarDesigner}
                      disabled={enviadoDesigner === true}
                    >                      {enviadoDesigner === true ? (
                        <>
                          <CheckCircle2 className="mr-2 w-4 h-4" />
                          <span className="hidden sm:inline">Enviado ao Designer</span>
                          <span className="sm:hidden">Enviado</span>
                        </>
                      ) : (
                        <>
                          <Star className="mr-2 w-4 h-4" />
                          <span className="hidden sm:inline">Aprovar e Enviar</span>
                          <span className="sm:hidden">Aprovar</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                {erroEstrategia && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
                    {erroEstrategia}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Card: Modelo de Voz IA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="bg-gradient-to-br from-orange-500/[0.12] to-orange-600/[0.04] backdrop-blur-sm border border-orange-500/20 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl"
            >              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 flex items-center justify-center border border-orange-500/30 flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-orange-400" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">Assistente de IA - BrandPlot</h2>
                </div>
                <span className="bg-gradient-to-r from-orange-500/15 to-orange-600/10 text-orange-300 text-xs font-medium px-2 sm:px-3 py-1 rounded-full border border-orange-500/20 self-start sm:self-center whitespace-nowrap">
                  Beta
                </span>
              </div>
                <p className="text-white/80 mb-6 leading-relaxed text-sm sm:text-base">
                Converse com nosso modelo de IA especializado sobre <span className="font-bold text-orange-300 break-words">{companyName}</span>. 
                Faça perguntas sobre sua marca, explore insights e obtenha orientações personalizadas através de uma conversa intuitiva.
              </p>

              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-200 mb-1 text-sm sm:text-base">O que você pode fazer:</h3>                    <ul className="text-xs sm:text-sm text-orange-200/80 space-y-1">
                      <li>• Discutir estratégias de posicionamento</li>
                      <li>• Explorar oportunidades de mercado</li>
                      <li>• Obter sugestões de melhorias</li>
                      <li>• Esclarecer dúvidas sobre sua marca</li>
                    </ul>
                  </div>
                </div>
              </div>              <div className="text-center">
                <Button asChild className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium border-0 w-full py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                  <Link href="/chat" className="flex items-center justify-center gap-2">
                    <span className="hidden sm:inline">Iniciar conversa</span>
                    <span className="sm:hidden">Conversar</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Card: Edição no Figma */}
            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="bg-gradient-to-br from-purple-500/[0.12] to-purple-600/[0.04] backdrop-blur-sm border border-purple-500/20 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl"
            >              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/20 to-purple-600/20 flex items-center justify-center border border-purple-500/30 flex-shrink-0">
                    <Palette className="w-6 h-6 text-purple-400" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">Visualização no Figma</h2>
                </div>
                <span className="bg-gradient-to-r from-purple-500/15 to-purple-600/10 text-purple-300 text-xs font-medium px-2 sm:px-3 py-1 rounded-full border border-purple-500/20 self-start sm:self-center whitespace-nowrap">
                  Design
                </span>
              </div>
              
              <p className="text-white/80 mb-6 leading-relaxed">
                Edite aqui no Figma seu layout de postagem e outros materiais gráficos para <span className="font-bold text-purple-300">{companyName}</span>. 
                Acesse templates personalizados e ferramentas de design colaborativo.
              </p>

              <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-200 mb-1">Recursos disponíveis:</h3>
                    <ul className="text-sm text-purple-200/80 space-y-1">
                      <li>• Templates de postagem para redes sociais</li>
                      <li>• Layouts personalizados para sua marca</li>
                      <li>• Paleta de cores e tipografia oficial</li>
                      <li>• Elementos gráficos exclusivos</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button asChild className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium border-0 px-8 py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                  <Link href="/figma" className="flex items-center gap-2">
                    Abrir
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </motion.div> */}

            {/* Card: Guidelines (quando estratégia existe) */}
            {estrategia && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="bg-gradient-to-br from-[#c8b79e]/[0.15] to-[#c8b79e]/[0.05] backdrop-blur-sm border border-[#c8b79e]/20 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#c8b79e]/30 to-[#c8b79e]/20 flex items-center justify-center border border-[#c8b79e]/40">
                    <Palette className="w-6 h-6 text-[#c8b79e]" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">Guidelines de Marca</h2>
                </div>
                
                <div className="text-white/80 mb-6">
                  {enviadoDesigner === true ? (
                    <div className="bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/30 rounded-xl p-4 text-green-300">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-semibold">Em revisão pelo designer</span>
                      </div>
                      <p className="text-sm text-green-200">
                        Entraremos em contato quando os guidelines estiverem disponíveis para download.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-[#c8b79e]/10 to-[#c8b79e]/5 border border-[#c8b79e]/30 rounded-xl p-4 text-[#c8b79e]">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-5 h-5" />
                        <span className="font-semibold">Pronto para envio</span>
                      </div>
                      <p className="text-sm text-[#c8b79e]/80">
                        Envie sua estratégia ao designer para começar o processo de criação dos guidelines da marca.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
