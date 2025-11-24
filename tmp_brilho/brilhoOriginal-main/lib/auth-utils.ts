export interface User {
  idUnico: string
  company: string
  name?: string
  email?: string
  [key: string]: any
}

export interface AuthData {
  user: User
  timestamp: number
}

export class AuthManager {
  private static readonly USER_KEY = 'user'
  private static readonly TIMESTAMP_KEY = 'loginTimestamp'
  private static readonly ID_UNICO_KEY = 'brandplot_idUnico'
  private static readonly LOGIN_DURATION = 8 * 60 * 60 * 1000 // 8 horas em millisegundos
  
  // Cache em memória para ambientes onde localStorage não está disponível
  private static memoryCache: Map<string, string> = new Map()
  private static isLocalStorageAvailable: boolean | null = null

  /**
   * Verifica se localStorage está disponível de forma segura
   */
  private static checkLocalStorageAvailability(): boolean {
    if (AuthManager.isLocalStorageAvailable !== null) {
      return AuthManager.isLocalStorageAvailable
    }

    try {
      if (typeof Storage === 'undefined' || !window.localStorage) {
        AuthManager.isLocalStorageAvailable = false
        return false
      }

      // Teste real de escrita/leitura
      const testKey = '__auth_test__'
      localStorage.setItem(testKey, 'test')
      const retrieved = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)
      
      AuthManager.isLocalStorageAvailable = retrieved === 'test'
      return AuthManager.isLocalStorageAvailable
    } catch (error) {
      console.log('⚠️ AuthManager: localStorage não disponível, usando cache em memória')
      AuthManager.isLocalStorageAvailable = false
      return false
    }
  }

  /**
   * Salva um item de forma segura (localStorage ou memória)
   */
  private static setItem(key: string, value: string): void {
    if (AuthManager.checkLocalStorageAvailability()) {
      try {
        localStorage.setItem(key, value)
        return
      } catch (error) {
        console.log(`⚠️ AuthManager: Falha no localStorage para ${key}, usando memória`)
        AuthManager.isLocalStorageAvailable = false
      }
    }
    
    // Fallback para cache em memória
    AuthManager.memoryCache.set(key, value)
  }

  /**
   * Recupera um item de forma segura (localStorage ou memória)
   */
  private static getItem(key: string): string | null {
    if (AuthManager.checkLocalStorageAvailability()) {
      try {
        return localStorage.getItem(key)
      } catch (error) {
        console.log(`⚠️ AuthManager: Falha ao ler localStorage para ${key}, usando memória`)
        AuthManager.isLocalStorageAvailable = false
      }
    }
    
    // Fallback para cache em memória
    return AuthManager.memoryCache.get(key) || null
  }

  /**
   * Remove um item de forma segura (localStorage ou memória)
   */
  private static removeItem(key: string): void {
    if (AuthManager.checkLocalStorageAvailability()) {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.log(`⚠️ AuthManager: Falha ao remover do localStorage ${key}`)
        AuthManager.isLocalStorageAvailable = false
      }
    }
    
    // Sempre limpar do cache em memória também
    AuthManager.memoryCache.delete(key)
  }

  /**
   * Salva dados do usuário logado com timestamp
   */
  static setUser(user: User): void {
    if (typeof window === 'undefined') return

    try {
      const timestamp = Date.now()
      
      AuthManager.setItem(AuthManager.USER_KEY, JSON.stringify(user))
      AuthManager.setItem(AuthManager.TIMESTAMP_KEY, timestamp.toString())
      
      if (user.idUnico) {
        AuthManager.setItem(AuthManager.ID_UNICO_KEY, user.idUnico)
      }
      
      console.log('✅ AuthManager: Dados do usuário salvos com sucesso')
    } catch (error) {
      console.error('❌ AuthManager: Erro ao salvar dados do usuário:', error)
    }
  }
  /**
   * Recupera dados do usuário se ainda estão válidos
   */
  static getUser(): User | null {
    if (typeof window === 'undefined') return null

    try {
      const userStr = AuthManager.getItem(AuthManager.USER_KEY)
      const timestampStr = AuthManager.getItem(AuthManager.TIMESTAMP_KEY)

      if (!userStr || !timestampStr) {
        return null
      }

      const user = JSON.parse(userStr)
      const timestamp = parseInt(timestampStr)
      const currentTime = Date.now()

      // Verifica se o login expirou
      if (currentTime - timestamp > AuthManager.LOGIN_DURATION) {
        console.log('ℹ️ AuthManager: Login expirado após 8 horas, fazendo logout automático')
        AuthManager.clearUser()
        return null
      }

      return user
    } catch (e) {
      console.error('❌ AuthManager: Erro ao recuperar dados do usuário:', e)
      AuthManager.clearUser()
      return null
    }
  }

  /**
   * Verifica se o usuário está logado e o login ainda é válido
   */
  static isLoggedIn(): boolean {
    return AuthManager.getUser() !== null
  }

  /**
   * Limpa todos os dados de autenticação
   */
  static clearUser(): void {
    if (typeof window === 'undefined') return

    try {
      AuthManager.removeItem(AuthManager.USER_KEY)
      AuthManager.removeItem(AuthManager.TIMESTAMP_KEY)
      AuthManager.removeItem(AuthManager.ID_UNICO_KEY)
      console.log('🗑️ AuthManager: Dados de autenticação limpos')
    } catch (error) {
      console.error('❌ AuthManager: Erro ao limpar dados:', error)
    }
  }

  /**
   * Verifica se o login está próximo da expiração (última hora)
   */
  static isLoginNearExpiration(): boolean {
    if (typeof window === 'undefined') return false

    try {
      const timestampStr = AuthManager.getItem(AuthManager.TIMESTAMP_KEY)
      if (!timestampStr) return false

      const timestamp = parseInt(timestampStr)
      const currentTime = Date.now()
      const timeElapsed = currentTime - timestamp
      const timeRemaining = AuthManager.LOGIN_DURATION - timeElapsed

      // Retorna true se restam menos de 1 hora
      return timeRemaining > 0 && timeRemaining < 60 * 60 * 1000
    } catch (e) {
      return false
    }
  }

  /**
   * Obtém o ID único do usuário
   */
  static getIdUnico(): string | null {
    try {
      const user = AuthManager.getUser()
      return user?.idUnico || AuthManager.getItem(AuthManager.ID_UNICO_KEY)
    } catch (error) {
      console.error('❌ AuthManager: Erro ao obter ID único:', error)
      return null
    }
  }

  /**
   * Verifica se o armazenamento está funcionando
   */
  static isStorageWorking(): boolean {
    return AuthManager.checkLocalStorageAvailability() || AuthManager.memoryCache.size >= 0
  }

  /**
   * Obtém informações de debug sobre o armazenamento
   */
  static getStorageInfo(): { type: string; available: boolean; itemCount: number } {
    const isLocalStorageWorking = AuthManager.checkLocalStorageAvailability()
    return {
      type: isLocalStorageWorking ? 'localStorage' : 'memory',
      available: isLocalStorageWorking || AuthManager.memoryCache.size >= 0,
      itemCount: isLocalStorageWorking ? 
        Object.keys(localStorage).length : 
        AuthManager.memoryCache.size
    }
  }

  /**
   * Renova o timestamp de login (útil para atividade do usuário)
   */
  static renewLogin(): boolean {
    if (typeof window === 'undefined') return false

    const user = AuthManager.getUser()
    if (!user) return false

    // Apenas renova o timestamp se o login ainda é válido
    localStorage.setItem(AuthManager.TIMESTAMP_KEY, Date.now().toString())
    return true
  }

  /**
   * Retorna o tempo restante de login em millisegundos
   */
  static getTimeRemaining(): number {
    if (typeof window === 'undefined') return 0

    try {
      const timestampStr = localStorage.getItem(AuthManager.TIMESTAMP_KEY)
      if (!timestampStr) return 0

      const timestamp = parseInt(timestampStr)
      const currentTime = Date.now()
      const timeElapsed = currentTime - timestamp
      const timeRemaining = AuthManager.LOGIN_DURATION - timeElapsed

      return Math.max(0, timeRemaining)
    } catch (e) {
      return 0
    }
  }
} 