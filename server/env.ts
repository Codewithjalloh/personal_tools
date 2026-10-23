export function getEnv(name: string): string | undefined {
  const raw = process.env[name]
  if (!raw) return undefined
  let v = raw.trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim()
  }
  return v || undefined
}

export function requireEnv(name: string): string {
  const v = getEnv(name)
  if (!v) throw new Error(`Missing environment variable: ${name}`)
  return v
}

export function openAiModel(): string {
  return getEnv('OPENAI_MODEL') ?? 'gpt-4o-mini'
}
