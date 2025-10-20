// Rate limiter utilitário para controlar requisições por IP
interface RateLimitData {
  count: number
  resetTime: number
}

// Map para armazenar contadores por IP
const ipCounts = new Map<string, RateLimitData>()

// Configurações do rate limiter
const RATE_LIMIT_MAX_REQUESTS = 3 // Máximo de 3 requisições
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000 // Janela de 24 horas em milliseconds

export function getRealIP(request: Request): string {
  // Tenta obter o IP real considerando proxies e CDNs
  const headers = request.headers
  
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    return ips[0] // Primeiro IP na lista é geralmente o IP original
  }
  
  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  const cfConnectingIP = headers.get('cf-connecting-ip') // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback para desenvolvimento local
  return 'unknown-ip'
}

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const currentData = ipCounts.get(ip)
  
  // Se não existe dados para este IP ou o período expirou
  if (!currentData || now > currentData.resetTime) {
    const newData: RateLimitData = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    }
    ipCounts.set(ip, newData)
    
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: newData.resetTime
    }
  }
  
  // Se ainda está dentro do período e não excedeu o limite
  if (currentData.count < RATE_LIMIT_MAX_REQUESTS) {
    currentData.count++
    ipCounts.set(ip, currentData)
    
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - currentData.count,
      resetTime: currentData.resetTime
    }
  }
  
  // Excedeu o limite
  return {
    allowed: false,
    remaining: 0,
    resetTime: currentData.resetTime
  }
}

// Função para limpar registros expirados (opcional, para economizar memória)
export function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [ip, data] of ipCounts.entries()) {
    if (now > data.resetTime) {
      ipCounts.delete(ip)
    }
  }
}

// Executar limpeza a cada 30 minutos
setInterval(cleanupExpiredEntries, 30 * 60 * 1000) 