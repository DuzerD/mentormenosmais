"use client"

import { useEffect, useRef, useState } from "react"
import { Mic, MicOff, Send, Play, Pause, Volume2, Loader2, MessageSquare, Headphones, Globe, Search, ChevronDown, Settings, Sparkles, Zap, Image, Paperclip, X } from "lucide-react"
import { BrandplotCache } from "@/lib/brandplot-cache"
import { SharedHeader } from "@/components/SharedHeader"
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  mode: 'text' | 'voice'
  audioUrl?: string
  timestamp: Date
  isPlaying?: boolean
  webSearchUsed?: boolean
  semanticSearchUsed?: boolean
  imageUrl?: string
  imageFile?: File
}

interface ProcessingStage {
  stage: 'transcribing' | 'processing' | 'searching' | 'generating' | 'complete'
  label: string
  icon: React.ComponentType<any>
}

export default function VozOtimizada() {
  // Estados principais
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentProcessingStage, setCurrentProcessingStage] = useState<ProcessingStage | null>(null)
  const [error, setError] = useState("")
  
  // Estado para busca na web
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [contextEnhancedEnabled, setContextEnhancedEnabled] = useState(true) // Ativo por padrão
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false)
  
  // Estados para upload de imagem
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // Estados para controle de áudio
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)
  const [generatingAudioId, setGeneratingAudioId] = useState<string | null>(null)
  
  // Refs para controle
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const stream = useRef<MediaStream | null>(null)
  const recordingStartTime = useRef<number>(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Dados da empresa
  const [companyName, setCompanyName] = useState<string>("Sua Marca")

  // Estágios de processamento
  const processingStages: ProcessingStage[] = [
    { stage: 'transcribing', label: 'Transcrevendo áudio...', icon: Headphones },
    { stage: 'processing', label: 'Processando resposta...', icon: MessageSquare },
    { stage: 'searching', label: 'Buscando na web...', icon: Search },
    { stage: 'generating', label: 'Gerando áudio...', icon: Volume2 },
  ]

  // Scroll automático para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Carregar dados da empresa
  useEffect(() => {
    async function loadCompanyData() {
      let idUnico = null
      if (typeof window !== "undefined") {
        const cache = BrandplotCache.get()
        if (cache && cache.idUnico) {
          idUnico = cache.idUnico
        } else {
          const storedId = localStorage.getItem("brandplot_idUnico")
          if (storedId) idUnico = storedId
        }
      }
      
      if (idUnico) {
        try {
          const response = await fetch(`/api/brand-data?idUnico=${encodeURIComponent(idUnico)}`)
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              setCompanyName(result.data.nome_empresa || "Sua Marca")
            }
          }
        } catch (error) {
          console.error("Erro ao carregar dados da empresa:", error)
        }
      }
    }
    loadCompanyData()
  }, [])

  // Adicionar mensagem
  const addMessage = (content: string, type: 'user' | 'assistant', mode: 'text' | 'voice', audioUrl?: string, webSearchUsed?: boolean, semanticSearchUsed?: boolean, imageUrl?: string, imageFile?: File) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      mode,
      audioUrl,
      timestamp: new Date(),
      isPlaying: false,
      webSearchUsed,
      semanticSearchUsed,
      imageUrl,
      imageFile
    }
    
    setMessages(prev => [...prev, newMessage])
    return newMessage.id
  }

    // Enviar mensagem de texto
  const sendTextMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || isProcessing) return
    
    const messageContent = inputText.trim() || "Analise esta imagem"
    const currentImage = selectedImage
    const currentImagePreview = imagePreview
    
    // Limpar inputs
    setInputText("")
    removeSelectedImage()
    
    // Adicionar mensagem do usuário
    addMessage(messageContent, 'user', 'text', undefined, undefined, undefined, currentImagePreview || undefined, currentImage || undefined)
    
    try {
      setIsProcessing(true)
      
      // Mostrar estágio correto baseado na busca na web
      if (webSearchEnabled) {
        setCurrentProcessingStage(processingStages[2]) // searching
      } else {
        setCurrentProcessingStage(processingStages[1]) // processing
      }
      
      // Processar com LLM (modo texto)
      const llmResponse = await processWithLLM(messageContent, 'text', currentImage || undefined)
      if (!llmResponse.success) {
        throw new Error(llmResponse.error || "Erro no processamento")
      }
      
      // Adicionar resposta da IA
      addMessage(llmResponse.text, 'assistant', 'text', undefined, llmResponse.webSearchUsed, llmResponse.semanticSearchUsed)
      
    } catch (err: any) {
      setError("Erro no processamento: " + (err?.message || err))
      setTimeout(() => setError(""), 5000)
    } finally {
      setIsProcessing(false)
      setCurrentProcessingStage(null)
    }
  }

  // Alternar gravação de voz (iniciar/parar)
  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording()
    } else {
      await startRecording()
    }
  }

  // Iniciar gravação de voz
  const startRecording = async () => {
    try {
      setError("")
      recordingStartTime.current = Date.now()
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      })
      
      stream.current = mediaStream
      audioChunks.current = []
      
      const recorder = new MediaRecorder(mediaStream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
        }
      }
      
      recorder.onstop = async () => {
        const recordingDuration = Date.now() - recordingStartTime.current
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
        
        // Verificar duração mínima (500ms)
        if (recordingDuration < 500) {
          setError("Gravação muito rápida. Tente novamente.")
          setTimeout(() => setError(""), 3000)
          return
        }
        
        if (audioBlob.size > 1000) {
          await processVoiceMessage(audioBlob)
        } else {
          setError("Gravação muito curta. Tente novamente.")
          setTimeout(() => setError(""), 3000)
        }
      }
      
      mediaRecorder.current = recorder
      recorder.start()
      setIsRecording(true)
      
    } catch (err: any) {
      setError("Erro ao acessar microfone: " + (err?.message || err))
    }
  }

  // Parar gravação
  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      setIsRecording(false)
    }
    
    if (stream.current) {
      stream.current.getTracks().forEach(track => track.stop())
      stream.current = null
    }
  }

  // Processar mensagem de voz
  const processVoiceMessage = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true)
      setError("")
      
      // Criar URL temporário para o áudio do usuário
      const userAudioUrl = URL.createObjectURL(audioBlob)
      
      // Stage 1: Transcrição
      setCurrentProcessingStage(processingStages[0])
      const transcriptionResponse = await transcribeAudio(audioBlob)
      if (!transcriptionResponse.success) {
        throw new Error(transcriptionResponse.error || "Erro na transcrição")
      }
      
      const userText = transcriptionResponse.text
      
      if (!userText || userText.trim().length < 3) {
        setError("Não consegui entender. Tente falar mais claramente.")
        setTimeout(() => setError(""), 3000)
        return
      }
      
      // Adicionar mensagem do usuário com áudio
      addMessage(userText, 'user', 'voice', userAudioUrl)
      
      // Stage 2: Processamento LLM (com possível busca na web)
      if (webSearchEnabled) {
        setCurrentProcessingStage(processingStages[2]) // searching
      } else {
        setCurrentProcessingStage(processingStages[1]) // processing
      }
      
      const llmResponse = await processWithLLM(userText, 'voice')
      if (!llmResponse.success) {
        throw new Error(llmResponse.error || "Erro no processamento")
      }
      
      const assistantText = llmResponse.text
      
      // Stage 3: Síntese de voz
      setCurrentProcessingStage(processingStages[3])
      const ttsResponse = await generateSpeech(assistantText)
      if (!ttsResponse.success) {
        throw new Error(ttsResponse.error || "Erro na síntese de voz")
      }
      
      // Adicionar resposta da IA com áudio
      const messageId = addMessage(assistantText, 'assistant', 'voice', ttsResponse.audioUrl, llmResponse.webSearchUsed, llmResponse.semanticSearchUsed)
      
      // Auto-reproduzir resposta da IA
      if (ttsResponse.audioUrl) {
        setTimeout(() => playAudio(ttsResponse.audioUrl!, messageId), 500)
      }
      
    } catch (err: any) {
      setError("Erro no processamento: " + (err?.message || err))
      setTimeout(() => setError(""), 5000)
    } finally {
      setIsProcessing(false)
      setCurrentProcessingStage(null)
    }
  }

  // Transcrever áudio
  const transcribeAudio = async (audioBlob: Blob) => {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'audio.mp3')
    
    const response = await fetch('/api/voice/transcribe', {
      method: 'POST',
      body: formData
    })
    
    return await response.json()
  }

  // Processar com LLM
  const processWithLLM = async (userText: string, mode: 'text' | 'voice', imageFile?: File) => {
    if (imageFile) {
      // Para imagens, usar FormData
      const formData = new FormData()
      formData.append('message', userText)
      formData.append('image', imageFile)
      formData.append('companyName', companyName)
      formData.append('mode', mode)
      formData.append('webSearchEnabled', webSearchEnabled.toString())
      formData.append('contextEnhancedEnabled', contextEnhancedEnabled.toString())

      const response = await fetch('/api/voice/chat-with-image', {
        method: 'POST',
        body: formData
      })
      
      return await response.json()
    } else {
      // Sem imagem, usar JSON normal
      const response = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: userText,
          companyName: companyName,
          mode: mode,
          webSearchEnabled: webSearchEnabled,
          contextEnhancedEnabled: contextEnhancedEnabled
        })
      })
      
      return await response.json()
    }
  }

  // Gerar síntese de voz
  const generateSpeech = async (text: string) => {
    const response = await fetch('/api/voice/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        text: text,
        voice: 'nova',
        model: 'gpt-4o-mini-tts',
        speed: 1.1
      })
    })
    
    return await response.json()
  }

  // Reproduzir áudio
  const playAudio = (audioUrl: string, messageId: string) => {
    // Parar áudio atual se estiver tocando
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }
    
    const audio = new Audio(audioUrl)
    
    audio.onplay = () => {
      setPlayingMessageId(messageId)
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isPlaying: true }
          : { ...msg, isPlaying: false }
      ))
    }
    
    audio.onended = () => {
      setPlayingMessageId(null)
      setMessages(prev => prev.map(msg => ({ ...msg, isPlaying: false })))
      setCurrentAudio(null)
    }
    
    audio.onerror = () => {
      setError("Erro ao reproduzir áudio")
      setPlayingMessageId(null)
      setMessages(prev => prev.map(msg => ({ ...msg, isPlaying: false })))
      setCurrentAudio(null)
    }
    
    setCurrentAudio(audio)
    audio.play()
  }

  // Pausar áudio
  const pauseAudio = () => {
    if (currentAudio) {
      currentAudio.pause()
      setPlayingMessageId(null)
      setMessages(prev => prev.map(msg => ({ ...msg, isPlaying: false })))
    }
  }

  // Gerar áudio para mensagem de texto
  const generateAudioForMessage = async (messageId: string, text: string) => {
    try {
      setGeneratingAudioId(messageId)
      const ttsResponse = await generateSpeech(text)
      if (ttsResponse.success && ttsResponse.audioUrl) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, audioUrl: ttsResponse.audioUrl }
            : msg
        ))
        playAudio(ttsResponse.audioUrl, messageId)
      }
    } catch (err) {
      setError("Erro ao gerar áudio")
      setTimeout(() => setError(""), 3000)
    } finally {
      setGeneratingAudioId(null)
    }
  }

  // Funções para manipular imagens
  const handleImageSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageSelect(file)
    }
  }

  const removeSelectedImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      handleImageSelect(imageFile)
    }
  }

  // Paste (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(item => item.type.startsWith('image/'))
    
    if (imageItem) {
      const file = imageItem.getAsFile()
      if (file) {
        handleImageSelect(file)
      }
    }
  }

  // Fechar dropdown ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector('[data-dropdown="tools"]')
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setToolsDropdownOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setToolsDropdownOpen(false)
      }
    }

    if (toolsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [toolsDropdownOpen])

  // Cleanup
  useEffect(() => {
    return () => {
      if (stream.current) {
        stream.current.getTracks().forEach(track => track.stop())
      }
      if (currentAudio) {
        currentAudio.pause()
      }
      // Limpar URLs temporários
      messages.forEach(msg => {
        if (msg.audioUrl && msg.audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(msg.audioUrl)
        }
      })
    }
  }, [])

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1814]">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-amber-700/[0.05] blur-3xl" />

      {/* Header */}
      <div className="relative z-10">
        <SharedHeader companyName={companyName} />
      </div>

      {/* Chat Container */}
      <div className="relative z-10 h-[calc(100vh-60px)] sm:h-[calc(100vh-70px)] md:h-[calc(100vh-80px)] flex justify-center p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-full sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%] flex flex-col border-2 border-orange-700/50 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
        
        {/* Chat Header */}
        <div className="bg-[#2a251f] border-b border-orange-500/20 p-3 sm:p-4">
          <div className="text-center">
            <h1 className="text-lg sm:text-xl font-bold text-white mb-1">
              Assistente BrandPlot
            </h1>
            <p className="text-xs sm:text-sm text-orange-300">
              Especialista em branding para <span className="font-semibold">{companyName}</span>
            </p>
          </div>
        </div>

        {/* Messages Container */}
        <div 
          ref={chatContainerRef}
          className={`flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 relative ${isDragging ? 'bg-orange-500/10 border-2 border-dashed border-orange-500' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-orange-500/20 backdrop-blur-sm z-40">
              <div className="text-center text-white">
                <Image className="w-12 h-12 mx-auto mb-2 text-orange-400" />
                <p className="text-base sm:text-lg font-semibold">Solte a imagem aqui</p>
                <p className="text-xs sm:text-sm opacity-80">PNG, JPG, GIF aceitos</p>
              </div>
            </div>
          )}
          {messages.length === 0 && (
            <div className="text-center text-white/60 mt-4 sm:mt-8">
              <div className="max-w-xs sm:max-w-md mx-auto px-4">
                <Volume2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-orange-400" />
                <p className="text-base sm:text-lg font-medium mb-2">Bem-vindo ao Assistente</p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Envie uma mensagem de texto ou grave um áudio para começar a conversar sobre branding e estratégia de marca.
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
                             <div className={`max-w-[85%] sm:max-w-[70%] ${
                 message.type === 'user' 
                   ? 'bg-orange-500 text-white shadow-lg' 
                   : 'bg-[#2a251f] text-white border border-orange-500/20 shadow-lg'
               } rounded-2xl p-2.5 sm:p-3 animate-in slide-in-from-bottom-2 duration-300`}>
                
                                 {/* Imagem da mensagem */}
                 {message.imageUrl && (
                   <div className="mb-2 sm:mb-3">
                     <img 
                       src={message.imageUrl} 
                       alt="Imagem enviada" 
                       className="max-w-full sm:max-w-xs max-h-48 sm:max-h-64 rounded-lg border border-white/20 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                       onClick={() => window.open(message.imageUrl, '_blank')}
                     />
                   </div>
                 )}
                 
                 {/* Conteúdo da mensagem */}
                 <div className="mb-1.5 sm:mb-2">
                   <div className={`text-xs sm:text-sm leading-relaxed prose prose-invert prose-sm max-w-none ${
                     message.type === 'user' ? 'prose-orange' : 'prose-neutral'
                   }`}>
                     <ReactMarkdown
                       components={{
                         p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                         strong: ({ children }) => <strong className={`font-semibold ${
                           message.type === 'user' ? 'text-orange-100' : 'text-white'
                         }`}>{children}</strong>,
                         em: ({ children }) => <em className={`italic ${
                           message.type === 'user' ? 'text-orange-100/90' : 'text-white/90'
                         }`}>{children}</em>,
                         ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-2">{children}</ul>,
                         ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-2">{children}</ol>,
                         li: ({ children }) => <li className={`${
                           message.type === 'user' ? 'text-orange-100/90' : 'text-white/90'
                         }`}>{children}</li>,
                         code: ({ children, className }) => {
                           const isInline = !className
                           if (isInline) {
                             return <code className={`px-1 py-0.5 rounded text-xs font-mono ${
                               message.type === 'user' 
                                 ? 'bg-orange-600/30 text-orange-100' 
                                 : 'bg-black/20 text-white'
                             }`}>{children}</code>
                           }
                           return <pre className={`p-2 rounded text-xs font-mono overflow-x-auto ${
                             message.type === 'user' 
                               ? 'bg-orange-600/30 text-orange-100' 
                               : 'bg-black/20 text-white'
                           }`}><code>{children}</code></pre>
                         },
                         h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                         h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                         h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                         blockquote: ({ children }) => <blockquote className={`border-l-2 pl-3 italic ${
                           message.type === 'user' 
                             ? 'border-orange-300/40 text-orange-100/80' 
                             : 'border-white/20 text-white/80'
                         }`}>{children}</blockquote>,
                       }}
                     >
                       {message.content}
                     </ReactMarkdown>
                   </div>
                 </div>

                {/* Controles de áudio */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className={`${
                      message.type === 'user' ? 'text-orange-100' : 'text-orange-300'
                    }`}>
                      {message.mode === 'voice' ? '🎤' : '💬'} 
                      {message.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {/* Indicadores de ferramentas usadas */}
                    {message.webSearchUsed && (
                      <span className="flex items-center space-x-1 text-blue-400" title="Informações atualizadas da web">
                        <Globe className="w-3 h-3" />
                        <span className="text-xs">Web</span>
                      </span>
                    )}
                    {message.semanticSearchUsed && (
                      <span className="flex items-center space-x-1 text-purple-400" title="Dados da empresa via busca semântica">
                        <Search className="w-3 h-3" />
                        <span className="text-xs">Empresa</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Botão de play/pause para mensagens com áudio */}
                    {message.audioUrl && (
                      <button
                        onClick={() => 
                          message.isPlaying 
                            ? pauseAudio() 
                            : playAudio(message.audioUrl!, message.id)
                        }
                        className={`p-1.5 rounded-full transition-colors ${
                          message.type === 'user'
                            ? 'hover:bg-orange-600'
                            : 'hover:bg-orange-500/20'
                        }`}
                      >
                        {message.isPlaying ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </button>
                    )}

                    {/* Botão para gerar áudio para mensagens de texto da IA */}
                    {message.type === 'assistant' && message.mode === 'text' && !message.audioUrl && (
                      <button
                        onClick={() => generateAudioForMessage(message.id, message.content)}
                        disabled={generatingAudioId === message.id}
                        className="p-1.5 rounded-full hover:bg-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={generatingAudioId === message.id ? "Gerando áudio..." : "Ouvir resposta"}
                      >
                        {generatingAudioId === message.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Indicador de processamento */}
          {isProcessing && currentProcessingStage && (
            <div className="flex justify-start">
              <div className="bg-[#2a251f] border border-orange-500/20 rounded-2xl p-3">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {processingStages.map((stage, index) => {
                      const Icon = stage.icon
                      const isActive = stage.stage === currentProcessingStage.stage
                      const isCompleted = processingStages.findIndex(s => s.stage === currentProcessingStage.stage) > index
                      
                      return (
                        <div
                          key={stage.stage}
                          className={`p-1.5 rounded-full transition-all ${
                            isActive 
                              ? 'bg-orange-500 text-white animate-pulse' 
                              : isCompleted 
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-600 text-gray-400'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                        </div>
                      )
                    })}
                  </div>
                  <span className="text-sm text-orange-300">
                    {currentProcessingStage.label}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

                   {/* Error Display */}
         {error && (
           <div className="mx-4 mb-2">
             <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
               {error}
             </div>
           </div>
         )}

                 {/* Input Container */}
         <div className="bg-[#2a251f] border-t border-orange-500/20 p-2 sm:p-4">
           {/* Preview da imagem selecionada */}
           {imagePreview && (
             <div className="mb-2 sm:mb-3 flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-[#1a1814] rounded-xl border border-orange-500/20">
               <img 
                 src={imagePreview} 
                 alt="Preview" 
                 className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover border border-white/20 flex-shrink-0"
               />
               <div className="flex-1 min-w-0">
                 <p className="text-white text-xs sm:text-sm font-medium truncate">Imagem selecionada</p>
                 <p className="text-gray-400 text-xs truncate">{selectedImage?.name}</p>
               </div>
               <button
                 onClick={removeSelectedImage}
                 className="p-1 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0"
               >
                 <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
               </button>
             </div>
           )}
           
           <div className="flex items-end space-x-1.5 sm:space-x-2 md:space-x-3">
             
             {/* Ferramentas Dropdown */}
             <div className="relative" data-dropdown="tools">
               <button
                 onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                 className={`p-2 sm:p-3 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                   (webSearchEnabled || contextEnhancedEnabled)
                     ? 'bg-orange-500/20 border border-orange-500/50 text-orange-400 hover:bg-orange-500/30' 
                     : 'bg-[#1a1814] border border-orange-500/30 text-white hover:border-orange-500 hover:bg-[#2a251f]'
                 }`}
                 title="Ferramentas disponíveis"
               >
                 <div className="relative">
                   <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                   {(webSearchEnabled || contextEnhancedEnabled) && (
                     <div className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full animate-pulse"></div>
                   )}
                 </div>
               </button>

               {/* Dropdown Menu */}
               {toolsDropdownOpen && (
                 <div className="absolute left-0 bottom-full mb-2 w-72 sm:w-80 bg-[#1a1814] border border-orange-500/20 rounded-2xl shadow-2xl backdrop-blur-sm z-50 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                   <div className="p-4">
                     <h3 className="text-white font-semibold mb-3 text-sm">Ferramentas Disponíveis</h3>
                     
                     {/* Busca na Web */}
                     <div 
                       onClick={() => {
                         setWebSearchEnabled(!webSearchEnabled)
                         setToolsDropdownOpen(false)
                       }}
                       className={`flex items-start space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 mb-2 transform hover:scale-[1.02] active:scale-[0.98] ${
                         webSearchEnabled 
                           ? 'bg-orange-500/10 border border-orange-500/30 shadow-lg hover:bg-orange-500/15' 
                           : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                       }`}
                     >
                       <div className={`flex-shrink-0 p-2 rounded-lg ${
                         webSearchEnabled ? 'bg-orange-500' : 'bg-blue-500'
                       }`}>
                         <Globe className="w-4 h-4 text-white" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between">
                           <h4 className="text-white font-medium text-sm">Buscar na Web</h4>
                           {webSearchEnabled && (
                             <div className="flex items-center space-x-1">
                               <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                               <span className="text-xs text-green-400 font-medium">ATIVO</span>
                             </div>
                           )}
                         </div>
                         <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                           Acesso a informações atualizadas da internet para respostas mais precisas
                         </p>
                       </div>
                     </div>

                     {/* Contexto Aprimorado */}
                     <div 
                       onClick={() => {
                         setContextEnhancedEnabled(!contextEnhancedEnabled)
                         setToolsDropdownOpen(false)
                       }}
                       className={`flex items-start space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 mb-2 transform hover:scale-[1.02] active:scale-[0.98] ${
                         contextEnhancedEnabled 
                           ? 'bg-orange-500/10 border border-orange-500/30 shadow-lg hover:bg-orange-500/15' 
                           : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                       }`}
                     >
                       <div className={`flex-shrink-0 p-2 rounded-lg ${
                         contextEnhancedEnabled ? 'bg-orange-500' : 'bg-amber-500'
                       }`}>
                         <Sparkles className="w-4 h-4 text-white" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between">
                           <h4 className="text-white font-medium text-sm">Contexto Aprimorado</h4>
                           {contextEnhancedEnabled && (
                             <div className="flex items-center space-x-1">
                               <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                               <span className="text-xs text-green-400 font-medium">ATIVO</span>
                             </div>
                           )}
                         </div>
                         <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                           Acesso aos dados específicos da sua empresa (diagnóstico, contexto, estratégias)
                         </p>
                       </div>
                     </div>

                     {/* Síntese de Voz - Sempre ativa */}
                     <div className="flex items-start space-x-3 p-3 rounded-xl border border-transparent mb-2 opacity-60">
                       <div className="flex-shrink-0 p-2 rounded-lg bg-purple-500">
                         <Volume2 className="w-4 h-4 text-white" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between">
                           <h4 className="text-white font-medium text-sm">Síntese de Voz</h4>
                           <div className="flex items-center space-x-1">
                             <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                             <span className="text-xs text-green-400 font-medium">ATIVO</span>
                           </div>
                         </div>
                         <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                           Conversão de texto em áudio com voz natural e expressiva
                         </p>
                       </div>
                     </div>

                     {/* Especialista em Branding - Sempre ativa */}
                     <div className="flex items-start space-x-3 p-3 rounded-xl border border-transparent opacity-60">
                       <div className="flex-shrink-0 p-2 rounded-lg bg-amber-500">
                         <Sparkles className="w-4 h-4 text-white" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between">
                           <h4 className="text-white font-medium text-sm">Especialista em Branding</h4>
                           <div className="flex items-center space-x-1">
                             <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                             <span className="text-xs text-green-400 font-medium">ATIVO</span>
                           </div>
                         </div>
                         <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                           Consultoria especializada em estratégia de marca e posicionamento
                         </p>
                       </div>
                     </div>
                   </div>

                   <div className="border-t border-orange-500/10 px-4 py-3">
                     <p className="text-xs text-gray-500 text-center">
                       Mais ferramentas serão adicionadas em breve
                     </p>
                   </div>
                 </div>
               )}
             </div>
             
             {/* Upload Button */}
             <button
               onClick={() => fileInputRef.current?.click()}
               disabled={isProcessing}
               className="p-2 sm:p-3 bg-[#1a1814] border border-orange-500/30 rounded-xl text-white hover:border-orange-500 hover:bg-[#2a251f] transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
               title="Anexar imagem"
             >
               <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
             </button>

             {/* Hidden File Input */}
             <input
               ref={fileInputRef}
               type="file"
               accept="image/*"
               onChange={handleFileInputChange}
               className="hidden"
             />
             
             {/* Text Input */}
             <div className="flex-1">
               <div className="relative">
                 <input
                   type="text"
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendTextMessage()}
                   onPaste={handlePaste}
                   placeholder={selectedImage ? "Descreva o que quer saber sobre a imagem..." : "Digite uma mensagem ou arraste uma imagem..."}
                   disabled={isProcessing}
                   className="w-full bg-[#1a1814] border border-orange-500/30 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 transition-all placeholder:text-xs sm:placeholder:text-sm"
                 />
               </div>
             </div>
 
             {/* Voice Button */}
             <button
               onClick={toggleRecording}
               disabled={isProcessing}
               className={`p-2 sm:p-3 rounded-xl transition-all transform hover:scale-105 active:scale-95 ${
                 isRecording 
                   ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                   : 'bg-orange-500 hover:bg-orange-600'
               } text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
               title={isRecording ? "Clique para parar a gravação" : "Clique para gravar áudio"}
             >
               {isRecording ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
             </button>
 
             {/* Send Button */}
             <button
               onClick={sendTextMessage}
               disabled={(!inputText.trim() && !selectedImage) || isProcessing}
               className="p-2 sm:p-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:transform-none"
               title="Enviar mensagem"
             >
               {isProcessing ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
             </button>
           </div>

                     {/* Recording indicator */}
           {isRecording && (
             <div className="mt-2 sm:mt-3 text-center">
               <div className="inline-flex items-center space-x-2 text-red-400 text-xs sm:text-sm">
                 <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                 <span className="hidden sm:inline">Gravando... (clique no microfone para parar)</span>
                 <span className="sm:hidden">Gravando...</span>
               </div>
             </div>
           )}
                 </div>

        </div>
      </div>
    </div>
  )
}