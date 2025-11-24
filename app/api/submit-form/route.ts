import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.json()

    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.APPLICATION_FROM_EMAIL || "onboarding@resend.dev"
    const toEmail = process.env.APPLICATION_TO_EMAIL || "victor.romaris@gmail.com"

    if (!resendApiKey) {
      console.error("[v0] Missing RESEND_API_KEY env var")
      return NextResponse.json(
        { success: false, message: "Configuracao de email ausente." },
        { status: 500 }
      )
    }

    const marketingValue = formData.marketingSpend || formData.marketing || ""
    const employeesValue = formData.employees || formData.teamSize || ""
    const businessValue = formData.businessDescription || formData.businessModel || ""

    const emailContent = `
Nova Aplicacao Recebida
======================

Nome: ${formData.name || ""}
E-mail: ${formData.email || ""}
Telefone: ${formData.phone || ""}
Instagram: ${formData.instagram || ""}
Faturamento: ${formData.revenue || ""}
Gasto em Marketing: ${marketingValue}
Numero de Colaboradores: ${employeesValue}

Descricao do Negocio / Modelo de Negocio:
${businessValue}

---
Data de Submissao: ${new Date().toLocaleString("pt-BR")}
    `.trim()

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: "Nova Aplicacao Recebida",
        text: emailContent,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error("[v0] Resend error:", errorText)
      return NextResponse.json(
        { success: false, message: "Erro ao enviar formulario." },
        { status: 500 }
      )
    }

    console.log("[v0] Form submission sent via Resend:", { toEmail, fromEmail })
    return NextResponse.json({ success: true, message: "Formulario enviado com sucesso!" })
  } catch (error) {
    console.error("[v0] Error submitting form:", error)
    return NextResponse.json({ success: false, message: "Erro ao enviar formulario" }, { status: 500 })
  }
}
