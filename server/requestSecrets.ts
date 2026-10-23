import { AsyncLocalStorage } from 'node:async_hooks'
import { getEnv } from './env'

type RequestSecrets = {
  openAiKey?: string
  pexelsKey?: string
}

const storage = new AsyncLocalStorage<RequestSecrets>()

export function runWithRequestSecrets<T>(secrets: RequestSecrets, fn: () => T): T {
  return storage.run(secrets, fn)
}

export async function runWithRequestSecretsAsync<T>(
  secrets: RequestSecrets,
  fn: () => Promise<T>,
): Promise<T> {
  return storage.run(secrets, fn)
}

function normalizeSecret(value: string | undefined): string | undefined {
  if (!value) return undefined
  let k = value.trim()
  if (k.toLowerCase().startsWith('bearer ')) k = k.slice(7).trim()
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1).trim()
  }
  return k || undefined
}

function headerKey(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value
  return normalizeSecret(v)
}

export function secretsFromHeaders(headers: Record<string, string | string[] | undefined>): RequestSecrets {
  return {
    openAiKey: headerKey(headers['x-openai-api-key']),
    pexelsKey: headerKey(headers['x-pexels-api-key']),
  }
}

export function resolveOpenAiKey(): string {
  const key = normalizeSecret(getEnv('OPENAI_API_KEY')) || normalizeSecret(storage.getStore()?.openAiKey)
  if (!key) {
    throw new Error(
      'OPENAI_API_KEY is not configured. Add it in YouTube Ideas → Settings, or in .env.local at the project root.',
    )
  }
  return key
}

export function resolvePexelsKey(): string | undefined {
  return normalizeSecret(getEnv('PEXELS_API_KEY')) || normalizeSecret(storage.getStore()?.pexelsKey)
}

export function hasOpenAiKeyConfigured(): boolean {
  try {
    resolveOpenAiKey()
    return true
  } catch {
    return false
  }
}
