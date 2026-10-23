import type { GenerateIdeasRequest } from '../../../shared/youtubeIdeas/types'

const KEY = 'excellent117.generateForm.v1'

export type GenerateFormPrefs = GenerateIdeasRequest & {
  seriesId?: string
}

export function loadGenerateFormPrefs(): Partial<GenerateFormPrefs> | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<GenerateFormPrefs>
  } catch {
    return null
  }
}

export function saveGenerateFormPrefs(prefs: GenerateFormPrefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    // ignore quota errors
  }
}
