import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

// Função para gerar o idUnico no formato "empresaome-brandplot"
function generateIdUnico(companyName: string): string {
  const cleanName = companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]/g, "") // Remove caracteres especiais
    .trim()
  
  return `${cleanName}-brandplot`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { formData, cachedData } = body

    const supabaseUrl = process.env.SUPABASE_URL ||
      "https://znkfwlpgsxxawucacmda.supabase.co"
    const supabaseKey = process.env.SUPABASE_KEY

    if (!supabaseKey) {
      console.error("Supabase key not configured")
      return NextResponse.json(
        { error: "Supabase key não configurada" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey as string)

    const companyName = formData.companyName || cachedData?.companyName

    if (!companyName) {
      return NextResponse.json({ error: "Nome da empresa é obrigatório" }, { status: 400 })
    }    // Gera o idUnico baseado no nome da empresa
    const generatedIdUnico = generateIdUnico(companyName)

    // Atualiza o registro existente da empresa
    const updateData: any = {
      nome_cliente: formData.name || null,
      email: formData.email || null,
      telefone: formData.phone || null,
    }

    // Criptografa a senha se fornecida
    if (formData.password) {
      const saltRounds = 12
      updateData.senha = await bcrypt.hash(formData.password, saltRounds)
    }

    // Adiciona o idUnico gerado aos dados de atualização
    updateData.idUnico = generatedIdUnico

    if ((!updateData.email || !updateData.telefone) && cachedData?.answers) {
      try {
        const contact = JSON.parse(cachedData.answers[9] || "{}")
        if (!updateData.email) updateData.email = contact.email || null
        if (!updateData.telefone) updateData.telefone = contact.phone || null
      } catch {
        /* ignore parse errors */
      }
    }

    if (cachedData?.analysis) {
      updateData.diagnostico = cachedData.analysis
    }    if (cachedData?.answers) {
      cachedData.answers.forEach((ans: string, idx: number) => {
        // answers[0] is company name - salvar no campo nome_empresa
        if (idx === 0) {
          updateData.nome_empresa = ans || null
        }
        // answers[1-8] map to resposta_1 through resposta_8
        // answers[9] is contact info (handled separately)
        else if (idx >= 1 && idx <= 8) {
          updateData[`resposta_${idx}`] = ans || null
        }
      })
    }

    // Busca registro existente prioritariamente por idUnico gerado
    const { data: existing, error: selectError } = await supabase
      .from("brandplot")
      .select("id, idUnico, nome_empresa")
      .eq("idUnico", generatedIdUnico)
      .maybeSingle()

    if (selectError) {
      console.error("Erro ao buscar registro:", selectError.message)
      return NextResponse.json(
        { error: "Erro ao verificar registro" },
        { status: 500 }
      )
    }

    let dbError

    if (existing) {
      const { error } = await supabase
        .from("brandplot")
        .update(updateData)
        .eq("id", existing.id)

      dbError = error    } else {
      // Se não existe registro, cria um novo com o idUnico gerado
      const insertData = { 
        nome_empresa: companyName,
        idUnico: generatedIdUnico,
        ...updateData 
      }
      
      const { error } = await supabase.from("brandplot").insert(insertData)
      dbError = error
    }

    if (dbError) {
      console.error("Erro ao salvar registro:", dbError.message)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: "Erro no registro" }, { status: 500 })
  }
}
