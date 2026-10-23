import type { IncomingMessage, ServerResponse } from 'node:http'

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk))
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (!text) return {}
  return JSON.parse(text) as unknown
}

export function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

export function sendError(res: ServerResponse, status: number, message: string): void {
  sendJson(res, status, { error: message })
}

const lastRequestAt = new Map<string, number>()
const MIN_INTERVAL_MS = 3000

export function rateLimit(key: string): boolean {
  const now = Date.now()
  const prev = lastRequestAt.get(key) ?? 0
  if (now - prev < MIN_INTERVAL_MS) return false
  lastRequestAt.set(key, now)
  return true
}
