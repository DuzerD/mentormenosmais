"use client"

import type React from "react"

import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useState } from "react"

interface QuestionStepProps {
  questionNumber: number
  question: string
  answer: string
  setAnswer: (value: string) => void
  onNext: () => void
  onBack: () => void
  isLast: boolean
}

export default function QuestionStep({
  questionNumber,
  question,
  answer,
  setAnswer,
  onNext,
  onBack,
  isLast,
}: QuestionStepProps) {
  const [isTyping, setIsTyping] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnswer(e.target.value)
    setIsTyping(true)
  }

  const handleInputBlur = () => {
    setIsTyping(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <div className="relative z-10 container mx-auto px-4 md:px-6 min-h-screen flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/40">
              Pergunta {questionNumber} de {9}
            </span>
            <span className="text-sm text-white/40">{Math.round((questionNumber / 9) * 100)}% completo</span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#c8b79e] to-[#b09e85]"
              initial={{ width: `${((questionNumber - 1) / 9) * 100}%` }}
              animate={{ width: `${(questionNumber / 9) * 100}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 md:p-8 shadow-xl"
        >
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6">{question}</h2>

            <div className="mb-6">
              <textarea
                value={answer}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#c8b79e]/50 focus:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm resize-none"
                placeholder="Digite sua resposta aqui..."
                rows={5}
                autoFocus
              />
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-white/60 hover:text-white hover:border-white/20 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <motion.button
                type="submit"
                className="group relative px-6 py-3 bg-gradient-to-r from-[#c8b79e] to-[#b09e85] hover:from-[#d0c0a8] hover:to-[#c8b79e] text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-[#1a1814]/40 hover:shadow-xl hover:shadow-[#1a1814]/50 hover:scale-105 border border-[#c8b79e]/30 flex items-center gap-2"
                animate={
                  isTyping
                    ? {
                        scale: [1, 1.03, 1],
                        transition: { duration: 0.6, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
                      }
                    : {}
                }
              >
                <span>{isLast ? "Finalizar" : "Próximo"}</span>
                <ArrowRight className="w-4 h-4" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
