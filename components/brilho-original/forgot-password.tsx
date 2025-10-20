"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Pacifico } from "next/font/google"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Clock } from "lucide-react"

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
})

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
}: {
  className?: string
  delay?: number
  width?: number
  height?: number
  rotate?: number
  gradient?: string
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -150,
        rotate: rotate - 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{
          y: [0, 15, 0],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{
          width,
          height,
        }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-white/[0.15]",
            "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]",
          )}
        />
      </motion.div>
    </motion.div>
  )
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [canResend, setCanResend] = useState(true)
  const [countdown, setCountdown] = useState(0)

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const startCountdown = () => {
    setCanResend(false)
    setCountdown(60)

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Por favor, digite seu e-mail")
      return
    }

    if (!validateEmail(email)) {
      setError("Por favor, digite um e-mail válido")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao enviar e-mail. Tente novamente.")
        return
      }

      setIsSuccess(true)
      startCountdown()
    } catch (error) {
      console.error("Error sending reset email:", error)
      setError("Erro ao enviar e-mail. Verifique sua conexão e tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = () => {
    if (canResend) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent)
    }
  }

  if (isSuccess) {
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
        </div>

        <div className="relative z-10 container mx-auto px-4 md:px-6 min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-md mx-auto w-full text-center"
          >
            <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-xl">
              <div className="w-16 h-16 bg-[#c8b79e]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-[#c8b79e]" />
              </div>

              <h1 className="text-2xl font-bold text-white mb-4">E-mail enviado!</h1>
              <p className="text-white/70 mb-2">Enviamos um link de redefinição de senha para:</p>
              <p className="text-[#c8b79e] font-medium mb-6">{email}</p>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-amber-200 text-sm font-medium mb-1">Importante:</p>
                    <p className="text-amber-100/80 text-sm">
                      O link expira em 15 minutos. Verifique também sua caixa de spam.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleResend}
                  disabled={!canResend}
                  className="w-full px-6 py-3 border border-[#c8b79e]/50 text-[#c8b79e] hover:bg-[#c8b79e]/10 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {canResend ? "Reenviar e-mail" : `Reenviar em ${countdown}s`}
                </button>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#c8b79e] to-[#b09e85] hover:from-[#d0c0a8] hover:to-[#c8b79e] text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-[#1a1814]/40 hover:shadow-xl hover:shadow-[#1a1814]/50 hover:scale-105 border border-[#c8b79e]/30"
                >
                  Voltar ao login
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

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

        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-amber-500/[0.15]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />

        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-amber-400/[0.15]"
          className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto w-full">
          {/* Header */}
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6">
              <Image
                src="/images/brilho-original-logo.png"
                alt="BrandPlot"
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="text-sm text-white/60 tracking-wide">BrandPlot</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                Esqueceu sua senha?
              </span>
            </h1>

            <p className="text-white/60 text-sm">Digite seu e-mail e enviaremos um link para redefinir sua senha</p>
          </motion.div>

          {/* Form */}
          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError("")
                    }}
                    className="w-full px-4 py-3 pl-12 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#c8b79e]/50 focus:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm"
                    placeholder="Digite seu e-mail"
                    required
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Info box */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-blue-200 text-sm font-medium mb-1">Como funciona:</p>
                    <ul className="text-blue-100/80 text-sm space-y-1">
                      <li>• Você receberá um e-mail com um link seguro</li>
                      <li>• O link expira em 15 minutos</li>
                      <li>• Clique no link para criar uma nova senha</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full group relative px-8 py-4 bg-gradient-to-r from-[#c8b79e] to-[#b09e85] hover:from-[#d0c0a8] hover:to-[#c8b79e] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[#1a1814]/40 hover:shadow-xl hover:shadow-[#1a1814]/50 hover:scale-105 border border-[#c8b79e]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Enviar link de redefinição
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-white/60 text-sm">Lembrou da senha?</span>
              <Link
                href="/login"
                className="ml-2 text-[#c8b79e] hover:text-[#d0c0a8] transition-colors text-sm font-medium"
              >
                Fazer login
              </Link>
            </div>
          </motion.div>

          {/* Back to home */}
          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mt-8 text-center"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white/80 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
