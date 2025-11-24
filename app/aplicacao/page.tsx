"use client"

import { useState } from "react"
import { MultiStepForm } from "@/components/multi-step-form"
import { CompletionPage } from "@/components/completion-page"

export default function AplicacaoPage() {
  const [isComplete, setIsComplete] = useState(false)

  if (isComplete) {
    return <CompletionPage />
  }

  return <MultiStepForm onComplete={() => setIsComplete(true)} />
}
