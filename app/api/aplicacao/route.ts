import { NextResponse } from "next/server"

type ApplicationPayload = {
  name: string
  email: string
  phone: string
  instagram: string
  revenue: string
  marketing: string
  teamSize: string
  businessModel: string
}

export async function POST(request: Request) {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const to = process.env.WHATSAPP_TO || "+5511974564367"

  if (!token || !phoneNumberId) {
    return NextResponse.json(
      { error: "Configuração do WhatsApp ausente. Defina WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID." },
      { status: 500 }
    )
  }

  const payload = (await request.json()) as Partial<ApplicationPayload>
  const requiredFields: (keyof ApplicationPayload)[] = [
    "name",
    "email",
    "phone",
    "instagram",
    "revenue",
    "marketing",
    "teamSize",
    "businessModel",
  ]

  const missing = requiredFields.filter((field) => !payload[field])
  if (missing.length) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes", missing }, { status: 400 })
  }

  const bodyText = [
    "Nova aplicação recebida:",
    `Nome: ${payload.name}`,
    `E-mail: ${payload.email}`,
    `Telefone: ${payload.phone}`,
    `Instagram: ${payload.instagram}`,
    `Faturamento: ${payload.revenue}`,
    `Gasto em marketing: ${payload.marketing}`,
    `Colaboradores: ${payload.teamSize}`,
    `Modelo de negócio: ${payload.businessModel}`,
  ].join("\n")

  const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { preview_url: false, body: bodyText },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    return NextResponse.json(
      { error: "Falha ao enviar para o WhatsApp", details: errorText || response.statusText },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true })
}
