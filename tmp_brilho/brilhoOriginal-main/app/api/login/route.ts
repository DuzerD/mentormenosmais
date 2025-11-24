import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL ||
      "https://znkfwlpgsxxawucacmda.supabase.co"
    const supabaseKey = process.env.SUPABASE_KEY

    if (!supabaseKey) {
      console.error("Supabase key not configured")
      return NextResponse.json(
        { error: "Configuração do servidor indisponível" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey as string)

    // Busca o usuário pelo email
    const { data: users, error: selectError } = await supabase
      .from("brandplot")
      .select("id, nome_cliente, email, senha, nome_empresa, idUnico")
      .eq("email", email.toLowerCase().trim())

    if (selectError) {
      console.error("Erro ao buscar usuário:", selectError.message)
      return NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 }
      )
    }

    // Verifica se o usuário existe
    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "Email não encontrado" },
        { status: 401 }
      )
    }    // Se há múltiplos usuários com o mesmo email, pega o primeiro
    const user = users[0]

    // Verifica se a senha está cadastrada
    if (!user.senha) {
      return NextResponse.json(
        { error: "Usuário ainda não completou o cadastro" },
        { status: 401 }
      )
    }

    // Verifica a senha usando bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.senha)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Senha incorreta" },
        { status: 401 }
      )
    }

    // Login bem-sucedido - retorna dados do usuário (sem a senha)
    const userResponse = {
      id: user.id,
      name: user.nome_cliente,
      email: user.email,
      company: user.nome_empresa,
      idUnico: user.idUnico
    }

    return NextResponse.json({ 
      success: true, 
      user: userResponse,
      message: "Login realizado com sucesso"
    })

  } catch (err: any) {
    console.error("Erro no login:", err)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
