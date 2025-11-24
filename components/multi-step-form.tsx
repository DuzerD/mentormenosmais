"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface FormData {
  name: string
  instagram: string
  revenue: string
  marketingSpend: string
  employees: string
  businessDescription: string
}

interface MultiStepFormProps {
  onComplete: () => void
}

const revenueOptions = [
  "Menos de 10 mil por mês",
  "De 10 a 20 mil por mês",
  "De 20 a 30 mil por mês",
  "De 30 a 50 mil por mês",
]

const marketingSpendOptions = [
  "Menos de 5 mil reais por mês",
  "De 5 a 10 mil reais por mês",
  "De 10 a 20 mil reais por mês",
  "De 20 a 30 mil reais por mês",
  "De 30 a 50 mil reais por mês",
  "De 50 a 100 mil reais por mês",
  "Mais de 100 mil reais por mês",
]

export function MultiStepForm({ onComplete }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    instagram: "",
    revenue: "",
    marketingSpend: "",
    employees: "",
    businessDescription: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = 6
  const progress = (currentStep / totalSteps) * 100

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== ""
      case 2:
        return formData.instagram.trim() !== ""
      case 3:
        return formData.revenue !== ""
      case 4:
        return formData.marketingSpend !== ""
      case 5:
        return formData.employees.trim() !== ""
      case 6:
        return formData.businessDescription.trim() !== ""
      default:
        return false
    }
  }

  const handleNext = async () => {
    if (currentStep === totalSteps) {
      setIsSubmitting(true)
      try {
        const response = await fetch("/api/submit-form", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        const result = await response.json()
        console.log("[v0] Form submission result:", result)

        if (result.success) {
          onComplete()
        } else {
          alert("Erro ao enviar formulário. Por favor, tente novamente.")
        }
      } catch (error) {
        console.error("[v0] Error submitting form:", error)
        alert("Erro ao enviar formulário. Por favor, tente novamente.")
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[520px]">
        {/* Form Content */}
        <div className="animate-fade-in">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[28px] leading-[1.3] font-semibold text-gray-900 mb-2">
                  1. Qual é o seu nome completo
                </h2>
              </div>
              <div>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className="w-full text-base px-5 py-6 bg-white border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
                  placeholder="Nome completo"
                />
              </div>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="w-full py-6 text-base font-medium bg-[#222052] hover:bg-[#1a1840] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Enviando..." : "Continuar"}
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[28px] leading-[1.3] font-semibold text-gray-900 mb-2">
                  2. Qual @ do seu Instagram ou da sua empresa
                </h2>
              </div>
              <div>
                <Input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => updateFormData("instagram", e.target.value)}
                  className="w-full text-base px-5 py-6 bg-white border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400 placeholder:italic"
                  placeholder="Digite @ da sua empresa"
                />
              </div>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="w-full py-6 text-base font-medium bg-[#222052] hover:bg-[#1a1840] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Enviando..." : "Continuar"}
              </Button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[28px] leading-[1.3] font-semibold text-gray-900 mb-2">
                  3. Qual faturamento mensal da sua empresa?
                </h2>
                <p className="text-gray-600 text-base mt-2">
                  Preencha com base no faturamento mensal atual da sua operação:
                </p>
              </div>
              <div className="space-y-3">
                {revenueOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => updateFormData("revenue", option)}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl border transition-all ${
                      formData.revenue === option
                        ? "border-gray-400 bg-gray-100"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        formData.revenue === option ? "border-gray-900 bg-gray-900" : "border-gray-400 bg-white"
                      }`}
                    >
                      {formData.revenue === option && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M2 7L6 11L12 3"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-base text-gray-900">{option}</span>
                  </button>
                ))}
              </div>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="w-full py-6 text-base font-medium bg-[#222052] hover:bg-[#1a1840] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Enviando..." : "Continuar"}
              </Button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[28px] leading-[1.3] font-semibold text-gray-900 mb-2">
                  4. Qual seu gasto no setor de Marketing atualmente
                </h2>
                <p className="text-gray-600 text-base mt-2">Custos variáveis e fixos:</p>
              </div>
              <div className="space-y-3">
                {marketingSpendOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => updateFormData("marketingSpend", option)}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl border transition-all ${
                      formData.marketingSpend === option
                        ? "border-gray-400 bg-gray-100"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.marketingSpend === option ? "border-gray-900" : "border-gray-400"
                      }`}
                    >
                      {formData.marketingSpend === option && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                    </div>
                    <span className="text-base text-gray-900">{option}</span>
                  </button>
                ))}
              </div>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="w-full py-6 text-base font-medium bg-[#222052] hover:bg-[#1a1840] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Enviando..." : "Continuar"}
              </Button>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[28px] leading-[1.3] font-semibold text-gray-900 mb-2">
                  5. Quantos colaboradores você possui na sua empresa?
                </h2>
              </div>
              <div>
                <Input
                  type="text"
                  value={formData.employees}
                  onChange={(e) => updateFormData("employees", e.target.value)}
                  className="w-full text-base px-5 py-6 bg-white border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400 placeholder:italic"
                  placeholder="Número de colaboradores"
                />
              </div>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="w-full py-6 text-base font-medium bg-[#222052] hover:bg-[#1a1840] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Enviando..." : "Continuar"}
              </Button>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[28px] leading-[1.3] font-semibold text-gray-900 mb-2">
                  6. Descreva em algumas palavras do seu modelo de negócio
                </h2>
                <p className="text-gray-600 text-sm italic mt-2">
                  Exemplo: "Tenho uma agência de marketing digital com 8 colaboradores e quero dobrar meu faturamento
                  nos próximos 12 meses"
                </p>
              </div>
              <div className="relative">
                <Textarea
                  value={formData.businessDescription}
                  onChange={(e) => updateFormData("businessDescription", e.target.value)}
                  maxLength={200}
                  className="w-full text-base px-5 py-4 bg-white border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400 placeholder:italic min-h-[140px] resize-none"
                  placeholder="Descreva aqui..."
                />
                <div className="absolute bottom-3 right-3 text-sm text-gray-500">
                  {formData.businessDescription.length}/200
                </div>
              </div>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="w-full py-6 text-base font-medium bg-[#222052] hover:bg-[#1a1840] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Enviando..." : "Continuar"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
