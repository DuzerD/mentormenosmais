import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET() {
  try {
    const filePath = path.resolve(process.cwd(), "data/voice-mode.json")
    const data = await fs.readFile(filePath, "utf-8")
    const json = JSON.parse(data)
    return NextResponse.json({ enabled: json.enabled })
  } catch (e) {
    return NextResponse.json({ error: "Erro ao ler status do modo de voz" }, { status: 500 })
  }
} 