import type { FigureEra } from './types'

/** Infer era from lifespan text (used for philosophers; validates leader profiles). */
export function inferEra(lifespan: string): FigureEra {
  const s = lifespan.trim()
  const lower = s.toLowerCase()

  if (lower.startsWith('b.') || /^b\.\s*\d/.test(lower)) return 'contemporary'
  if (lower.includes('present')) return 'contemporary'
  if (lower.includes('oral tradition')) return 'historical'
  if (/\d+(st|nd|rd|th)\s*c\.?/i.test(s)) return 'historical'

  if (lower.includes('bce')) return 'ancient'

  const ceRange = s.match(/(\d+)\s*[–-]\s*(\d+)\s*ce/i)
  if (ceRange) {
    const end = Number.parseInt(ceRange[2] ?? '', 10)
    return end < 600 ? 'ancient' : 'historical'
  }

  if (/^\d{3,4}\s*[–-]\s*\d{3,4}$/.test(s)) return 'historical'

  if (/c\.\s*\d/.test(lower)) return lower.includes('bce') ? 'ancient' : 'historical'

  return 'historical'
}
