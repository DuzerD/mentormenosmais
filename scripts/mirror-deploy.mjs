import fs from "node:fs/promises"
import path from "node:path"
import { URL } from "node:url"

const startUrl = process.argv[2] || "https://menosmaistd.com"
const outDir = process.argv[3] || "deploy-mirror"
const maxPages = Number(process.argv[4]) || 40
const maxDepth = Number(process.argv[5]) || 2

const queue = [{ url: new URL(startUrl), depth: 0 }]
const visited = new Set()

async function ensureDir(filePath) {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
}

function toOutputPath(targetUrl) {
  const pathname = targetUrl.pathname.endsWith("/") ? `${targetUrl.pathname}index.html` : targetUrl.pathname
  const filePath = path.join(outDir, pathname)
  return filePath
}

function normalizeUrl(base, raw) {
  try {
    return new URL(raw, base)
  } catch {
    return null
  }
}

function shouldFollow(urlObj, baseOrigin) {
  if (!urlObj) return false
  if (urlObj.protocol.startsWith("http") === false) return false
  if (urlObj.origin !== baseOrigin) return false
  if (urlObj.hash) urlObj.hash = ""
  return true
}

function extractLinks(html, base) {
  const found = new Set()
  const attrRegex = /\b(?:src|href)\s*=\s*["']([^"']+)["']/gi
  const urlRegex = /url\(\s*['"]?([^"')]+)['"]?\s*\)/gi

  let match
  while ((match = attrRegex.exec(html))) {
    found.add(match[1])
  }
  while ((match = urlRegex.exec(html))) {
    found.add(match[1])
  }

  return Array.from(found)
    .map((raw) => normalizeUrl(base, raw))
    .filter(Boolean)
}

async function fetchAndSave(target, depth, baseOrigin) {
  if (visited.has(target.href)) return []
  visited.add(target.href)

  const response = await fetch(target.href, { cache: "no-store" })
  if (!response.ok) {
    console.error(`Failed ${response.status} for ${target.href}`)
    return []
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const contentType = response.headers.get("content-type") || ""
  const outPath = toOutputPath(target)
  await ensureDir(outPath)
  await fs.writeFile(outPath, buffer)
  console.log(`Saved ${target.href} -> ${outPath}`)

  if (contentType.includes("text/html") && depth < maxDepth) {
    const html = buffer.toString("utf8")
    return extractLinks(html, target)
      .filter((u) => shouldFollow(u, baseOrigin))
      .filter((u) => !visited.has(u.href))
      .slice(0, 200) // basic guard
  }

  return []
}

async function run() {
  const baseOrigin = new URL(startUrl).origin
  while (queue.length && visited.size < maxPages) {
    const { url, depth } = queue.shift()
    const nextLinks = await fetchAndSave(url, depth, baseOrigin)
    for (const link of nextLinks) {
      queue.push({ url: link, depth: depth + 1 })
    }
  }
  console.log(`Done. Visited ${visited.size} URLs. Output in ${outDir}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
