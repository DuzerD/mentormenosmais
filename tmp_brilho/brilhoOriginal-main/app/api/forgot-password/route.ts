import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"
import nodemailer from "nodemailer"

// Configuração do servidor de email (usando Gmail como exemplo)
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Seu email
      pass: process.env.EMAIL_PASSWORD, // Senha de app do Gmail
    },
  })
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL || "https://znkfwlpgsxxawucacmda.supabase.co"
    const supabaseKey = process.env.SUPABASE_KEY

    if (!supabaseKey) {
      console.error("Supabase key not configured")
      return NextResponse.json(
        { error: "Configuração do servidor indisponível" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey as string)

    // Verificar se o email existe no banco de dados
    const { data: user, error: selectError } = await supabase
      .from("brandplot")
      .select("id, email, nome_empresa")
      .eq("email", email)
      .maybeSingle()

    if (selectError) {
      console.error("Error checking email:", selectError)
      return NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: "Email não encontrado em nossa base de dados" },
        { status: 404 }
      )
    }

    // Gerar token JWT com expiração de 15 minutos
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-change-in-production"
    const token = jwt.sign(
      { 
        email: user.email,
        userId: user.id,
        type: "password-reset"
      },
      jwtSecret,
      { expiresIn: "15m" }
    )

    // Criar link de redefinição
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const resetLink = `${baseUrl}/reset-password?token=${token}`

    // Configurar e enviar email
    const transporter = createEmailTransporter()
    
    const mailOptions = {
      from: {
        name: 'BrandPlot',
        address: process.env.EMAIL_USER || 'noreply@brilhooriginal.com'
      },
      to: email,
      subject: 'Redefinição de senha - BrandPlot',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinição de senha</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, #c8b79e, #b09e85);
              border-radius: 50%;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 24px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #c8b79e, #b09e85);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
              transition: all 0.3s ease;
            }
            .button:hover {
              background: linear-gradient(135deg, #d0c0a8, #c8b79e);
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              color: #856404;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">BO</div>
              <h1>Redefinir sua senha</h1>
              <p>Olá! Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            </div>
            
            <div style="text-align: center;">
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <a href="${resetLink}" class="button">Redefinir Senha</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Este link expira em <strong>15 minutos</strong></li>
                <li>Use este link apenas uma vez</li>
                <li>Se você não solicitou esta alteração, ignore este email</li>
              </ul>
            </div>
            
            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${resetLink}
            </p>
            
            <div class="footer">
              <p>Esta é uma mensagem automática, não responda este email.</p>
              <p>&copy; ${new Date().getFullYear()} BrandPlot. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    // Enviar email
    await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      message: "Email de redefinição enviado com sucesso"
    })

  } catch (error) {
    console.error("Error in forgot-password API:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
