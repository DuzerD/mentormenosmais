"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { MessageCircle } from "lucide-react"
import Image from "next/image"
import { BrandplotCache } from "@/lib/brandplot-cache"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import ScoreCounter from "@/components/ScoreCounter"

interface ResultsDisplayProps {
  analysis: string
  companyName?: string
  contactData?: string
}

export default function ResultsDisplay({ 
  analysis, 
  companyName = "Sua Marca", 
  contactData = "" 
}: ResultsDisplayProps) {
  const [score, setScore] = useState(0)
  const [markdownContent, setMarkdownContent] = useState("")

  useEffect(() => {
    if (analysis) {
      // First try to get score from cache
      let scoreValue = 0
      const cachedData = BrandplotCache.get()
      if (cachedData?.scoreDiagnostico) {
        scoreValue = Number.parseInt(cachedData.scoreDiagnostico, 10)
        console.log("Score recuperado do cache:", scoreValue)
      } else {
        // Fallback: try to extract from analysis text
        const scoreMatch = analysis.match(/Nota de Clareza & Emoção da Marca: (\d+)\/100/)
        if (scoreMatch && scoreMatch[1]) {
          scoreValue = Number.parseInt(scoreMatch[1], 10)
          console.log("Score extraído da análise:", scoreValue)
        }
      }      if (scoreValue > 0) {
        setScore(scoreValue)
      }

      // Replace "Sua Marca" with the company name
      let personalizedAnalysis = analysis.replace(/Sua Marca/g, companyName)

      // Remove the score line as we'll display it separately
      personalizedAnalysis = personalizedAnalysis.replace(
        /🏁 Nota de Clareza & Emoção da Marca: \d+\/100\n[^\n]*\n\n/,
        "",
      );
      setMarkdownContent(personalizedAnalysis)
    }
  }, [analysis, companyName])

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      className="relative z-10 container mx-auto px-4 md:px-6 py-12 md:py-16 pb-24"
    >
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
              Diagnóstico de <span className="text-[#c8b79e] font-medium">{companyName}</span>
            </span>
          </div>          {/* Score Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col items-center justify-center mb-8"
          >
            <ScoreCounter targetScore={score} duration={2000} />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 2 }}
              className="text-white/60 text-sm mt-4"
            >
              Nota de Clareza & Emoção da Marca
            </motion.p>
          </motion.div>
        </motion.div>

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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-10 flex flex-col gap-6 justify-center items-center"
          >
            <div className="bg-gradient-to-r from-[#1C1914] to-[#553F1D] to-90% border border-[#553F1D]/30 shadow-2xl rounded-2xl p-8 md:p-10 text-center max-w-2xl w-full">
              <p className="text-2xl md:text-3xl font-extrabold text-white mb-3 drop-shadow-sm">
                Pronto para <span className="text-[#fde68a]">transformar sua marca</span> e <span className="text-[#fde68a]">atrair clientes que pagam mais?</span>
              </p>
              <p className="text-lg text-white/90 mb-8 font-medium">Dê o próximo passo e fale com um especialista para impulsionar seu negócio.</p>              
              <a
                href="https://wa.me/5511974564367?text=Olá! Quero valorizar minha marca com a BrandPlot."
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
      </div>
    </motion.div>
  )
}
