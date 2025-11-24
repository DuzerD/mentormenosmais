import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function POST() {
  try {
    const filePath = path.resolve(process.cwd(), "data/voice-mode.json")
    await fs.writeFile(filePath, JSON.stringify({ enabled: true }, null, 2))
    return NextResponse.json({ enabled: true })
  } catch (e) {
    return NextResponse.json({ error: "Erro ao ativar modo de voz" }, { status: 500 })
  }
} 