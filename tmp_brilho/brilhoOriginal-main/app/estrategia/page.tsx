"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Target, Users, TrendingUp, Rocket, Calendar, Instagram, ArrowRight, Lightbulb, Eye, Zap } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function StrategyPage() {
  const [estrategia, setEstrategia] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchEstrategia() {
      let idUnico = null
      if (typeof window !== "undefined") {
        const cache = window.localStorage.getItem("brandplot_idUnico")
        if (cache) idUnico = cache
      }
      if (!idUnico) {
        setErro("ID não encontrado. Faça login novamente.")
        setLoading(false)
        return
      }
      try {
        const response = await fetch(`/api/brand-data?idUnico=${encodeURIComponent(idUnico)}`)
        if (!response.ok) throw new Error("Erro ao buscar estratégia")
        const result = await response.json()
        if (result.success && result.data && result.data.estrategia) {
          try {
            setEstrategia(JSON.parse(result.data.estrategia))
          } catch {
            setEstrategia(result.data.estrategia)
          }
        } else {
          setErro("Estratégia ainda não gerada. Volte ao dashboard para gerar.")
        }
      } catch {
        setErro("Erro ao buscar estratégia.")
      } finally {
        setLoading(false)
      }
    }
    fetchEstrategia()
  }, [])

  // Helper para arrays
  const renderArray = (arr: any[]) => arr && arr.length > 0 ? (
    <ul className="list-disc pl-5 space-y-2 text-white/80 text-sm leading-relaxed">
      {arr.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  ) : <div className="text-white/50 text-sm">Não informado</div>

  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1814] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#c8b79e]/30 border-t-[#c8b79e] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Carregando estratégia...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1814] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white/10 border border-white/20 rounded-lg p-6">
            <p className="text-white mb-4">{erro}</p>
            <button 
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-[#c8b79e] hover:bg-[#d0c0a8] text-[#1a1814] font-medium rounded-lg transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!estrategia) return null

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1814]">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-amber-700/[0.05] blur-3xl" />

      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/[0.05] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-700/[0.05] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-white/60 hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Voltar ao Dashboard</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#c8b79e]/20 flex items-center justify-center">
              <Image
                src="/images/brilho-original-logo.png"
                alt="BrandPlot"
                width={24}
                height={24}
                className="rounded-full"
              />
            </div>
            <span className="text-white font-medium">BrandPlot</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-4 md:px-6 py-12 md:py-16 pb-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6">
              <Image
                src="/images/brilho-original-logo.png"
                alt="BrandPlot"
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className="text-sm text-white/60 tracking-wide">
                Estratégia de Marca Completa
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Estratégia de Marca
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-6 max-w-3xl mx-auto">
              Reposicionamento e construção futura para fortalecer sua marca no mercado.
            </p>
            <span className="text-[#c8b79e]/60 text-sm italic">Gerado por IA</span>
          </motion.div>

          <div className="space-y-8">
            {/* Marca Desejada */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 flex items-center justify-center border border-amber-500/30">
                  <Target className="w-6 h-6 text-amber-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">Marca Desejada e Redirecionamento Estratégico</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/[0.05] rounded-xl p-4 border border-white/10">
                  <h3 className="text-[#c8b79e] font-medium mb-3 flex items-center gap-2">
                    📍 Percepção Desejada
                  </h3>
                  <div className="text-white/80 text-sm leading-relaxed">{estrategia.marcaDesejada?.percepcaoDesejada || "Não informado"}</div>
                </div>
                <div className="bg-white/[0.05] rounded-xl p-4 border border-white/10">
                  <h3 className="text-[#c8b79e] font-medium mb-3 flex items-center gap-2">
                    📢 Direção de Comunicação
                  </h3>
                  <div className="text-white/80 text-sm leading-relaxed">{estrategia.marcaDesejada?.direcaoComunicacao || "Não informado"}</div>
                </div>
                <div className="bg-white/[0.05] rounded-xl p-4 border border-white/10">
                  <h3 className="text-[#c8b79e] font-medium mb-3 flex items-center gap-2">
                    🚀 Próximo Passo Sugerido
                  </h3>
                  <div className="text-white/80 text-sm leading-relaxed">{estrategia.marcaDesejada?.proximoPassoSugerido || "Não informado"}</div>
                </div>
              </div>
            </motion.div>

            {/* Reposicionamento Criativo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/20 to-purple-600/20 flex items-center justify-center border border-purple-500/30">
                  <Rocket className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">✨ Reposicionamento Criativo</h2>
              </div>
              <div className="space-y-6">
                <div className="bg-white/[0.05] rounded-xl p-4 border border-white/10">
                  <h3 className="text-[#c8b79e] font-medium mb-3">3 Ideias Práticas de Reposicionamento</h3>
                  {renderArray(estrategia.reposicionamentoCriativo?.ideiasPraticas)}
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/[0.05] rounded-xl p-4 border border-white/10">
                    <h3 className="text-[#c8b79e] font-medium mb-3">Novas Formas de Comunicar</h3>
                    <div className="space-y-2 text-white/80 text-sm">
                      <div><strong>Voz:</strong> {estrategia.reposicionamentoCriativo?.novasFormasDeComunicar?.voz || "Não informado"}</div>
                      <div><strong>Estilo:</strong> {estrategia.reposicionamentoCriativo?.novasFormasDeComunicar?.estilo || "Não informado"}</div>
                      <div><strong>Canais:</strong> {estrategia.reposicionamentoCriativo?.novasFormasDeComunicar?.canais ? renderArray(estrategia.reposicionamentoCriativo.novasFormasDeComunicar.canais) : "Não informado"}</div>
                    </div>
                  </div>
                  <div className="bg-white/[0.05] rounded-xl p-4 border border-white/10">
                    <h3 className="text-[#c8b79e] font-medium mb-3">Briefing Visual</h3>
                    <div className="space-y-2 text-white/80 text-sm">
                      <div><strong>Paleta:</strong> {estrategia.reposicionamentoCriativo?.briefingVisual?.paleta || "Não informado"}</div>
                      <div><strong>Símbolos:</strong> {estrategia.reposicionamentoCriativo?.briefingVisual?.simbolos || "Não informado"}</div>
                      <div><strong>Estilo:</strong> {estrategia.reposicionamentoCriativo?.briefingVisual?.estilo || "Não informado"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Conexão com Novos Clientes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 flex items-center justify-center border border-blue-500/30">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">🎯 Conexão com Novos Clientes</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/[0.05] rounded-xl p-4 border border-white/10">
                  <h3 className="text-[#c8b79e] font-medium mb-3">Ações para Atrair Novos Públicos</h3>
                  {renderArray(estrategia.conexaoComNovosClientes?.acoesParaAtrair)}
                </div>
                <div className="bg-white/[0.05] rounded-xl p-4 border border-white/10">
                  <h3 className="text-[#c8b79e] font-medium mb-3">Rituais e Comunidade</h3>
                  <div className="text-white/80 text-sm leading-relaxed">{estrategia.conexaoComNovosClientes?.rituaisEComunidade || "Não informado"}</div>
                </div>
              </div>
            </motion.div>

            {/* Plano de Ação Estratégico */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="bg-gradient-to-br from-[#c8b79e]/[0.15] to-[#c8b79e]/[0.05] backdrop-blur-sm border border-[#c8b79e]/20 rounded-2xl p-6 md:p-8 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#c8b79e]/30 to-[#c8b79e]/20 flex items-center justify-center border border-[#c8b79e]/40">
                  <TrendingUp className="w-6 h-6 text-[#c8b79e]" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">📌 Plano de Ação Estratégico</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/[0.05] rounded-xl p-4 border border-white/10">
                  <h3 className="text-[#c8b79e] font-medium mb-3">Pilares de Conteúdo</h3>
                  {renderArray(estrategia.planoDeAcaoEstrategico?.pilaresConteudo)}
                </div>
                <div className="bg-white/[0.05] rounded-xl p-4 border border-white/10">
                  <h3 className="text-[#c8b79e] font-medium mb-3">Campanhas</h3>
                  {renderArray(estrategia.planoDeAcaoEstrategico?.campanhas)}
                </div>
                <div className="bg-white/[0.05] rounded-xl p-4 border border-white/10">
                  <h3 className="text-[#c8b79e] font-medium mb-3">Ações Internas</h3>
                  {renderArray(estrategia.planoDeAcaoEstrategico?.acoesInternas)}
                </div>
                <div className="bg-white/[0.05] rounded-xl p-4 border border-white/10">
                  <h3 className="text-[#c8b79e] font-medium mb-3">Ações Externas</h3>
                  {renderArray(estrategia.planoDeAcaoEstrategico?.acoesExternas)}
                </div>
              </div>
            </motion.div>

            {/* Calendário Editorial */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="bg-gradient-to-br from-green-500/[0.1] to-green-600/[0.05] backdrop-blur-sm border border-green-500/20 rounded-2xl p-6 md:p-8 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500/20 to-green-600/20 flex items-center justify-center border border-green-500/30">
                  <Calendar className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">🗓️ Calendário Editorial Semanal</h2>
              </div>
              <div className="space-y-4">
                {Array.isArray(estrategia.calendarioEditorial) && estrategia.calendarioEditorial.length > 0 ? (
                  estrategia.calendarioEditorial.map((semana: any, idx: number) => (
                    <div key={idx} className="bg-white/[0.05] rounded-xl p-4 border border-white/10">
                      <h3 className="text-white font-medium mb-2">{semana.semana || `Semana ${idx + 1}`}</h3>
                      {renderArray(semana.ideiasDeConteudo || [])}
                    </div>
                  ))
                ) : (
                  <div className="bg-white/[0.05] rounded-xl p-4 border border-white/10">
                    <span className="text-white/50 text-sm">Não informado</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Nova Bio Instagram */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="bg-gradient-to-br from-pink-500/[0.1] to-pink-600/[0.05] backdrop-blur-sm border border-pink-500/20 rounded-2xl p-6 md:p-8 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500/20 to-pink-600/20 flex items-center justify-center border border-pink-500/30">
                  <Instagram className="w-6 h-6 text-pink-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">✍️ Nova Bio para Instagram</h2>
              </div>
              <div className="bg-white/[0.05] rounded-xl p-4 border border-white/10">
                <div className="font-mono text-white/90 text-sm leading-relaxed">
                  {estrategia.novaBioInstagram || <span className="text-white/50">Não informado</span>}
                </div>
              </div>
            </motion.div>

            {/* Nota final */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="bg-[#c8b79e]/10 border border-[#c8b79e]/20 rounded-2xl p-6"
            >
              <p className="text-white/80 text-sm italic leading-relaxed">
                <span className="text-[#c8b79e] font-medium">Nota:</span> Esta estratégia foi desenvolvida com base na
                análise do perfil atual através da inteligência artificial desenvolvida pela BrandPlot. Em caso de dúvidas, entre em contato com a nossa equipe.
              </p>
            </motion.div>

            {/* Botão de download */}
            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="flex justify-center pt-4"
            >
              <Button asChild className="bg-[#c8b79e] hover:bg-[#d0c0a8] text-[#1a1814] border-0 px-8 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl">
                <Link href="/download" className="flex items-center gap-2">
                  Download do plano completo
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </motion.div> */}
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  )
}
