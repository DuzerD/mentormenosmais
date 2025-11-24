import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const DEFAULT_SUPABASE_URL = process.env.SUPABASE_URL ?? "https://znkfwlpgsxxawucacmda.supabase.co"
const HAS_SUPABASE = Boolean(process.env.SUPABASE_KEY)
const ENABLE_MOCK = !HAS_SUPABASE || process.env.NEXT_PUBLIC_DASHBOARD_MOCK === "true"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body ?? {}

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    if (ENABLE_MOCK) {
      return NextResponse.json({
        success: true,
        user: {
          id: "mock-user",
          name: "Mentorado Demo",
          email,
          company: "Marca Demo",
          idUnico: "demo-brandplot",
          missaoLiberada: "missao_3",
        },
        message: "Login de protótipo efetuado",
      })
    }

    const supabase = createClient(DEFAULT_SUPABASE_URL, process.env.SUPABASE_KEY as string)

    const { data: users, error: selectError } = await supabase
      .from("brandplot")
      .select("id, nome_cliente, email, senha, nome_empresa, idUnico, missaoLiberada")
      .eq("email", email.toLowerCase().trim())

    if (selectError) {
      console.error("Erro ao buscar usuário:", selectError.message)
      return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "Email não encontrado" }, { status: 401 })
    }

    const user = users[0]

    if (!user.senha) {
      return NextResponse.json({ error: "Usuário ainda não completou o cadastro" }, { status: 401 })
    }

    const isPasswordValid = await bcrypt.compare(password, user.senha)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })
    }

    if (!user.missaoLiberada) {
      return NextResponse.json(
        {
          error:
            "Seu pagamento ainda está em processamento. Assim que o Mercado Pago confirmar, enviaremos o acesso por e-mail.",
        },
        { status: 403 },
      )
    }

    const userResponse = {
      id: user.id,
      name: user.nome_cliente,
      email: user.email,
      company: user.nome_empresa,
      idUnico: user.idUnico,
      missaoLiberada: user.missaoLiberada,
    }

    return NextResponse.json({
      success: true,
      user: userResponse,
      message: "Login realizado com sucesso",
    })
  } catch (err) {
    console.error("Erro no login:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
