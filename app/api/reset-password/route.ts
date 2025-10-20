import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    // Suporte para diferentes formatos de envio
    const body = await request.json()
    const authHeader = request.headers.get('authorization')
    
    // Extrair token do header Authorization ou do body
    const token = authHeader?.replace('Bearer ', '') || body.token
    
    // Aceitar tanto 'password' quanto 'newPassword'
    const password = body.password || body.newPassword
    const confirmPassword = body.confirmPassword

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token e senha são obrigatórios" },
        { status: 400 }
      )
    }

    if (!confirmPassword) {
      return NextResponse.json(
        { error: "Confirme a nova senha" },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "As senhas não coincidem" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      )
    }

    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-change-in-production"

    let decodedToken: any
    try {
      decodedToken = jwt.verify(token, jwtSecret)
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { error: "Link expirado. Solicite um novo link de redefinição." },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: "Link inválido" },
        { status: 400 }
      )
    }

    if (decodedToken.type !== "password-reset") {
      return NextResponse.json(
        { error: "Token inválido" },
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

    // Verificar se o usuário ainda existe
    const { data: user, error: selectError } = await supabase
      .from("brandplot")
      .select("id, email")
      .eq("email", decodedToken.email)
      .eq("id", decodedToken.userId)
      .maybeSingle()

    if (selectError) {
      console.error("Error checking user:", selectError)
      return NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Criptografar a nova senha
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Atualizar a senha no banco de dados
    const { error: updateError } = await supabase
      .from("brandplot")
      .update({ 
        senha: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating password:", updateError)
      return NextResponse.json(
        { error: "Erro ao atualizar senha" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Senha redefinida com sucesso"
    })

  } catch (error) {
    console.error("Error in reset-password API:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// API para verificar se o token é válido
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 400 }
      )
    }

    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-change-in-production"
    
    try {
      const decodedToken = jwt.verify(token, jwtSecret) as any
      
      if (decodedToken.type !== "password-reset") {
        return NextResponse.json(
          { error: "Token inválido" },
          { status: 400 }
        )
      }

      return NextResponse.json({
        valid: true,
        email: decodedToken.email
      })

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { error: "Link expirado" },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("Error verifying token:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
