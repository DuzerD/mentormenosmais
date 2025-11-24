import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.json()

    // Prepare email content
    const emailContent = `
Nova Aplicação Recebida
======================

Nome: ${formData.name}
Instagram: ${formData.instagram}
Faturamento Mensal: ${formData.revenue}
Gasto em Marketing: ${formData.marketingSpend}
Número de Colaboradores: ${formData.employees}

Descrição do Negócio:
${formData.businessDescription}

---
Data de Submissão: ${new Date().toLocaleString("pt-BR")}
    `.trim()

    // Send email using a simple mailto approach or email service
    // For production, you would use an email service like Resend, SendGrid, or Postmark
    console.log("[v0] Form submission:", formData)
    console.log("[v0] Email to be sent to: victor.romaris@gmail.com")
    console.log("[v0] Email content:", emailContent)

    // Here you would integrate with an email service
    // Example with fetch to an email API:
    /*
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'formulario@seudominio.com',
        to: 'victor.romaris@gmail.com',
        subject: 'Nova Aplicação Recebida',
        text: emailContent,
      }),
    })
    */

    return NextResponse.json({ success: true, message: "Formulário enviado com sucesso!" })
  } catch (error) {
    console.error("[v0] Error submitting form:", error)
    return NextResponse.json({ success: false, message: "Erro ao enviar formulário" }, { status: 500 })
  }
}
