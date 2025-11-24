'use client'

import type { ChangeEventHandler } from "react"
import { useMemo, useState } from "react"

const revenueOptions = [
  "Menos de 500 mil por ano",
  "De 500 a 700 mil por ano",
  "De 700 mil a 1 milhão por ano",
  "De 1 milhão a 5 milhões por ano",
  "De 5 a 10 milhões por ano",
  "Mais de 10 milhões por ano",
]

const marketingOptions = [
  "Menos de 5 mil reais por mês",
  "De 5 a 10 mil reais por mês",
  "De 10 a 20 mil reais por mês",
  "De 20 a 30 mil reais por mês",
  "De 30 a 50 mil reais por mês",
  "De 50 a 100 mil reais por mês",
  "Mais de 100 mil reais por mês",
]

type FormState = {
  name: string
  email: string
  phone: string
  instagram: string
  revenue: string
  marketing: string
  teamSize: string
  businessModel: string
}

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  instagram: "",
  revenue: "",
  marketing: "",
  teamSize: "",
  businessModel: "",
}

const totalSteps = 6
const primaryButton = "bg-[#222052] hover:bg-[#1b1a44] text-white force-white"

export default function AplicacaoPage() {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<FormState>(initialState)
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState("")
  const charLimit = 200

  const isNextDisabled = useMemo(() => {
    switch (step) {
      case 1:
        return !formData.name || !formData.email || !formData.phone
      case 2:
        return !formData.instagram
      case 3:
        return !formData.revenue
      case 4:
        return !formData.marketing
      case 5:
        return !formData.teamSize
      case 6:
        return !formData.businessModel
      default:
        return false
    }
  }, [formData, step])

  const progressValue = Math.min((step / totalSteps) * 100, 100)
  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_TO || "+5511974564367").replace(/[^0-9]/g, "")

  const buildWhatsappMessage = (data: FormState) => {
    return [
      "Nova aplicacao recebida:",
      `Nome: ${data.name}`,
      `E-mail: ${data.email}`,
      `Telefone: ${data.phone}`,
      `Instagram: ${data.instagram}`,
      `Faturamento: ${data.revenue}`,
      `Gasto em marketing: ${data.marketing}`,
      `Colaboradores: ${data.teamSize}`,
      `Modelo de negocio: ${data.businessModel}`,
    ].join("\n")
  }

  const handleNext = async () => {
    if (step === totalSteps) {
      setSendError("")
      setIsSending(true)
      try {
        const message = buildWhatsappMessage(formData)
        const url = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`
        window.open(url, "_blank")

        setSubmitted(true)
      } catch (error) {
        setSendError("Nao foi possivel abrir o WhatsApp agora. Tente novamente.")
      } finally {
        setIsSending(false)
      }
      return
    }
    setStep((prev) => Math.min(prev + 1, totalSteps))
  }
  const handleSelect = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#222052] text-white font-semibold">
                M
              </div>
              <div>
                <p className="text-sm text-slate-500">Mentoor</p>
                <p className="text-base font-semibold text-slate-900">Aplicação enviada</p>
              </div>
            </div>
            <span className="text-sm text-slate-500">Obrigado por se inscrever</span>
          </div>
        </header>

        <section className="mx-auto max-w-4xl space-y-6 px-6 py-12">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#222052]">
              Sucesso
            </p>
            <h1 className="text-4xl font-bold leading-tight text-slate-900">
              APLICAÇÃO ENVIADA COM SUCESSO
            </h1>
            <p className="text-lg text-slate-600">Mas ainda não acabou…</p>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Material liberado por tempo limitado!
              </p>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div className="rounded-xl bg-gradient-to-br from-white via-emerald-50 to-emerald-100 p-6 shadow-inner">
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                        Imagem do material
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-emerald-900">
                        Fature Falando Menos
                      </h3>
                    </div>
                    <div className="mt-6 h-28 rounded-lg border border-emerald-200 bg-white/80 text-emerald-700 shadow-sm flex items-center justify-center text-center text-sm font-semibold">
                      Pré-visualização
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-slate-700">
                    Como ter um discurso claro que te permite falar menos e vender mais. Não é um curso.
                    Não é teoria. É o primeiro passo estratégico para empreendedores que querem parar de
                    perder dinheiro com comunicação rasa.
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">
                      Fature Falando Menos — <span className="line-through text-slate-400">R$ 99,90</span>{" "}
                      <span className="text-emerald-700">R$ 0,00 (grátis)</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#222052] px-4 py-3 text-white force-white shadow-md">
                    <p className="text-sm font-semibold">
                      Escreva a palavra "menos" no direct do Menos é Mais (@menosmaistd) e garanta seu material
                      exclusivo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#222052] text-white font-semibold">
              M
            </div>
            <div>
              <p className="text-sm text-slate-500">Mentoor</p>
              <p className="text-base font-semibold text-slate-900">Aplicação</p>
            </div>
          </div>
          <span className="text-sm text-slate-500">Processo de aplicação em {totalSteps} etapas</span>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#222052]">Etapa {step} de {totalSteps}</p>
                <h1 className="mt-1 text-3xl font-semibold leading-tight text-slate-900">
                  Envie sua aplicação
                </h1>
                <p className="mt-2 text-sm text-slate-500">seja o proximo case</p>
              </div>
            </div>

            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#222052] transition-all"
                style={{ width: `${progressValue}%` }}
              />
            </div>

            <div className="mt-8 space-y-6">
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-slate-900">Informações básicas</h2>
                  <Field
                    label="Nome"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                  <Field
                    label="E-mail"
                    placeholder="seuemail@empresa.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    type="email"
                  />
                  <Field
                    label="Telefone"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    type="tel"
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-slate-900">Instagram do participante</h2>
                  <Field
                    label='Qual @ do seu Instagram ou da sua empresa?'
                    placeholder="@seuusuario"
                    value={formData.instagram}
                    onChange={(e) => handleInputChange("instagram", e.target.value)}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Qual faturamento anual da sua empresa?</h2>
                    <p className="text-sm text-slate-500">
                      Preencha com base na projeção anual do ano corrente ou faturamento fechado do ano passado.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {revenueOptions.map((option) => (
                      <SelectCard
                        key={option}
                        selected={formData.revenue === option}
                        onClick={() => handleSelect("revenue", option)}
                        label={option}
                      />
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Qual seu gasto no setor de Marketing atualmente?</h2>
                    <p className="text-sm text-slate-500">Custos variáveis e fixos:</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {marketingOptions.map((option) => (
                      <SelectCard
                        key={option}
                        selected={formData.marketing === option}
                        onClick={() => handleSelect("marketing", option)}
                        label={option}
                      />
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-slate-900">Número de colaboradores</h2>
                  <Field
                    label="Quantos colaboradores você possui na sua empresa?"
                    placeholder="Ex.: 12"
                    value={formData.teamSize}
                    onChange={(e) => handleInputChange("teamSize", e.target.value)}
                    type="number"
                  />
                </div>
              )}

              {step === 6 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Descreva em algumas palavras do seu Modelo de negocio</h2>
                    <p className="text-sm text-slate-500">
                      Exemplo: “Sou fundador de uma empresa de consultorias online, tenho 14 colaboradores na empresa e
                      busco alcançar os 8 dígitos de faturamento em 2026.”
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-800">
                      Modelo de negocio
                    </label>
                    <textarea
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-[#222052]/50 focus:outline-none focus:ring-2 focus:ring-[#222052]/20"
                      rows={5}
                      maxLength={charLimit}
                      placeholder="Descreva em até 200 caracteres"
                      value={formData.businessModel}
                      onChange={(e) => handleInputChange("businessModel", e.target.value)}
                    />
                    <div className="text-right text-xs text-slate-500">
                      {formData.businessModel.length}/{charLimit}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">
                  Mantenha seus dados atualizados para agilizar nossa resposta.
                </div>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isNextDisabled || isSending}
                  className={`${primaryButton} w-full rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
                >
                  {isSending ? "Enviando..." : step === totalSteps ? "Enviar aplicacao" : "Continuar"}
                </button>
              </div>
              {sendError && <p className="text-sm text-red-600">{sendError}</p>}
            </div>
          </div>
      </section>
    </main>
  )
}

type FieldProps = {
  label: string
  placeholder?: string
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  type?: string
}

function Field({ label, placeholder, value, onChange, type = "text" }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-800">{label}</label>
      <input
        type={type}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-[#222052]/50 focus:outline-none focus:ring-2 focus:ring-[#222052]/20"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

type SelectCardProps = {
  label: string
  selected?: boolean
  onClick: () => void
}

function SelectCard({ label, selected, onClick }: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left text-sm font-medium transition hover:border-[#222052] hover:text-[#222052] ${
        selected
          ? "border-[#222052] bg-[#222052]/10 text-[#222052]"
          : "border-slate-200 bg-white text-slate-800"
      }`}
    >
      <span className="pr-6">{label}</span>
      <span
        className={`h-5 w-5 rounded-full border ${
          selected ? "border-[#222052] bg-[#222052]" : "border-slate-300"
        }`}
      />
    </button>
  )
}

type InfoRowProps = {
  label: string
  value: string
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  )
}






