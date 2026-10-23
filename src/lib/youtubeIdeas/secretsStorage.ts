const OPENAI_KEY = 'excellent117.openaiApiKey'
const PEXELS_KEY = 'excellent117.pexelsApiKey'

export function getStoredOpenAiKey(): string {
  return localStorage.getItem(OPENAI_KEY)?.trim() ?? ''
}

export function getStoredPexelsKey(): string {
  return localStorage.getItem(PEXELS_KEY)?.trim() ?? ''
}

export function setStoredOpenAiKey(value: string): void {
  const v = value.trim()
  if (v) localStorage.setItem(OPENAI_KEY, v)
  else localStorage.removeItem(OPENAI_KEY)
}

export function setStoredPexelsKey(value: string): void {
  const v = value.trim()
  if (v) localStorage.setItem(PEXELS_KEY, v)
  else localStorage.removeItem(PEXELS_KEY)
}

export function apiKeyHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const openai = getStoredOpenAiKey()
  const pexels = getStoredPexelsKey()
  if (openai) headers['X-OpenAI-Api-Key'] = openai
  if (pexels) headers['X-Pexels-Api-Key'] = pexels
  return headers
}
