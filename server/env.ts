export function getEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined
}

export function requireEnv(name: string): string {
  const v = getEnv(name)
  if (!v) throw new Error(`Missing environment variable: ${name}`)
  return v
}

export function openAiModel(): string {
  return getEnv('OPENAI_MODEL') ?? 'gpt-4o-mini'
}
