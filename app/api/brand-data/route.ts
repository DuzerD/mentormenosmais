import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type BrandRecord = Record<string, any>

const DEFAULT_SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://znkfwlpgsxxawucacmda.supabase.co"
const SUPABASE_KEY =
  process.env.SUPABASE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ""
const HAS_SUPABASE = Boolean(SUPABASE_KEY)
const ENABLE_MOCK = !HAS_SUPABASE || process.env.NEXT_PUBLIC_DASHBOARD_MOCK === "true"

const FALLBACK_STRATEGY = {
  marcaDesejada: {
    percepcaoDesejada: "Ser reconhecida como a marca que simplifica escolhas e entrega clareza.",
    direcaoComunicacao: "Mensagens objetivas, com linguagem humana e visual minimalista.",
    proximoPassoSugerido: "Transformar a Missao 1 em um plano trimestral com metas claras.",
  },
  reposicionamentoCriativo: {
    ideiasPraticas: [
      "Lancar uma serie de conteudos 'Menos e Mais' mostrando antes e depois de clientes.",
      "Criar um e-book enxuto com os pilares da filosofia Menos Mais.",
      "Convidar clientes para lives quinzenais compartilhando resultados reais.",
    ],
    novasFormasDeComunicar: {
      voz: "Mentora direta que aponta caminhos com carinho e firmeza.",
      estilo: "Visual limpo com toques de cor vibrante para destacar chamadas importantes.",
      canais: ["Instagram Reels", "Newsletter quinzenal", "Workshops ao vivo"],
    },
    briefingVisual: {
      paleta: "Roxo profundo, azul claro e off-white para contraste suave.",
      simbolos: "Linhas diagonais que representam movimento e focos de luz.",
      estilo: "Layouts com muito respiro, tipografia sem serifa e icones finos.",
    },
  },
  conexaoComNovosClientes: {
    acoesParaAtrair: [
      "Sequencia de emails com historias reais de transformacao.",
      "Checklist gratuito sobre como diagnosticar a marca em 15 minutos.",
      "Campanha de indicacao com bonus de sessao 1:1 com o mentor.",
    ],
    rituaisEComunidade: "Reunioes mensais 'Clube da Marca Clara' para celebrar avanços.",
  },
  planoDeAcaoEstrategico: {
    pilaresConteudo: [
      "Educacao: descomplicar conceitos de branding.",
      "Prova: bastidores e antes/depois de clientes.",
      "Oferta: convites diretos para as missoes pagas.",
    ],
    campanhas: [
      "Campanha de reabertura da Missao 1 com vagas limitadas.",
      "Serie 'Pergunte ao Mentor' focada em duvidas enviadas pelo publico.",
    ],
    acoesInternas: [
      "Mapear depoimentos recentes e atualizar o site em ate 30 dias.",
      "Criar um painel simples com os KPI das missoes no Notion.",
    ],
    acoesExternas: [
      "Parceria com duas influenciadoras de negocios minimalistas.",
      "Pitch semanal em comunidades de empreendedoras criativas.",
    ],
  },
  calendarioEditorial: [
    {
      semana: "Semana 1",
      ideiasDeConteudo: [
        "Post carrossel: 3 sinais de que sua marca esta confusa.",
        "Reel: bastidores do metodo Menos Mais em 30 segundos.",
        "Live curta apresentando a Sala da Marca.",
      ],
    },
    {
      semana: "Semana 2",
      ideiasDeConteudo: [
        "Email: historia de cliente com antes e depois.",
        "Post lista: checklist rapido de clareza de marca.",
        "Story com enquete para mapear dores do publico.",
      ],
    },
  ],
  novaBioInstagram:
    "Somos o Mentor Menos Mais. Estrategia clara, comunicacao simples e resultados reais.",
}

const FALLBACK_MOCK: BrandRecord = {
  idUnico: "demo-brandplot",
  nome_empresa: "Marca Demo",
  scoreDiagnostico: "68",
  missaoLiberada: "missao_1",
  missoesConcluidas: ["missao_1"],
  xpAtual: 140,
  xpProximoNivel: 200,
  nivelAtual: "Aprendiz",
  comparativoPercentual: 68,
  diagnosticoAnterior: JSON.stringify([
    { dimension: "Clareza", value: 48 },
    { dimension: "Consistencia", value: 36 },
    { dimension: "Visual", value: 28 },
    { dimension: "Execucao", value: 32 },
    { dimension: "Estrategia", value: 44 },
  ]),
  onboardingMetadata: JSON.stringify({
    missaoAtual: "missao_1",
    xpAtual: 140,
    xpProximoNivel: 200,
    nivelAtual: "Aprendiz",
    comparativoPercentual: 68,
    missoesConcluidas: ["missao_1"],
  }),
  estrategia: JSON.stringify(FALLBACK_STRATEGY),
}

  const mockStore = new Map<string, BrandRecord>()

function getMockKey(idUnico: string | null) {
  return idUnico && idUnico.trim() ? idUnico.trim() : FALLBACK_MOCK.idUnico
}

function getMockRecord(idUnico: string): BrandRecord {
  if (mockStore.has(idUnico)) {
    const existing = mockStore.get(idUnico)!
    const merged = {
      ...FALLBACK_MOCK,
      ...existing,
      idUnico,
    }
    mockStore.set(idUnico, merged)
    return merged
  }

  const seeded: BrandRecord = {
    ...FALLBACK_MOCK,
    idUnico,
    nome_empresa: idUnico === FALLBACK_MOCK.idUnico ? FALLBACK_MOCK.nome_empresa : `Marca ${idUnico}`,
  }

  mockStore.set(idUnico, seeded)
  return seeded
}

function mergeMockRecord(idUnico: string, updates: BrandRecord) {
  const existing = getMockRecord(idUnico)
  const next = { ...existing, ...updates }
  mockStore.set(idUnico, next)
  return next
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const idParam = url.searchParams.get("idUnico")

    if (!idParam && !ENABLE_MOCK) {
      return NextResponse.json({ error: "idUnico e obrigatorio" }, { status: 400 })
    }

    const idUnico = getMockKey(idParam)

    if (ENABLE_MOCK) {
      const data = getMockRecord(idUnico)
      return NextResponse.json({ success: true, data })
    }

    const supabase = createClient(DEFAULT_SUPABASE_URL, SUPABASE_KEY)
    const { data, error } = await supabase
      .from("brandplot")
      .select("*")
      .eq("idUnico", idUnico)
      .single()

    if (error) {
      console.error("Erro ao buscar dados da marca:", error)
      return NextResponse.json({ error: "Erro ao buscar dados da marca" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Marca nao encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("Erro na API brand-data:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const {
      estrategia,
      idUnico: idParam,
      enviadoDesigner,
      planoSelecionado,
      missaoLiberada,
      onboardingMetadata,
      xpAtual,
      xpProximoNivel,
      nivelAtual,
      comparativoPercentual,
      scoreDiagnostico,
      diagnosticoAnterior,
    } = body

    const idUnico = getMockKey(idParam)

    const hasUpdates =
      typeof estrategia !== "undefined" ||
      typeof enviadoDesigner !== "undefined" ||
      typeof planoSelecionado !== "undefined" ||
      typeof missaoLiberada !== "undefined" ||
      typeof onboardingMetadata !== "undefined" ||
      typeof xpAtual !== "undefined" ||
      typeof xpProximoNivel !== "undefined" ||
      typeof nivelAtual !== "undefined" ||
      typeof comparativoPercentual !== "undefined" ||
      typeof scoreDiagnostico !== "undefined" ||
      typeof diagnosticoAnterior !== "undefined"

    if (!hasUpdates) {
      return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 })
    }

    if (ENABLE_MOCK) {
      const updates: BrandRecord = {}

      if (typeof estrategia !== "undefined") {
        updates.estrategia = typeof estrategia === "string" ? estrategia : JSON.stringify(estrategia)
      }
      if (typeof enviadoDesigner !== "undefined") {
        updates.enviadoDesigner = enviadoDesigner
      }
      if (typeof planoSelecionado !== "undefined") {
        updates.planoSelecionado = planoSelecionado
      }
      if (typeof missaoLiberada !== "undefined") {
        updates.missaoLiberada = missaoLiberada
      }
      if (typeof xpAtual !== "undefined") {
        updates.xpAtual = xpAtual
      }
      if (typeof xpProximoNivel !== "undefined") {
        updates.xpProximoNivel = xpProximoNivel
      }
      if (typeof nivelAtual !== "undefined") {
        updates.nivelAtual = nivelAtual
      }
      if (typeof comparativoPercentual !== "undefined") {
        updates.comparativoPercentual = comparativoPercentual
      }
      if (typeof scoreDiagnostico !== "undefined") {
        updates.scoreDiagnostico = scoreDiagnostico
      }
      if (typeof diagnosticoAnterior !== "undefined") {
        updates.diagnosticoAnterior =
          typeof diagnosticoAnterior === "string"
            ? diagnosticoAnterior
            : JSON.stringify(diagnosticoAnterior)
      }
      if (typeof onboardingMetadata !== "undefined") {
        updates.onboardingMetadata =
          typeof onboardingMetadata === "string"
            ? onboardingMetadata
            : JSON.stringify(onboardingMetadata)
      }

      mergeMockRecord(idUnico, updates)
      return NextResponse.json({ success: true })
    }

    const supabase = createClient(DEFAULT_SUPABASE_URL, SUPABASE_KEY)

    const updateObj: Record<string, any> = {}
    if (typeof estrategia !== "undefined") updateObj.estrategia = JSON.stringify(estrategia)
    if (typeof enviadoDesigner !== "undefined") updateObj.enviadoDesigner = enviadoDesigner
    if (typeof planoSelecionado !== "undefined") updateObj.planoSelecionado = planoSelecionado
    if (typeof missaoLiberada !== "undefined") updateObj.missaoLiberada = missaoLiberada
    if (typeof xpAtual !== "undefined") updateObj.xpAtual = xpAtual
    if (typeof xpProximoNivel !== "undefined") updateObj.xpProximoNivel = xpProximoNivel
    if (typeof nivelAtual !== "undefined") updateObj.nivelAtual = nivelAtual
    if (typeof comparativoPercentual !== "undefined") updateObj.comparativoPercentual = comparativoPercentual
    if (typeof scoreDiagnostico !== "undefined") updateObj.scoreDiagnostico = scoreDiagnostico
    if (typeof diagnosticoAnterior !== "undefined")
      updateObj.diagnosticoAnterior = JSON.stringify(diagnosticoAnterior)
    if (typeof onboardingMetadata !== "undefined") updateObj.onboardingMetadata = JSON.stringify(onboardingMetadata)

    const { error } = await supabase.from("brandplot").update(updateObj).eq("idUnico", idUnico)

    if (error) {
      console.error("Erro ao atualizar dados:", error)
      return NextResponse.json({ error: "Erro ao atualizar dados" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Erro na API brand-data PATCH:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
