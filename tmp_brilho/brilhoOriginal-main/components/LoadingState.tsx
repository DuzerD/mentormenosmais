"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import ElegantShape from "./ElegantShape"

interface LoadingStateProps {
  companyName: string
}

export default function LoadingState({ companyName }: LoadingStateProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1814]">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-amber-700/[0.05] blur-3xl" />

      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-amber-500/[0.15]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />

        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-amber-700/[0.15]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />

        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-amber-600/[0.15]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8"
          >
            <Image src="/images/brilho-original-logo.png" alt="BrandPlot" width={24} height={24} className="rounded-full" />
            <span className="text-sm text-white/60 tracking-wide">BrandPlot</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl md:text-3xl font-bold text-white mb-4"
          >
            Analisando sua marca
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-white/60 mb-8"
          >
            Estamos gerando um diagnóstico completo para <span className="text-[#c8b79e]">{companyName}</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden mb-8"
          >
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#c8b79e] to-[#b09e85]"
              animate={{
                width: ["0%", "30%", "60%", "100%"],
                transition: {
                  times: [0, 0.3, 0.6, 1],
                  duration: 8,
                  ease: "easeInOut",
                },
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center gap-4 bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] rounded-lg p-4">
              <div className="w-10 h-10 rounded-full bg-[#c8b79e]/20 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-5 h-5 border-2 border-[#c8b79e] border-t-transparent rounded-full"
                />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Analisando essência da marca</p>
                <p className="text-white/60 text-sm">Identificando valores centrais...</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] rounded-lg p-4">
              <div className="w-10 h-10 rounded-full bg-[#c8b79e]/20 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear", delay: 0.5 }}
                  className="w-5 h-5 border-2 border-[#c8b79e] border-t-transparent rounded-full"
                />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Avaliando posicionamento</p>
                <p className="text-white/60 text-sm">Comparando com mercado...</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] rounded-lg p-4">
              <div className="w-10 h-10 rounded-full bg-[#c8b79e]/20 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear", delay: 1 }}
                  className="w-5 h-5 border-2 border-[#c8b79e] border-t-transparent rounded-full"
                />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Gerando recomendações</p>
                <p className="text-white/60 text-sm">Criando insights personalizados...</p>
              </div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="text-white/40 text-sm mt-8"
          >
            Isso pode levar alguns segundos...
          </motion.p>
        </div>
      </div>
    </div>
  )
}
