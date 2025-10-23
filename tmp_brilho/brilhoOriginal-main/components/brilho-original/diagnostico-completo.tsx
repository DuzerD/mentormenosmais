"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Award, ArrowLeft, MessageCircle, Target, Users, Eye, Lightbulb, TrendingUp, CheckCircle, AlertTriangle, Zap } from "lucide-react"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import ScoreCounter from "../ScoreCounter"
import { AuthManager } from "@/lib/auth-utils"

interface BrandData {
  nome_empresa: string | null
  idUnico: string
  resposta_1: string | null
  resposta_2: string | null
  resposta_3: string | null
  resposta_4: string | null
  resposta_5: string | null
  resposta_6: string | null
  resposta_7: string | null
  resposta_8: string | null
  telefone: string | null
  email: string | null
  scoreDiagnostico: string | null
  diagnostico?: string | null
  contexto: string | null
  parsedDiagnostico?: DiagnosticoJSON | null
}

interface DiagnosticoJSON {
  score_interno: number
  score_ui: number
  diagnostico: {
    essencia: string
    promessa_central: string
    publico_ideal_vs_atual: string
    percepcao_atual: string
    insight_reposicionamento: string
  }
  proximos_passos: Array<{
    acao: string
    impacto: "Alto" | "Médio" | "Baixo"
    esforco: "Alto" | "Médio" | "Baixo"
  }>
  bio_instagram: string
  checklist_30_dias: {
    semana1: string
    semana2: string
    semana3: string
    semana4: string
  }
}

interface DiagnosticoCompletoProps {
  brandData: BrandData
  onBack: () => void
}

export default function DiagnosticoCompleto({ brandData, onBack }: DiagnosticoCompletoProps) {
  const [score, setScore] = useState(0)
  const [markdownContent, setMarkdownContent] = useState("")
  const [analysis, setAnalysis] = useState("")
  const [parsedDiagnostico, setParsedDiagnostico] = useState<DiagnosticoJSON | null>(null)
  const [isLoggedUser, setIsLoggedUser] = useState(false)

  const companyName = brandData.nome_empresa || "Sua Marca"
  
  // Verificar se é usuário logado ou do onboarding
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = AuthManager.getUser()
      setIsLoggedUser(!!user?.idUnico)
    }
  }, [])
  const contactData = JSON.stringify({
    phone: brandData.telefone,
    email: brandData.email
  })
  // Função para gerar dados de mock quando não há diagnóstico
  const getMockDiagnostico = (): DiagnosticoJSON => {
    return {
      score_interno: 78,
      score_ui: 78,
      diagnostico: {
        essencia: `${companyName} representa inovação e excelência no seu segmento. Sua marca nasceu da necessidade de oferecer soluções diferenciadas, combinando qualidade premium com atendimento personalizado. A essência da marca está na capacidade de transformar a experiência do cliente, criando conexões emocionais duradouras.`,
        promessa_central: `Prometemos entregar não apenas um produto ou serviço, mas uma experiência completa que supera expectativas. Nossa promessa é ser o parceiro confiável que ${companyName.toLowerCase()} representa para seus clientes, oferecendo soluções que realmente fazem a diferença no dia a dia.`,
        publico_ideal_vs_atual: `Seu público ideal são pessoas que valorizam qualidade e estão dispostas a investir em soluções premium. Atualmente, você atende um mix de clientes, mas há oportunidade de focar mais no segmento que realmente valoriza seu diferencial. O alinhamento entre público ideal e atual pode ser otimizado através de comunicação mais direcionada.`,
        percepcao_atual: `Sua marca é percebida como confiável e de qualidade, mas ainda há espaço para fortalecer a percepção de inovação e exclusividade. Os clientes reconhecem seu profissionalismo, porém a diferenciação competitiva pode ser mais clara na comunicação externa.`,
        insight_reposicionamento: `O principal insight é posicionar ${companyName} como a escolha premium para quem busca excelência. Focar na expertise única e nos resultados excepcionais que você entrega, criando uma narrativa de transformação e sucesso para seus clientes.`
      },
      proximos_passos: [
        {
          acao: "Revisar e padronizar a comunicação visual em todas as plataformas",
          impacto: "Alto",
          esforco: "Médio"
        },
        {
          acao: "Criar conteúdos que demonstrem expertise e casos de sucesso",
          impacto: "Alto",
          esforco: "Baixo"
        },
        {
          acao: "Implementar estratégia de posicionamento premium nas redes sociais",
          impacto: "Médio",
          esforco: "Baixo"
        },
        {
          acao: "Desenvolver materiais de apresentação institucional atualizados",
          impacto: "Médio",
          esforco: "Médio"
        },
        {
          acao: "Estabelecer parcerias estratégicas para ampliar alcance",
          impacto: "Alto",
          esforco: "Alto"
        }
      ],
      bio_instagram: `✨ ${companyName} | Transformando experiências com excelência | 🎯 Soluções premium para quem busca o melhor | 📧 contato@${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      checklist_30_dias: {
        semana1: "Auditoria completa da comunicação atual - revisar site, redes sociais e materiais de divulgação",
        semana2: "Implementar nova identidade visual e padronizar comunicação em todas as plataformas",
        semana3: "Lançar campanha de conteúdo focada no novo posicionamento com cases de sucesso",
        semana4: "Monitorar resultados, coletar feedback e ajustar estratégias conforme necessário"
      }
    }
  }

  // Gerar análise de exemplo caso não tenha uma análise salva
  const getSampleAnalysis = () => {
    return `🧭 Diagnóstico Profundo da Marca — ${companyName}

🏁 Nota de Clareza & Emoção da Marca: ${brandData.scoreDiagnostico || '75'}/100
Sua marca demonstra potencial significativo, mas ainda há oportunidades para maior clareza na comunicação e conexão emocional mais profunda com o público-alvo.

## 🔍 Diagnóstico da Marca Atual

### 🎯 Essência da Marca
${brandData.resposta_1 ? `Com base na sua motivação: "${brandData.resposta_1}", sua marca nasceu de uma necessidade genuína do mercado.` : 'Sua marca tem uma proposta de valor clara, mas pode ser comunicada de forma mais impactante.'}

### 🗣️ Tom de Voz
${brandData.resposta_2 ? `Sua marca se comunica de forma ${brandData.resposta_2}. Isso cria uma personalidade única que pode ser ainda mais explorada.` : 'O tom de voz da sua marca precisa ser mais bem definido para criar conexão emocional.'}

### 🎯 Diferencial Competitivo
${brandData.resposta_3 ? `Seu principal diferencial: "${brandData.resposta_3}". Esse é um ponto forte que deve ser amplificado em toda comunicação.` : 'O diferencial da sua marca precisa ser mais claramente comunicado no mercado.'}

### 👥 Público-Alvo
${brandData.resposta_4 ? `Cliente ideal: ${brandData.resposta_4}` : 'O público-alvo precisa ser melhor definido.'}
${brandData.resposta_5 ? `\\nAtualmente atende: ${brandData.resposta_5}` : ''}
${brandData.resposta_4 && brandData.resposta_5 ? '\\n\\nExiste um alinhamento entre público ideal e atual que pode ser otimizado.' : ''}

### 📍 Percepção Desejada vs. Atual
${brandData.resposta_6 ? `Você deseja que sua marca seja percebida como: "${brandData.resposta_6}". Esta percepção pode ser fortalecida através de estratégias específicas de comunicação.` : 'A percepção desejada da marca precisa ser melhor definida.'}

### 🎯 Propósito Central
${brandData.resposta_7 ? `"Minha marca existe para que as pessoas possam finalmente ${brandData.resposta_7}". Este propósito é o coração da sua marca e deve guiar todas as decisões de comunicação.` : 'O propósito da marca precisa ser claramente articulado.'}`
  }
    useEffect(() => {
    // Se não há diagnóstico real, usar dados de mock para demonstração
    if (!brandData.diagnostico || brandData.diagnostico.trim() === '') {      const mockData = getMockDiagnostico()
      setParsedDiagnostico(mockData)
      setAnalysis("MOCK_DATA") // Flag especial para indicar dados de teste
      setScore(mockData.score_ui)
      
      return
    }

    // Usar análise salva
    const currentAnalysis = brandData.diagnostico
    setAnalysis(currentAnalysis)

    if (currentAnalysis) {
      let diagnosticoData: DiagnosticoJSON | null = null
      let scoreValue = 0
      let finalMarkdownContent = ""

      // Tentar fazer parse do JSON se a análise parece ser JSON
      try {
        if (currentAnalysis.trim().startsWith("{")) {
          diagnosticoData = JSON.parse(currentAnalysis)
          setParsedDiagnostico(diagnosticoData)
          console.log("Diagnóstico JSON detectado:", diagnosticoData)
        }
      } catch (parseError) {
        console.log("Não foi possível fazer parse como JSON, usando formato texto:", parseError)
      }

      // Se temos dados estruturados em JSON, usar eles
      if (diagnosticoData) {
        scoreValue =  diagnosticoData.score_interno || 0
        finalMarkdownContent = "" // Não usamos markdown para dados estruturados
      } else {
        // Usar lógica antiga para análises em texto
        const scoreMatch = currentAnalysis.match(/Nota de Clareza & Emoção da Marca: (\d+)\/100/)
        if (scoreMatch && scoreMatch[1]) {
          scoreValue = Number.parseInt(scoreMatch[1], 10)
        } else if (brandData.scoreDiagnostico) {
          scoreValue = Number.parseInt(brandData.scoreDiagnostico, 10)
        }

        // Replace "Sua Marca" with the company name
        let personalizedAnalysis = currentAnalysis.replace(/Sua Marca/g, companyName)

        // Remove the score line as we'll display it separately
        personalizedAnalysis = personalizedAnalysis.replace(
          /🏁 Nota de Clareza & Emoção da Marca: \d+\/100\n[^\n]*\n\n/,
          "",
        )

        finalMarkdownContent = personalizedAnalysis
      }      // Set score and animate
      setScore(scoreValue)
      setMarkdownContent(finalMarkdownContent)
    }
  }, [brandData, companyName])

  // Função para obter cor do badge baseado no nível
  const getBadgeColor = (nivel: string) => {
    switch (nivel.toLowerCase()) {
      case 'alto':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'médio':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'baixo':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  // Função para obter ícone baseado no nível
  const getBadgeIcon = (nivel: string) => {
    switch (nivel.toLowerCase()) {
      case 'alto':
        return <AlertTriangle className="w-3 h-3" />
      case 'médio':
        return <Zap className="w-3 h-3" />
      case 'baixo':
        return <CheckCircle className="w-3 h-3" />
      default:
        return null
    }
  }

  return (
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
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">
              {isLoggedUser ? 'Voltar ao Dashboard' : 'Voltar à Página Inicial'}
            </span>
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
                Diagnóstico Completo de <span className="text-[#c8b79e] font-medium">{companyName}</span>
              </span>
            </div>            {/* Score Display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col items-center justify-center mb-8"
            >
              <div className="relative mb-4">
                <Award className="w-8 h-8 text-[#c8b79e] absolute -top-6 left-1/2 transform -translate-x-1/2 z-10" />
                <ScoreCounter targetScore={score} duration={2500} />
              </div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 2 }}
                className="text-white/60 text-sm"
              >
                Nota de Clareza & Emoção da Marca
              </motion.p>
            </motion.div></motion.div>          <div className="space-y-8">
            {/* Cards de Diagnóstico */}
            {parsedDiagnostico ? (
              <>
                {/* Grade de Cards do Diagnóstico - Layout em Grid com Cards Maiores e Legíveis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card: Essência da Marca */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl h-auto min-h-[280px] flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 flex items-center justify-center border border-amber-500/30">
                        <Target className="w-6 h-6 text-amber-400" />
                      </div>
                      <h2 className="text-lg md:text-xl font-bold text-white">Essência da Marca</h2>
                    </div>
                    <div className="flex-1">
                      <p className="text-white/80 leading-relaxed text-sm md:text-base">
                        {parsedDiagnostico.diagnostico.essencia}
                      </p>
                    </div>
                  </motion.div>

                  {/* Card: Promessa Central */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl h-auto min-h-[280px] flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 flex items-center justify-center border border-blue-500/30">
                        <TrendingUp className="w-6 h-6 text-blue-400" />
                      </div>
                      <h2 className="text-lg md:text-xl font-bold text-white">Promessa Central</h2>
                    </div>
                    <div className="flex-1">
                      <p className="text-white/80 leading-relaxed text-sm md:text-base">
                        {parsedDiagnostico.diagnostico.promessa_central}
                      </p>
                    </div>
                  </motion.div>

                  {/* Card: Público Ideal vs Atual */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl h-auto min-h-[280px] flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/20 to-purple-600/20 flex items-center justify-center border border-purple-500/30">
                        <Users className="w-6 h-6 text-purple-400" />
                      </div>
                      <h2 className="text-lg md:text-xl font-bold text-white">Público Ideal vs Atual</h2>
                    </div>
                    <div className="flex-1">
                      <p className="text-white/80 leading-relaxed text-sm md:text-base">
                        {parsedDiagnostico.diagnostico.publico_ideal_vs_atual}
                      </p>
                    </div>
                  </motion.div>

                  {/* Card: Percepção Atual */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl h-auto min-h-[280px] flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500/20 to-green-600/20 flex items-center justify-center border border-green-500/30">
                        <Eye className="w-6 h-6 text-green-400" />
                      </div>
                      <h2 className="text-lg md:text-xl font-bold text-white">Percepção Atual</h2>
                    </div>
                    <div className="flex-1">
                      <p className="text-white/80 leading-relaxed text-sm md:text-base">
                        {parsedDiagnostico.diagnostico.percepcao_atual}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Card: Insight de Reposicionamento - Largura Total */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 flex items-center justify-center border border-orange-500/30">
                      <Lightbulb className="w-6 h-6 text-orange-400" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-white">Insight de Reposicionamento</h2>
                  </div>
                  <p className="text-white/80 leading-relaxed text-sm md:text-base">
                    {parsedDiagnostico.diagnostico.insight_reposicionamento}
                  </p>
                </motion.div>{/* Seção: Próximos Passos */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="bg-gradient-to-br from-[#c8b79e]/[0.15] to-[#c8b79e]/[0.05] backdrop-blur-sm border border-[#c8b79e]/20 rounded-2xl p-6 md:p-8 shadow-xl"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#c8b79e]/30 to-[#c8b79e]/20 flex items-center justify-center border border-[#c8b79e]/40">
                      <TrendingUp className="w-6 h-6 text-[#c8b79e]" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Próximos Passos</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {parsedDiagnostico.proximos_passos.map((passo, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                        className="bg-white/[0.05] rounded-xl p-3 md:p-6 border border-white/10 min-h-[120px] flex flex-col"
                      >
                        <div className="flex-1 flex flex-col justify-between">
                          <h3 className="text-white font-semibold text-xs md:text-sm mb-0 leading-tight">
                            {index + 1}. {passo.acao}
                          </h3>
                          <div className="flex flex-col gap-px mt-[-2px]">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getBadgeColor(passo.impacto)} self-start`}>
                              {getBadgeIcon(passo.impacto)}
                              Impacto: {passo.impacto}
                            </div>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getBadgeColor(passo.esforco)} self-start`}>
                              {getBadgeIcon(passo.esforco)}
                              Esforço: {passo.esforco}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Card: Bio Instagram */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  className="bg-gradient-to-br from-pink-500/[0.1] to-pink-600/[0.05] backdrop-blur-sm border border-pink-500/20 rounded-2xl p-6 md:p-8 shadow-xl"
                >
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    📱 Bio Instagram Sugerida
                  </h2>
                  <div className="bg-white/[0.05] rounded-lg p-4 border border-white/10">
                    <p className="text-white/90 italic text-sm md:text-base">
                      "{parsedDiagnostico.bio_instagram}"
                    </p>
                  </div>
                </motion.div>

                {/* Card: Checklist 30 Dias */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4, duration: 0.6 }}
                  className="bg-gradient-to-br from-indigo-500/[0.1] to-indigo-600/[0.05] backdrop-blur-sm border border-indigo-500/20 rounded-2xl p-6 md:p-8 shadow-xl"
                >
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    📅 Checklist 30 Dias
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-white/[0.05] rounded-lg p-4 border border-white/10">
                      <h3 className="text-white font-semibold mb-2">Semana 1</h3>
                      <p className="text-white/80 text-sm">{parsedDiagnostico.checklist_30_dias.semana1}</p>
                    </div>
                    <div className="bg-white/[0.05] rounded-lg p-4 border border-white/10">
                      <h3 className="text-white font-semibold mb-2">Semana 2</h3>
                      <p className="text-white/80 text-sm">{parsedDiagnostico.checklist_30_dias.semana2}</p>
                    </div>
                    <div className="bg-white/[0.05] rounded-lg p-4 border border-white/10">
                      <h3 className="text-white font-semibold mb-2">Semana 3</h3>
                      <p className="text-white/80 text-sm">{parsedDiagnostico.checklist_30_dias.semana3}</p>
                    </div>
                    <div className="bg-white/[0.05] rounded-lg p-4 border border-white/10">
                      <h3 className="text-white font-semibold mb-2">Semana 4</h3>
                      <p className="text-white/80 text-sm">{parsedDiagnostico.checklist_30_dias.semana4}</p>
                    </div>
                  </div>
                </motion.div>
              </>
            ) : (
              /* Fallback para análises em texto markdown */
              <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
                <div className="markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1 className="text-xl sm:text-2xl font-bold mb-4 text-white text-center" {...props} />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 className="text-lg sm:text-xl font-bold mb-3 text-white mt-6" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-base sm:text-lg font-semibold mb-2 text-white mt-4" {...props} />
                      ),
                      p: ({ node, ...props }) => (
                        <p className="text-sm sm:text-base text-white/80 mb-4 leading-relaxed" {...props} />
                      ),
                      strong: ({ node, ...props }) => <strong className="text-white font-semibold" {...props} />,
                      em: ({ node, ...props }) => <em className="text-white/90 italic" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 text-white/80" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 text-white/80" {...props} />,
                      li: ({ node, ...props }) => <li className="mb-1 text-sm sm:text-base" {...props} />,
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-[#c8b79e]/50 pl-4 italic text-white/70 my-4" {...props} />
                      ),
                    }}
                  >
                    {markdownContent}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Call-to-action para WhatsApp */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.6 }}
            className="mt-10 flex flex-col gap-6 justify-center items-center"
          >
            <div className="bg-gradient-to-r from-[#1C1914] to-[#553F1D] to-90% border border-[#553F1D]/30 shadow-2xl rounded-2xl p-8 md:p-10 text-center max-w-2xl w-full">
              <p className="text-2xl md:text-3xl font-extrabold text-white mb-3 drop-shadow-sm">
                Pronto para <span className="text-[#fde68a]">transformar sua marca</span> e <span className="text-[#fde68a]">atrair clientes que pagam mais?</span>
              </p>
              <p className="text-lg text-white/90 mb-8 font-medium">Dê o próximo passo e fale com um especialista para impulsionar seu negócio.</p>              
              <a
                href={`https://wa.me/5511974564367?text=Olá! Acabei de ver meu diagnóstico completo da ${companyName} e quero valorizar minha marca com a BrandPlot.`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-green-500 via-green-600 to-green-500 hover:from-green-600 hover:to-green-500 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-xl hover:scale-105 border-2 border-green-400/40 focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <MessageCircle className="w-6 h-6 text-white" />
                Quero valorizar minha marca
              </a>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
