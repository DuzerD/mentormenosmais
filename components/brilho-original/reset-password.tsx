"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Pacifico } from "next/font/google"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"

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

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidatingToken, setIsValidatingToken] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
  })

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

  // Validar token na montagem do componente
  useEffect(() => {
    const validateToken = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setError("Token de redefinição não encontrado")
        setIsValidatingToken(false)
        return
      }

      try {
        const response = await fetch('/api/reset-password', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          setIsTokenValid(true)
        } else {
          const data = await response.json()
          setError(data.error || "Token inválido ou expirado")
        }
      } catch (error) {
        setError("Erro ao validar token. Tente novamente.")
      } finally {
        setIsValidatingToken(false)
      }
    }

    validateToken()
  }, [searchParams])

  // Validação da força da senha
  useEffect(() => {
    const password = formData.password
    if (!password) {
      setPasswordStrength({ score: 0, feedback: "" })
      return
    }

    let score = 0
    let feedback = ""

    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[a-z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    switch (score) {
      case 0:
      case 1:
        feedback = "Muito fraca"
        break
      case 2:
        feedback = "Fraca"
        break
      case 3:
        feedback = "Média"
        break
      case 4:
        feedback = "Forte"
        break
      case 5:
        feedback = "Muito forte"
        break
    }

    setPasswordStrength({ score, feedback })
  }, [formData.password])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError("")
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validações
    if (formData.password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    if (passwordStrength.score < 3) {
      setError("Por favor, escolha uma senha mais forte")
      return
    }

    const token = searchParams.get('token')
    if (!token) {
      setError("Token de redefinição não encontrado")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        setIsSuccess(true)
      } else {
        setError(data.error || "Erro ao redefinir senha. Tente novamente.")
      }
    } catch (error) {
      setError("Erro ao redefinir senha. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return "bg-red-500"
      case 2:
        return "bg-orange-500"
      case 3:
        return "bg-yellow-500"
      case 4:
        return "bg-green-500"
      case 5:
        return "bg-green-600"
      default:
        return "bg-gray-500"
    }  }

  // Tela de carregamento para validação de token
  if (isValidatingToken) {
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
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full"
                />
              </div>

              <h1 className="text-2xl font-bold text-white mb-4">Validando token...</h1>
              <p className="text-white/70">
                Aguarde enquanto verificamos a validade do seu link de redefinição.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Tela de erro para token inválido
  if (!isTokenValid) {
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
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>

              <h1 className="text-2xl font-bold text-white mb-4">Link inválido</h1>
              <p className="text-white/70 mb-8">
                {error || "Este link de redefinição de senha é inválido ou já expirou. Solicite um novo link."}
              </p>

              <div className="space-y-4">
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#c8b79e] to-[#b09e85] hover:from-[#d0c0a8] hover:to-[#c8b79e] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[#1a1814]/40 hover:shadow-xl hover:shadow-[#1a1814]/50 hover:scale-105 border border-[#c8b79e]/30"
                >
                  Solicitar novo link
                </Link>
                
                <div>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-white/60 hover:text-white/80 transition-colors text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao login
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
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
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>

              <h1 className="text-2xl font-bold text-white mb-4">Senha redefinida com sucesso!</h1>
              <p className="text-white/70 mb-8">
                Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
              </p>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#c8b79e] to-[#b09e85] hover:from-[#d0c0a8] hover:to-[#c8b79e] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[#1a1814]/40 hover:shadow-xl hover:shadow-[#1a1814]/50 hover:scale-105 border border-[#c8b79e]/30"
              >
                Fazer login
              </Link>
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
                Redefinir senha
              </span>
            </h1>

            <p className="text-white/60 text-sm">Crie uma nova senha segura para sua conta</p>
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
              {/* Nova senha */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#c8b79e]/50 focus:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm"
                    placeholder="Digite sua nova senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Indicador de força da senha */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full transition-all duration-300", getPasswordStrengthColor())}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/60">{passwordStrength.feedback}</span>
                    </div>
                    <p className="text-xs text-white/50">
                      Use pelo menos 8 caracteres com letras maiúsculas, minúsculas, números e símbolos
                    </p>
                  </div>
                )}
              </div>

              {/* Confirmar senha */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#c8b79e]/50 focus:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm"
                    placeholder="Confirme sua nova senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Validação de confirmação */}
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>As senhas não coincidem</span>
                  </div>
                )}

                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>As senhas coincidem</span>
                  </div>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || formData.password !== formData.confirmPassword || passwordStrength.score < 3}
                className="w-full group relative px-8 py-4 bg-gradient-to-r from-[#c8b79e] to-[#b09e85] hover:from-[#d0c0a8] hover:to-[#c8b79e] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[#1a1814]/40 hover:shadow-xl hover:shadow-[#1a1814]/50 hover:scale-105 border border-[#c8b79e]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="relative z-10">{isLoading ? "Redefinindo..." : "Redefinir senha"}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              </button>
            </form>
          </motion.div>

          {/* Back to login */}
          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mt-8 text-center"
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white/80 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao login
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
