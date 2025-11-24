// Utilitário para gerenciar o cache do BrandPlot
interface BrandplotCacheData {
  idUnico: string
  companyName: string
  diagnostico: string
  answers: string[]
  contact?: string
  scoreDiagnostico?: string
  timestamp: number
}

const CACHE_KEY = 'brandplotData'
const CACHE_EXPIRY_HOURS = 24 // Cache válido por 24 horas

export class BrandplotCache {
  static set(data: Omit<BrandplotCacheData, 'timestamp'>): void {
    try {
      const cacheData: BrandplotCacheData = {
        ...data,
        timestamp: Date.now()
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
      console.log('BrandPlot data cached with idUnico:', data.idUnico)
    } catch (error) {
      console.error('Erro ao salvar no cache:', error)
    }
  }

  static get(): BrandplotCacheData | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null

      const data: BrandplotCacheData = JSON.parse(cached)
      
      // Verifica se o cache ainda é válido
      const isExpired = Date.now() - data.timestamp > (CACHE_EXPIRY_HOURS * 60 * 60 * 1000)
      if (isExpired) {
        this.clear()
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao ler cache:', error)
      return null
    }
  }

  static getIdUnico(): string | null {
    const data = this.get()
    return data?.idUnico || null
  }

  static clear(): void {
    try {
      localStorage.removeItem(CACHE_KEY)
      console.log('Cache do BrandPlot limpo')
    } catch (error) {
      console.error('Erro ao limpar cache:', error)
    }
  }

  static update(updates: Partial<Omit<BrandplotCacheData, 'timestamp'>>): void {
    const current = this.get()
    if (current) {
      this.set({
        ...current,
        ...updates
      })
    }
  }
}

// Utilitário para gerar idUnico (pode ser usado tanto no frontend quanto no backend)
export function generateIdUnico(nomeEmpresa: string): string {
  if (!nomeEmpresa) {
    return `empresa-${Date.now()}-brandplot`
  }
  
  const cleanName = nomeEmpresa
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '') // Remove todos os espaços
    .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais, mantém só letras e números
  
  return `${cleanName}-brandplot`
}
