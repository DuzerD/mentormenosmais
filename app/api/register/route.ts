import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import nodemailer from "nodemailer"

function generateIdUnico(companyName: string): string {
  const cleanName = companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim()

  return `${cleanName}-brandplot`
}

const DEFAULT_SUPABASE_URL = process.env.SUPABASE_URL ?? "https://znkfwlpgsxxawucacmda.supabase.co"
const DEFAULT_ONBOARDING_PASSWORD = process.env.DEFAULT_ONBOARDING_PASSWORD ?? "novamarca123"
const HAS_SUPABASE = Boolean(process.env.SUPABASE_KEY)
const ENABLE_MOCK = !HAS_SUPABASE || process.env.NEXT_PUBLIC_DASHBOARD_MOCK === "true"
const DEFAULT_EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME ?? "BrandPlot"
const BASE_APP_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "")

async function sendDefaultPasswordEmail(options: {
  to: string
  customerName?: string | null
  companyName?: string | null
  password: string
}) {
  const emailUser = process.env.EMAIL_USER
  const emailPassword = process.env.EMAIL_PASSWORD

  if (!emailUser || !emailPassword) {
    console.warn("[register] Email credentials missing; skipping default password email")
    return
  }

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE ?? "gmail",
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  })

  const recipientName = options.customerName?.trim() || options.companyName?.trim() || "Mentorado"
  const loginUrl = `${BASE_APP_URL}/login`

  const textContent = [
    `Olá ${recipientName},`,
    "",
    "Montamos seu acesso à plataforma BrandPlot.",
    `Use as credenciais abaixo para entrar:`, 
    `Email: ${options.to}`,
    `Senha temporária: ${options.password}`,
    "",
    `Acesse: ${loginUrl}`,
    "",
    'Recomendamos alterar a senha assim que entrar, usando a opção "Esqueci minha senha" ou pelo menu de perfil.',
    "",
    "Se tiver qualquer dúvida, fale com a gente.",
    "",
    "Equipe BrandPlot",
  ].join("\n")

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Seu acesso BrandPlot</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f5f5f6; margin: 0; padding: 24px; color: #1f2937; }
          .wrapper { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 15px 45px rgba(31, 41, 55, 0.08); }
          .brand { text-align: center; margin-bottom: 24px; }
          .brand-name { font-size: 20px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #6b21a8; }
          .headline { font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #111827; }
          .paragraph { font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
          .credentials { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0; }
          .credential-item { margin: 0 0 8px; font-size: 14px; color: #111827; }
          .credential-item strong { display: block; font-size: 13px; color: #6b21a8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
          .cta { display: inline-block; margin: 12px 0 4px; padding: 13px 28px; background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; border-radius: 999px; font-weight: 600; text-decoration: none; }
          .note { font-size: 13px; color: #6b7280; margin-bottom: 20px; }
          .footer { font-size: 12px; color: #9ca3af; text-align: center; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="brand">
            <div class="brand-name">${DEFAULT_EMAIL_FROM_NAME}</div>
          </div>
          <h1 class="headline">Olá ${recipientName}, seu acesso está liberado.</h1>
          <p class="paragraph">
            Preparamos seu login com a senha padrão para que você entre imediatamente na plataforma.
          </p>
          <div class="credentials">
            <p class="credential-item">
              <strong>Email</strong>
              ${options.to}
            </p>
            <p class="credential-item">
              <strong>Senha temporária</strong>
              ${options.password}
            </p>
          </div>
          <a class="cta" href="${loginUrl}" target="_blank" rel="noopener">Acessar o BrandPlot</a>
          <p class="note">
            Recomendamos alterar a senha assim que entrar. Você pode fazer isso pela opção "Esqueci minha senha" ou nas configurações da sua conta.
          </p>
          <p class="paragraph">
            Qualquer dúvida é só responder este email ou chamar nosso time de suporte.
          </p>
          <div class="footer">
            &copy; ${new Date().getFullYear()} ${DEFAULT_EMAIL_FROM_NAME}. Todos os direitos reservados.
          </div>
        </div>
      </body>
    </html>
  `

  await transporter.sendMail({
    from: {
      name: DEFAULT_EMAIL_FROM_NAME,
      address: emailUser,
    },
    to: options.to,
    subject: "Seu acesso ao BrandPlot",
    text: textContent,
    html: htmlContent,
  })

  console.info(`[register] Senha padrão enviada para ${options.to}`)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { formData = {}, cachedData } = body ?? {}

    const companyName = formData.companyName || cachedData?.companyName || "Marca Demo"
    if (!companyName) {
      return NextResponse.json({ error: "Nome da empresa e obrigatorio" }, { status: 400 })
    }

    const generatedIdUnico = generateIdUnico(companyName)

    if (ENABLE_MOCK) {
      return NextResponse.json({
        success: true,
        mock: {
          idUnico: generatedIdUnico,
          email: formData.email ?? "demo@menosmais.app",
        },
      })
    }

    const supabase = createClient(DEFAULT_SUPABASE_URL, process.env.SUPABASE_KEY as string)

    const saltRounds = 12
    let hashedPassword: string | null = null
    let usedDefaultPassword = false
    let insertedUserEmail: string | null = null
    let insertedCustomerName: string | null = null

    if (formData.password) {
      hashedPassword = await bcrypt.hash(formData.password, saltRounds)
    }

    const updateData: Record<string, any> = {
      nome_cliente: formData.name || null,
      email: formData.email || null,
      telefone: formData.phone || null,
      idUnico: generatedIdUnico,
    }

    if (hashedPassword) {
      updateData.senha = hashedPassword
    }

    if ((!updateData.email || !updateData.telefone) && cachedData?.answers) {
      try {
        const contact = JSON.parse(cachedData.answers[9] || "{}")
        if (!updateData.nome_cliente) updateData.nome_cliente = contact.name || null
        if (!updateData.email) updateData.email = contact.email || null
        if (!updateData.telefone) updateData.telefone = contact.phone || null
      } catch {
        // ignore parse errors
      }
    }

    if (cachedData?.analysis) {
      updateData.diagnostico = cachedData.analysis
    }

    if (cachedData?.answers) {
      cachedData.answers.forEach((ans: string, idx: number) => {
        if (idx === 0) {
          updateData.nome_empresa = ans || null
        } else if (idx >= 1 && idx <= 8) {
          updateData[`resposta_${idx}`] = ans || null
        }
      })
    }

    const { data: existing, error: selectError } = await supabase
      .from("brandplot")
      .select("id, idUnico, nome_empresa")
      .eq("idUnico", generatedIdUnico)
      .maybeSingle()

    if (selectError) {
      console.error("Erro ao buscar registro:", selectError.message)
      return NextResponse.json({ error: "Erro ao verificar registro" }, { status: 500 })
    }

    let dbError

    if (existing) {
      const { error } = await supabase.from("brandplot").update(updateData).eq("id", existing.id)
      dbError = error
    } else {
      if (!hashedPassword) {
        hashedPassword = await bcrypt.hash(DEFAULT_ONBOARDING_PASSWORD, saltRounds)
        usedDefaultPassword = true
      }

      updateData.senha = hashedPassword

      const insertData = {
        nome_empresa: companyName,
        idUnico: generatedIdUnico,
        ...updateData,
      }

      const { error } = await supabase.from("brandplot").insert(insertData)
      if (!error) {
        insertedUserEmail = insertData.email ?? null
        insertedCustomerName = insertData.nome_cliente ?? null
      }
      dbError = error
    }

    if (dbError) {
      console.error("Erro ao salvar registro:", dbError.message)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    if (usedDefaultPassword && insertedUserEmail) {
      try {
        await sendDefaultPasswordEmail({
          to: insertedUserEmail,
          customerName: insertedCustomerName,
          companyName,
          password: DEFAULT_ONBOARDING_PASSWORD,
        })
      } catch (emailError) {
        console.error("Erro ao enviar email com senha padrão:", emailError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Erro no registro:", err)
    return NextResponse.json({ error: "Erro no registro" }, { status: 500 })
  }
}
