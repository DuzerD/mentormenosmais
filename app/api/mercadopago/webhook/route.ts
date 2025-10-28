"use server"

import crypto from "node:crypto"
import { NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"

type MissionUnlock = "missao_1" | "missao_2" | "missao_3" | "missao_4" | "missao_5" | "todas"

interface MercadoPagoWebhookBody {
  action?: string
  type?: string
  data?: { id?: string | number | null }
}

interface ExternalReferencePayload {
  idUnico?: string
  product?: string
  unlocks?: MissionUnlock
}

const missionOrder: MissionUnlock[] = [
  "missao_1",
  "missao_2",
  "missao_3",
  "missao_4",
  "missao_5",
  "todas",
]

function missionRank(value: MissionUnlock | null | undefined): number {
  if (!value) return -1
  return missionOrder.indexOf(value)
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

async function fetchBrandRecord(origin: string, idUnico: string) {
  try {
    const url = new URL(`/api/brand-data?idUnico=${encodeURIComponent(idUnico)}`, origin)
    const response = await fetch(url.toString(), { cache: "no-store" })
    if (!response.ok) {
      console.warn("MercadoPago webhook: não foi possível buscar brand-data:", response.status)
      return null
    }
    const json = (await response.json()) as { data?: Record<string, unknown> | null }
    return json?.data ?? null
  } catch (error) {
    console.warn("MercadoPago webhook: erro ao obter dados atuais:", error)
    return null
  }
}

async function updateBrandRecord(
  origin: string,
  idUnico: string,
  unlocks: MissionUnlock,
  paymentId: string | number,
  status: string,
) {
  if (!missionOrder.includes(unlocks)) {
    console.warn("MercadoPago webhook: missão de desbloqueio desconhecida recebida:", unlocks)
    return
  }
  const record = await fetchBrandRecord(origin, idUnico)
  let existingMetadata: Record<string, unknown> = {}
  let currentMission: MissionUnlock | null = null

  if (record) {
    const { missaoLiberada, onboardingMetadata } = record

    if (typeof missaoLiberada === "string") {
      currentMission = missionOrder.includes(missaoLiberada as MissionUnlock)
        ? (missaoLiberada as MissionUnlock)
        : missaoLiberada === "todas"
          ? "todas"
          : null
    }

    if (typeof onboardingMetadata === "string") {
      try {
        existingMetadata = JSON.parse(onboardingMetadata) as Record<string, unknown>
      } catch (error) {
        console.warn("MercadoPago webhook: falha ao interpretar onboardingMetadata existente:", error)
      }
    } else if (onboardingMetadata && typeof onboardingMetadata === "object") {
      existingMetadata = { ...(onboardingMetadata as Record<string, unknown>) }
    }
  }

  const unlockRank = missionRank(unlocks)
  const currentRank = missionRank(currentMission)
  const shouldUnlock = status === "approved" || status === "authorized"
  const previousPending =
    typeof (existingMetadata as { pendingUnlock?: unknown }).pendingUnlock === "string"
      ? ((existingMetadata as { pendingUnlock?: string }).pendingUnlock as string)
      : undefined
  const previousCheckout =
    typeof (existingMetadata as { lastCheckout?: unknown }).lastCheckout === "object" &&
    (existingMetadata as { lastCheckout?: unknown }).lastCheckout !== null
      ? ((existingMetadata as { lastCheckout?: Record<string, unknown> }).lastCheckout as Record<
          string,
          unknown
        >)
      : {}

  const missaoLiberada =
    shouldUnlock && unlocks === "todas"
      ? "todas"
      : shouldUnlock && unlockRank > currentRank && unlocks !== "todas"
        ? unlocks
        : record?.missaoLiberada ?? currentMission ?? null

  const metadataPatched = {
    ...existingMetadata,
    pendingUnlock: shouldUnlock ? null : previousPending ?? unlocks,
    lastCheckout: {
      ...previousCheckout,
      status,
      preferenceId:
        typeof previousCheckout.preferenceId === "string" || typeof previousCheckout.preferenceId === "number"
          ? previousCheckout.preferenceId
          : null,
      approvedAt:
        shouldUnlock && status === "approved"
          ? new Date().toISOString()
          : (typeof previousCheckout.approvedAt === "string" ? previousCheckout.approvedAt : undefined),
      paymentId,
    },
    lastPayment: {
      id: paymentId,
      unlocks,
      status,
      updatedAt: new Date().toISOString(),
    },
  }

  const patchBody: Record<string, unknown> = {
    idUnico,
    onboardingMetadata: metadataPatched,
  }

  if (missaoLiberada) {
    patchBody.missaoLiberada = missaoLiberada
  }

  if (Array.isArray(record?.missoesConcluidas)) {
    patchBody.missoesConcluidas = record?.missoesConcluidas
  }

  const patchUrl = new URL("/api/brand-data", origin)

  await fetch(patchUrl.toString(), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patchBody),
  })
}

function validateSignature(secret: string | undefined, payload: string, header: string | null): boolean {
  if (!secret) return true
  if (!header) return false

  const normalizedHeader = header.trim()
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`
  return expected === normalizedHeader
}

export async function GET() {
  return NextResponse.json({ success: true })
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  let body: MercadoPagoWebhookBody
  try {
    body = JSON.parse(rawBody) as MercadoPagoWebhookBody
  } catch (error) {
    console.error("MercadoPago webhook: corpo inválido recebido:", error)
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 })
  }

  const signatureHeader =
    request.headers.get("x-mercadopago-signature") ??
    request.headers.get("x-signature") ??
    request.headers.get("x-hub-signature")

  if (!validateSignature(process.env.MP_WEBHOOK_SECRET, rawBody, signatureHeader)) {
    console.warn("MercadoPago webhook: assinatura inválida")
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 })
  }

  if (!body?.data?.id) {
    return NextResponse.json({ ignored: true })
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    console.error("MercadoPago webhook: MP_ACCESS_TOKEN não configurado")
    return NextResponse.json({ error: "Configuração ausente" }, { status: 500 })
  }

  const mercadoPago = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
  const paymentClient = new Payment(mercadoPago)

  try {
    const payment = await paymentClient.get({
      id: body.data.id,
    })

    if (!payment) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    const externalReference: ExternalReferencePayload =
      typeof payment.external_reference === "string"
        ? JSON.parse(payment.external_reference)
        : {}

    const idUnico = externalReference?.idUnico
    const unlocks = externalReference?.unlocks

    if (!idUnico || !unlocks) {
      console.warn("MercadoPago webhook: referência externa inválida", payment.external_reference)
      return NextResponse.json({ error: "Referência externa ausente" }, { status: 400 })
    }

    const origin = resolveOrigin(request)

    await updateBrandRecord(origin, idUnico, unlocks, payment.id!, payment.status ?? "unknown")

    return NextResponse.json({ success: true })
  } catch (error) {
    const maybeStatus =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status?: number }).status
        : undefined
    const maybeMessage =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : ""

    const isNotFound =
      maybeStatus === 404 || maybeStatus === 400 || maybeMessage.toLowerCase().includes("not found")

    if (isNotFound) {
      console.warn("MercadoPago webhook: pagamento informado não encontrado, ignorando.", error)
      return NextResponse.json({ ignored: true })
    }

    console.error("MercadoPago webhook: erro ao processar pagamento:", error)
    return NextResponse.json({ error: "Erro ao processar pagamento" }, { status: 500 })
  }
}
