import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

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
const HAS_SUPABASE = Boolean(process.env.SUPABASE_KEY)
const ENABLE_MOCK = !HAS_SUPABASE || process.env.NEXT_PUBLIC_DASHBOARD_MOCK === "true"

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

    const updateData: Record<string, any> = {
      nome_cliente: formData.name || null,
      email: formData.email || null,
      telefone: formData.phone || null,
      idUnico: generatedIdUnico,
    }

    if (formData.password) {
      const saltRounds = 12
      updateData.senha = await bcrypt.hash(formData.password, saltRounds)
    }

    if ((!updateData.email || !updateData.telefone) && cachedData?.answers) {
      try {
        const contact = JSON.parse(cachedData.answers[9] || "{}")
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
      const insertData = {
        nome_empresa: companyName,
        idUnico: generatedIdUnico,
        ...updateData,
      }

      const { error } = await supabase.from("brandplot").insert(insertData)
      dbError = error
    }

    if (dbError) {
      console.error("Erro ao salvar registro:", dbError.message)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Erro no registro:", err)
    return NextResponse.json({ error: "Erro no registro" }, { status: 500 })
  }
}
