"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { Pacifico } from "next/font/google"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BrandplotCache } from "@/lib/brandplot-cache"
import { AuthManager } from "@/lib/auth-utils"
import { useState, useEffect } from "react"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

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

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    companyName: "",
    phone: "",
  })

  // Check URL parameters to determine initial mode and auto-populate form
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const mode = urlParams.get('mode')
      const company = urlParams.get('company')
      const contact = urlParams.get('contact')
      
      if (mode === 'register') {
        setIsLogin(false)
        
        // Auto-populate form with data from URL parameters
        if (company || contact) {
          const contactData = contact ? contact.split(',').map(item => item.trim()) : []
          const email = contactData.find(item => item.includes('@')) || ''
          const phone = contactData.find(item => /^\+?[\d\s\-()]+$/.test(item)) || ''
          
          setFormData(prev => ({
            ...prev,
            companyName: company || '',
            email: email,
            phone: phone
          }))
        }
      }      if (!company && !contact) {
        try {
          const cached = BrandplotCache.get()
          if (cached) {
            const contactInfo = cached.contact
              ? JSON.parse(cached.contact)
              : {}
            setFormData(prev => ({
              ...prev,
              companyName: cached.companyName || prev.companyName,
              email: contactInfo.email || prev.email,
              phone: contactInfo.phone || prev.phone,
            }))
          }
        } catch {}
      }
    }
  }, [])

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (isLogin) {
      handleLogin()
      return
    }

    async function register() {
      let cached: any = null
      try {
        cached = BrandplotCache.get()
      } catch {}

      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formData, cachedData: cached }),
        })
        const result = await response.json()
        console.log("Registro", result)
        if (response.ok) {
          router.push("/dashboard")
        }
      } catch (err) {
        console.error("Erro ao registrar", err)
      }
    }    register()
  }
  async function handleLogin() {
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: formData.email,
          password: formData.password 
        }),
      })
      
      const result = await response.json()
        if (response.ok) {
        console.log("Login realizado com sucesso:", result.user)
        
        // Usa o AuthManager para salvar dados do usuário com controle de timestamp
        AuthManager.setUser(result.user)
        
        // Salva o idUnico no cache para compatibilidade com o dashboard
        if (result.user.idUnico) {
          // Também atualiza o BrandplotCache
          BrandplotCache.set({
            idUnico: result.user.idUnico,
            companyName: result.user.company || "Empresa",
            diagnostico: "",
            answers: []
          })
        }
        
        router.push("/dashboard")
      } else {
        setError(result.error || "Erro ao fazer login")
      }
    } catch (err) {
      console.error("Erro ao fazer login:", err)
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }
  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError("")
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      companyName: "",
      phone: "",
    })
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
                {isLogin ? "Bem-vindo de volta" : "Criar conta"}
              </span>
            </h1>

            <p className="text-white/60 text-sm">
              {isLogin ? "Entre na sua conta para continuar" : "Junte-se à nossa comunidade de marcas"}
            </p>
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
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#c8b79e]/50 focus:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm"
                      placeholder="Digite seu nome completo"
                      required={!isLogin}
                    />

                    <div className="mt-4">
                      <label htmlFor="companyName" className="block text-sm font-medium text-white/80 mb-2">
                        Nome da empresa
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#c8b79e]/50 focus:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm"
                        placeholder="Digite o nome da sua empresa"
                        required={!isLogin}
                      />
                    </div>

                    <div className="mt-4">
                      <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-2">
                        Telefone de contato
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#c8b79e]/50 focus:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm"
                        placeholder="Digite seu telefone (ex: (11) 99999-9999)"
                        required={!isLogin}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#c8b79e]/50 focus:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm"
                  placeholder="Digite seu e-mail"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#c8b79e]/50 focus:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm"
                    placeholder="Digite sua senha"
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
              </div>

              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                      Confirmar senha
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 pr-12 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#c8b79e]/50 focus:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm"
                        placeholder="Confirme sua senha"
                        required={!isLogin}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>              {isLogin && (
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm text-[#c8b79e] hover:text-[#d0c0a8] transition-colors">
                    Esqueci minha senha
                  </Link>
                </div>              )}

              {error && (
                <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {error}
                </div>
              )}              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative px-8 py-4 bg-gradient-to-r from-[#c8b79e] to-[#b09e85] hover:from-[#d0c0a8] hover:to-[#c8b79e] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[#1a1814]/40 hover:shadow-xl hover:shadow-[#1a1814]/50 hover:scale-105 border border-[#c8b79e]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="relative z-10">
                  {isLoading ? "Carregando..." : (isLogin ? "Entrar" : "Criar conta")}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              </button>
            </form>

            {/* <div className="mt-6 text-center">
              <span className="text-white/60 text-sm">{isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}</span>
              <button
                onClick={toggleMode}
                className="ml-2 text-[#c8b79e] hover:text-[#d0c0a8] transition-colors text-sm font-medium"
              >
                {isLogin ? "Cadastre-se" : "Faça login"}
              </button>
            </div> */}
          </motion.div>

          {/* Back to home */}
          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mt-8 text-center"
          >
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white/80 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
