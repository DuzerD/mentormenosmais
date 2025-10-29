import { NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"

type CheckoutProduct = "missao_1" | "missao_3" | "jornada_completa"
type MissionUnlock = "missao_1" | "missao_2" | "missao_3" | "missao_4" | "missao_5" | "todas"

interface CheckoutRequestBody {
  idUnico?: string
  product?: CheckoutProduct
  planId?: string
  returnPath?: string | null
}

interface ProductConfig {
  title: string
  description: string
  unitPrice: number
  unlocks: MissionUnlock
}

const PRODUCT_CATALOG: Record<CheckoutProduct, ProductConfig> = {
  missao_1: {
    title: "Missão 1 - Estratégia da Marca",
    description: "Desbloqueio individual da Missão 1",
    unitPrice: 97,
    unlocks: "missao_1",
  },
  missao_3: {
    title: "Missão 3 - Identidade Visual",
    description: "Desbloqueio da Missão 3 com o Designer IA",
    unitPrice: 197,
    unlocks: "missao_3",
  },
  jornada_completa: {
    title: "Jornada Completa (Missões 1 a 5)",
    description: "Pacote completo das cinco missões da Menos Mais",
    unitPrice: 297,
    unlocks: "todas",
  },
}

function resolveOrigin(request: Request): string {
  const explicit =
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
  if (explicit) {
    return explicit.startsWith("http") ? explicit : `https://${explicit}`
  }

  const url = new URL(request.url)
  return url.origin
}

async function fetchBrandMetadata(origin: string, idUnico: string) {
  try {
    const url = new URL(`/api/brand-data?idUnico=${encodeURIComponent(idUnico)}`, origin)
    const response = await fetch(url.toString(), { cache: "no-store" })
    if (!response.ok) {
      return null
    }
    const json = (await response.json()) as { data?: Record<string, unknown> | null }
    return json?.data ?? null
  } catch (error) {
    console.warn("MercadoPago checkout: não foi possível recuperar dados existentes:", error)
    return null
  }
}

async function persistPendingCheckout(
  origin: string,
  idUnico: string,
  planId: string | undefined,
  product: CheckoutProduct,
  unlocks: MissionUnlock,
  preferenceId: string | number | undefined,
) {
  try {
    const existingRecord = await fetchBrandMetadata(origin, idUnico)
    let existingMetadata: Record<string, unknown> = {}

    const rawMetadata = existingRecord?.onboardingMetadata
    if (typeof rawMetadata === "string") {
      try {
        existingMetadata = JSON.parse(rawMetadata) as Record<string, unknown>
      } catch (error) {
        console.warn("MercadoPago checkout: falha ao interpretar onboardingMetadata existente:", error)
      }
    } else if (rawMetadata && typeof rawMetadata === "object") {
      existingMetadata = { ...(rawMetadata as Record<string, unknown>) }
    }

    const checkoutInfo = {
      product,
      unlocks,
      preferenceId,
      createdAt: new Date().toISOString(),
      status: "pending",
    }

    const patchedMetadata = {
      ...existingMetadata,
      pendingUnlock: unlocks,
      lastCheckout: checkoutInfo,
    }

    const patchBody: Record<string, unknown> = {
      idUnico,
      onboardingMetadata: patchedMetadata,
    }

    if (planId) {
      patchBody.planoSelecionado = planId
    }

    const patchUrl = new URL("/api/brand-data", origin)

    await fetch(patchUrl.toString(), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchBody),
    })
  } catch (error) {
    console.warn("MercadoPago checkout: não foi possível persistir estado pendente:", error)
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutRequestBody
    const idUnico = body.idUnico?.trim()
    const product = body.product

    if (!idUnico) {
      return NextResponse.json({ error: "idUnico é obrigatório" }, { status: 400 })
    }

    if (!product || !(product in PRODUCT_CATALOG)) {
      return NextResponse.json({ error: "Produto inválido para checkout" }, { status: 400 })
    }

    const { title, description, unitPrice, unlocks } = PRODUCT_CATALOG[product]

    const accessToken = process.env.MP_ACCESS_TOKEN
    if (!accessToken) {
      console.error("MercadoPago checkout: MP_ACCESS_TOKEN não configurado")
      return NextResponse.json({ error: "Configuração do Mercado Pago ausente" }, { status: 500 })
    }

    const origin = resolveOrigin(request)

    const mercadoPago = new MercadoPagoConfig({ accessToken })
    const preferenceClient = new Preference(mercadoPago)

    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            title,
            description,
            unit_price: unitPrice,
            quantity: 1,
            currency_id: "BRL",
          },
        ],
        external_reference: JSON.stringify({
          idUnico,
          product,
          unlocks,
        }),
        notification_url: `${origin}/api/mercadopago/webhook`,
        back_urls: {
          success: `${origin}${body.returnPath ?? "/dashboard"}`,
          pending: `${origin}${body.returnPath ?? "/dashboard"}`,
          failure: `${origin}/checkout/error`,
        },
        auto_return: "approved",
        metadata: {
          idUnico,
          product,
          unlocks,
        },
      },
    })

    console.log("MercadoPago checkout preference:", {
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    })

    await persistPendingCheckout(origin, idUnico, body.planId, product, unlocks, preference.id)

    return NextResponse.json(
      {
        init_point: preference.init_point ?? preference.sandbox_init_point ?? null,
        sandbox_init_point: preference.sandbox_init_point ?? null,
        preference_id: preference.id ?? null,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("MercadoPago checkout: erro ao criar preferência:", error)
    return NextResponse.json({ error: "Não foi possível iniciar o checkout" }, { status: 500 })
  }
}
