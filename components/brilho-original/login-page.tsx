"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BrandplotCache } from "@/lib/brandplot-cache"
import { AuthManager } from "@/lib/auth-utils"
import { useState, useEffect } from "react"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

  subsets: ["latin"],
  weight: ["400"],
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
              name: contactInfo.name || prev.name,
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
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#f1f6ff] via-[#e9efff] to-[#e2f2ff]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),transparent_55%)]" />

      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-sky-300/30"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />

        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-indigo-300/30"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />

        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-sky-200/25"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />

        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-indigo-200/25"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />

        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-sky-200/20"
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
            className="mb-8 text-center"
          >
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              {isLogin ? "Bem-vindo de volta" : "Criar conta"}
            </h1>

            <p className="mt-3 text-sm text-slate-600">
              {isLogin ? "Entre para continuar sua jornada com os agentes Mentoor." : "Desbloqueie as miss�es e organize a marca com a nossa IA."}
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-[0_25px_60px_rgba(15,23,42,0.15)] backdrop-blur-lg"
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
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100/60"
                      placeholder="Digite seu nome completo"
                      required={!isLogin}
                    />

                    <div className="mt-4">
                      <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-2">
                        Nome da empresa
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100/60"
                        placeholder="Digite o nome da sua empresa"
                        required={!isLogin}
                      />
                    </div>

                    <div className="mt-4">
                      <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                        Telefone de contato
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100/60"
                        placeholder="Digite seu telefone (ex: (11) 99999-9999)"
                        required={!isLogin}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100/60"
                  placeholder="Digite seu e-mail"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100/60"
                    placeholder="Digite sua senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-500 transition-colors"
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
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                      Confirmar senha
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100/60"
                        placeholder="Confirme sua senha"
                        required={!isLogin}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-500 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {isLogin && (
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm text-sky-600 hover:text-sky-500 transition-colors">
                    Esqueci minha senha
                  </Link>
                </div>
              )}

              {error && (
                <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p>{error}</p>
                  {error.toLowerCase().includes("pagamento") && (
                    <p className="mt-1 text-xs text-red-200/80">
                      Se o pagamento já foi aprovado, aguarde alguns minutos ou contate suporte@menosmais.app com o comprovante.
                    </p>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-r from-sky-500 to-indigo-500 px-8 py-4 text-base font-semibold text-white shadow-[0_20px_45px_rgba(37,99,235,0.35)] transition-all duration-300 hover:from-sky-400 hover:to-indigo-400 hover:shadow-[0_24px_52px_rgba(37,99,235,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="relative z-10">
                  {isLoading ? "Carregando..." : (isLogin ? "Entrar" : "Criar conta")}
                </span>
                <div className="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-500 group-hover:translate-y-0" />
              </button>
            </form>

            {/* <div className="mt-6 text-center">
              <span className="text-slate-500 text-sm">{isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}</span>
              <button
                onClick={toggleMode}
                className="ml-2 text-sky-600 hover:text-sky-500 transition-colors text-sm font-medium"
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
              className="inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-slate-700 text-sm"
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
