"use client"

import { useEffect } from "react"
import { AuthManager } from "@/lib/auth-utils"
import BrilhoOriginalOnboarding from "../../components/brilho-original/brilho-original-onboarding"

export default function OnboardingPage() {
  useEffect(() => {
    // Verificar se o usuário já está logado
    if (AuthManager.isLoggedIn()) {
      console.log('Usuário já logado, redirecionando para dashboard...')
      // Se o usuário estiver logado, redirecionar para o dashboard
      window.location.href = '/dashboard'
      return
    }
  }, [])

  return <BrilhoOriginalOnboarding />
}
