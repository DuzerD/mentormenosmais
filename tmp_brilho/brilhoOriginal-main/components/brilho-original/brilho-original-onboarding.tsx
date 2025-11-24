"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Pacifico } from "next/font/google"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { BrandplotCache, generateIdUnico } from "@/lib/brandplot-cache"
import { useState, useEffect, useRef } from "react"
import { ChevronLeft, Upload, Loader2, Home, Mic, MicOff, Square } from "lucide-react"

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
})

const questions = [
  "Qual é o nome da sua marca?",
  "O que te motivou a criar essa marca?",
  "Se sua marca fosse uma pessoa, como ela falaria?",
  "O que sua marca entrega que outras não conseguem?",
  "Quem é o cliente ideal para você?",
  "Hoje, quem mais compra de você? (é o público ideal?)",
  "Como você gostaria que sua marca fosse percebida?",
  'Em uma frase: "Minha marca existe para que as pessoas possam finalmente __________."',
  "Envie um print da página inicial do Instagram da sua marca (com bio, feed e destaques visíveis) para que possamos criar uma nova bio ao final do diagnóstico.",
  "Informe um celular para contato (WhatsApp) ou um e-mail. Pelo menos um dos dois é obrigatório.",
]

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

function LoadingState({ companyName = "sua marca" }: { companyName?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      className="relative z-10 container mx-auto px-4 md:px-6 min-h-screen flex flex-col items-center justify-center"
    >
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8"
        >
          <Image
            src="/images/brilho-original-logo.png"
            alt="BrandPlot"
            width={20}
            height={20}
            className="rounded-full"
          />
          <span className="text-sm text-white/60 tracking-wide">Analisando suas respostas</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="relative w-24 h-24 mb-6">
            <Loader2 className="w-24 h-24 text-[#c8b79e] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-[#1a1814] flex items-center justify-center">
                <Image
                  src="/images/brilho-original-logo.png"
                  alt="BrandPlot"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </div>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">Criando seu diagnóstico</h2>
          <p className="text-white/60 max-w-md">
            Estamos analisando suas respostas e gerando um diagnóstico profundo para{" "}
            <span className="text-[#c8b79e] font-medium">{companyName}</span>. Isso pode levar alguns instantes...
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}

function QuestionStep({
  questionNumber,
  question,
  answer,
  setAnswer,
  onNext,
  onBack,
  isLast,
}: {
  questionNumber: number
  question: string
  answer: string
  setAnswer: (value: string) => void
  onNext: () => void
  onBack: () => void
  isLast: boolean
}) {
  const isFileUpload = questionNumber === 9
  const isContactStep = questionNumber === 10
  const isCompanyName = questionNumber === 1
  
  // Estado para feedback de paste
  const [pasteStatus, setPasteStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Ref para input file
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados para gravação de áudio
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Para o passo de contato, separar resposta em dois campos
  const [contact, setContact] = useState<{ phone: string; email: string }>(() => {
    if (isContactStep && answer) {
      try {
        return JSON.parse(answer)
      } catch {
        return { phone: '', email: '' }
      }
    }
    return { phone: '', email: '' }
  })

  // Validação simples de e-mail e celular
  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  function isValidPhone(phone: string) {
    return /^(\+?\d{10,15})$/.test(phone.replace(/\D/g, ''))
  }
  // Agora o celular é obrigatório, e-mail é opcional
  const isContactValid = isContactStep ? (
    contact.phone && isValidPhone(contact.phone)
  ) : true

  // Atualiza o answer do step pai
  useEffect(() => {
    if (isContactStep) {
      setAnswer(JSON.stringify(contact))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact])

  // Limpar interval quando componente desmonta
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [])

  // Função para iniciar gravação
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      
      setAudioChunks([])
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)

      // Iniciar timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data])
        }
      }

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current)
        }
      }

      recorder.start()
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
      setPasteStatus('error')
      setTimeout(() => setPasteStatus('idle'), 3000)
    }
  }

  // Função para parar gravação
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  // Função para transcrever áudio
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsTranscribing(true)
      
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.mp3')

      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Erro na transcrição')
      }

      const data = await response.json()
      
      if (data.success && data.text) {
        // Adicionar texto transcrito ao final do texto existente
        const currentText = answer.trim()
        const newText = currentText ? `${currentText} ${data.text}` : data.text
        setAnswer(newText)
        setPasteStatus('success')
      } else {
        throw new Error('Erro na transcrição')
      }
    } catch (error) {
      console.error('Erro na transcrição:', error)
      setPasteStatus('error')
    } finally {
      setIsTranscribing(false)
      setTimeout(() => setPasteStatus('idle'), 3000)
    }
  }

  // Effect para processar áudio quando gravação termina
  useEffect(() => {
    if (!isRecording && audioChunks.length > 0 && mediaRecorder?.state === 'inactive') {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      transcribeAudio(audioBlob)
      setAudioChunks([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, audioChunks, mediaRecorder?.state])

  // Função para formatar tempo de gravação
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handler para clique na área de upload
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '' // Limpa seleção anterior
      fileInputRef.current.click()
    }
  }

  // Handler para upload de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setPasteStatus('error')
      setTimeout(() => setPasteStatus('idle'), 3000)
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      const imageData = {
        name: file.name,
        base64: base64,
        type: file.type
      }
      setAnswer(JSON.stringify(imageData))
      setPasteStatus('success')
      setTimeout(() => setPasteStatus('idle'), 2000)
    }
    reader.readAsDataURL(file)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      className="relative z-10 min-h-screen flex items-center justify-center px-4"
    >
      <div className="w-full max-w-3xl mx-auto">
        {/* Progress indicator - Outside the box */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-6 flex items-center justify-between text-white/60 text-sm"
        >
          <span>Pergunta {questionNumber} de {questions.length}</span>
          <span>{Math.round((questionNumber / questions.length) * 100)}% completo</span>
        </motion.div>

        {/* Progress bar - Outside the box */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-8 w-full bg-white/[0.05] rounded-full h-1 overflow-hidden backdrop-blur-sm"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(questionNumber / questions.length) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            className="h-full bg-gradient-to-r from-[#c8b79e] to-[#d0c0a8] rounded-full"
          />
        </motion.div>

        {/* Main container - The beautiful box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] rounded-3xl p-8 md:p-12 shadow-2xl shadow-black/20"
        >
          {/* Question */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-semibold text-white leading-relaxed">
              {question}
            </h2>
          </motion.div>

          {/* Input area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mb-8"
          >
            {isFileUpload ? (
              <div className="relative">
                {/* Input file escondido */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <div
                  className="w-full min-h-[120px] border-2 border-dashed border-white/20 rounded-2xl bg-white/[0.03] backdrop-blur-sm flex flex-col items-center justify-center p-8 transition-all duration-300 hover:border-[#c8b79e]/40 hover:bg-white/[0.05] group cursor-pointer"
                  onClick={handleUploadClick}
                >
                  <Upload className="w-8 h-8 text-white/40 mb-3 group-hover:text-[#c8b79e]/60 transition-colors" />
                  <p className="text-white/60 text-center mb-2">
                    Clique para selecionar ou arraste uma imagem
                  </p>
                  <p className="text-white/40 text-sm text-center">
                    Cole uma imagem com Ctrl+V ou faça upload
                  </p>
                  {pasteStatus === 'success' && (
                    <p className="text-green-400 text-sm mt-2">✓ Imagem anexada com sucesso!</p>
                  )}
                  {pasteStatus === 'error' && (
                    <p className="text-red-400 text-sm mt-2">Erro ao anexar imagem. Tente novamente.</p>
                  )}
                </div>
                {answer && (
                  <div className="mt-4 p-4 bg-white/[0.05] rounded-xl backdrop-blur-sm">
                    <p className="text-white/80 text-sm">Imagem anexada ✓</p>
                  </div>
                )}
              </div>
            ) : isContactStep ? (
              <div className="space-y-4">
                <div>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => setContact(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999 (obrigatório)"
                    className="w-full px-6 py-4 bg-white/[0.05] border border-white/[0.1] rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-[#c8b79e]/50 focus:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="text-center">
                  <span className="text-white/40 text-sm">ou</span>
                </div>
                <div>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seu@email.com (opcional)"
                    className="w-full px-6 py-4 bg-white/[0.05] border border-white/[0.1] rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-[#c8b79e]/50 focus:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Digite sua resposta aqui ou use o botão de microfone para gravar um áudio..."
                  className="w-full h-32 px-6 py-4 bg-white/[0.05] border border-white/[0.1] rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-[#c8b79e]/50 focus:bg-white/[0.08] transition-all duration-300 resize-none backdrop-blur-sm text-base leading-relaxed"
                  style={{ fontSize: '16px' }} // Prevent zoom on iOS
                />
                
                {/* Botão de gravação de áudio */}
                <div className="absolute bottom-4 right-4 flex items-center gap-3">
                  {/* Status de transcrição/gravação */}
                  {isTranscribing && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#c8b79e]/20 rounded-full">
                      <Loader2 className="w-4 h-4 text-[#c8b79e] animate-spin" />
                      <span className="text-xs text-[#c8b79e]">Transcrevendo...</span>
                    </div>
                  )}
                  
                  {isRecording && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs text-red-400">{formatRecordingTime(recordingTime)}</span>
                    </div>
                  )}

                  {pasteStatus === 'success' && !isTranscribing && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-xs text-green-400">Áudio transcrito!</span>
                    </div>
                  )}

                  {pasteStatus === 'error' && !isTranscribing && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="text-xs text-red-400">Erro no áudio</span>
                    </div>
                  )}

                  {/* Botão de gravação */}
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing}
                    className={cn(
                      "p-2 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed",
                      isRecording 
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                        : "bg-white/[0.08] text-white/60 hover:bg-white/[0.15] hover:text-[#c8b79e]"
                    )}
                    title={isRecording ? "Parar gravação" : "Gravar áudio"}
                  >
                    {isRecording ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>

                  {/* Indicador de texto */}
                  {answer.trim() && !isRecording && !isTranscribing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-2 h-2 bg-[#c8b79e] rounded-full"
                    />
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-between items-center"
          >
            {questionNumber > 1 ? (
              <button
                onClick={onBack}
                className="group flex items-center gap-2 px-6 py-3 text-white/60 hover:text-white transition-all duration-300 font-medium"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Voltar
              </button>
            ) : (
              <div /> // Spacer
            )}

            <button
              onClick={onNext}
              disabled={isContactStep ? !isContactValid : !answer.trim()}
              className="group relative px-8 py-4 bg-gradient-to-r from-[#c8b79e] to-[#b09e85] hover:from-[#d0c0a8] hover:to-[#c8b79e] text-white font-semibold rounded-2xl transition-all duration-300 min-w-[140px] shadow-lg shadow-[#1a1814]/40 hover:shadow-xl hover:shadow-[#1a1814]/50 hover:scale-[1.02] border border-[#c8b79e]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 backdrop-blur-sm"
            >
              <span className="relative z-10">
                {isLast ? 'Finalizar' : 'Próximo'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function BrilhoOriginalOnboarding() {
  const [currentStep, setCurrentStep] = useState(1) // Começar direto na pergunta 1
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""))
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState("")
  const [error, setError] = useState("")

  // Get the company name from the first answer
  const companyName = answers[0] ? answers[0].trim() : "Sua Marca"

  // Salva diagnóstico e respostas no cache do navegador com idUnico
  useEffect(() => {
    if (analysis && currentStep === 11) {
      // Se ainda não temos idUnico no cache, gera um
      const existingCache = BrandplotCache.get()
      if (!existingCache?.idUnico) {
        const idUnico = generateIdUnico(companyName)
        const cacheData = {
          idUnico,
          companyName,
          diagnostico: analysis,
          answers,
          ...(answers[9] && { contact: answers[9] })
        }
        BrandplotCache.set(cacheData)
        console.log("Cache atualizado com idUnico gerado localmente:", idUnico)
      }
    }
  }, [analysis, answers, currentStep, companyName])

  // Sample analysis for demo purposes (fallback only)
  const getSampleAnalysis = () => {
    return `🧭 Diagnóstico Profundo da Marca — ${companyName}

🏁 Nota de Clareza & Emoção da Marca: 75/100
Sua marca demonstra potencial significativo, mas ainda há oportunidades para maior clareza na comunicação e conexão emocional mais profunda com o público-alvo.

## 🔍 Diagnóstico da Marca Atual

### 🎯 Essência da Marca
Com base nas suas respostas, sua marca nasceu de uma motivação genuína e tem uma proposta de valor clara. A essência está bem definida, mas pode ser comunicada de forma mais impactante.

### 🧬 Promessa Central
"Sua marca existe para transformar a experiência do seu público-alvo de forma única e memorável."
A promessa central está presente, mas precisa ser refinada para criar maior diferenciação no mercado.

### 👥 Público Ideal vs. Atual
Existe um alinhamento parcial entre quem você quer atingir e quem realmente compra de você. Há oportunidade de educar o mercado sobre o verdadeiro valor da sua marca.

### 📍 Percepção Atual
Sua marca já tem elementos distintivos, mas a percepção ainda não reflete completamente o valor que você entrega. É necessário trabalhar a comunicação para fechar essa lacuna.

### 🧠 Insight-chave para Reposicionamento
O próximo passo é criar uma narrativa mais forte que conecte sua motivação original com os benefícios tangíveis que você oferece. Foque em transformar clientes em defensores da marca através de experiências consistentes e memoráveis.`
  }


  const handleNext = async () => {
    if (currentStep < questions.length) {
      // Se ainda há perguntas (steps 1 a 10),
      // avança para a próxima pergunta.
      setCurrentStep(currentStep + 1)
      return // Importante sair aqui para não chamar a API antes da última pergunta
    }

    // Se chegou aqui, é porque currentStep === questions.length (step 10 - Contato)
    // e o usuário clicou em Próximo/Finalizar nesse passo.
    // Agora sim, chama a API e vai para a tela de loading (step 11).
    setIsLoading(true)
    setCurrentStep(11) // Show loading state
    setError("")

    try {
      console.log("Sending request to API with answers:", answers)

      // Make the API call
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      })

      console.log("API response status:", response.status)

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `API responded with status: ${response.status}`
        let isRateLimited = false
        
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
          if (errorData.message) {
            errorMessage = errorData.message
          }
          if (errorData.rateLimitExceeded || response.status === 429) {
            isRateLimited = true
          }
        } catch (e) {
          // If we can't parse the error response, use the status
        }
        
        // Para rate limiting, mostrar mensagem especial e não usar fallback
        if (isRateLimited) {
          setError(errorMessage)
          setIsLoading(false)
          setCurrentStep(currentStep) // Voltar para o step anterior
          return
        }
        
        throw new Error(errorMessage)
      }      const data = await response.json()
      console.log("API response data:", data)

      if (!data.analysis && !data.parsedAnalysis) {
        throw new Error("No analysis received from API")
      }

      // Usar análise estruturada se disponível, senão usar texto
      const analysisToSave = data.parsedAnalysis || data.analysis
      setAnalysis(analysisToSave)
      
      // Salva os dados no cache incluindo o idUnico retornado pela API
      if (data.idUnico) {
        const cacheData = {
          idUnico: data.idUnico,
          companyName,
          diagnostico: typeof analysisToSave === 'object' ? JSON.stringify(analysisToSave) : analysisToSave,
          answers: answers,
          scoreDiagnostico: data.scoreDiagnostico, // Inclui o score no cache
          parsedAnalysis: data.parsedAnalysis, // Inclui análise estruturada se disponível
          ...(answers[9] && { contact: answers[9] })
        }
        BrandplotCache.set(cacheData)
        console.log("Dados salvos no cache com idUnico:", data.idUnico, "Score:", data.scoreDiagnostico)
        if (data.parsedAnalysis) {
          console.log("Análise estruturada JSON salva:", data.parsedAnalysis)
        }
      }
      
      // Redirecionar para a página de diagnóstico
      window.location.href = '/diagnostico'
    } catch (error: any) {
      console.error("Error analyzing:", error)
      setError(`Erro: ${error.message}. Usando análise de exemplo como fallback.`) // Mensagem de erro mais amigável

      // Use sample data as fallback e salva no cache
      const fallbackAnalysis = getSampleAnalysis()
      setAnalysis(fallbackAnalysis)
      
      const cacheData = {
        idUnico: `fallback-${Date.now()}`,
        companyName,
        diagnostico: fallbackAnalysis,
        answers: answers,
        scoreDiagnostico: "75", // Score padrão para fallback
        ...(answers[9] && { contact: answers[9] })
      }
      BrandplotCache.set(cacheData)
      
      // Redirecionar para a página de diagnóstico mesmo com fallback
      window.location.href = '/diagnostico'
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateAnswer = (index: number, value: string) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  // Determine which step to render
  const renderStep = () => {
    if (currentStep === 11) {
      return <LoadingState companyName={companyName} />
    }    // Steps 1 through 10 (questions)
    return (
      <QuestionStep
        questionNumber={currentStep}
        question={questions[currentStep - 1]}
        answer={answers[currentStep - 1]}
        setAnswer={(value) => updateAnswer(currentStep - 1, value)}
        onNext={handleNext}
        onBack={handleBack}
        isLast={currentStep === questions.length}
      />
    )
  }
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1814]">
      {/* Botão discreto para voltar à página inicial */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        onClick={() => window.location.href = '/'}
        className="fixed top-6 left-6 z-50 p-3 bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-sm border border-white/[0.12] rounded-full transition-all duration-300 hover:scale-110 group shadow-lg shadow-black/20"
        title="Voltar à página inicial"
      >
        <Home className="w-5 h-5 text-white/70 group-hover:text-white transition-colors duration-300" />
      </motion.button>
      
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-amber-700/[0.05] blur-3xl" />      <div className="absolute inset-0 overflow-hidden">
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

      {renderStep()}
    </div>
  )
}
