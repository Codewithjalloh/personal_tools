import type { SavedIdea } from '../types'
import { normalizeSearchText } from '../worldFigures/filterFigures'
import { buildIdeaCorpus } from '../worldFigures/relateToIdea'
import { TERMINOLOGY } from './catalog'
import { TERM_CATEGORIES, type TermCategory, type TermEntry } from './types'

const CATEGORY_LABEL = Object.fromEntries(
  TERM_CATEGORIES.filter((c) => c.id !== 'all').map((c) => [c.id, c.label]),
) as Record<TermCategory, string>

function termHaystack(entry: TermEntry): string {
  return normalizeSearchText(
    `${entry.term} ${entry.definition} ${entry.explore} ${CATEGORY_LABEL[entry.category]}`,
  )
}

function termTokens(entry: TermEntry): Set<string> {
  const norm = termHaystack(entry)
  return new Set(
    norm
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2),
  )
}

export type RelatedTerm = {
  entry: TermEntry
  score: number
  reason: string
}

function buildReason(entry: TermEntry, phraseHit: boolean, matchedInScript: boolean): string {
  if (phraseHit) return `“${entry.term}” appears in your idea text — good to define on air.`
  if (matchedInScript) return 'Overlaps with your title, questions, or tags.'
  return `Useful ${CATEGORY_LABEL[entry.category].toLowerCase()} vocabulary for this episode.`
}

export function relateTermsToIdea(idea: SavedIdea, limit = 8): RelatedTerm[] {
  const { tokens: ideaTokens, fullTextNorm } = buildIdeaCorpus(idea)
  if (ideaTokens.size === 0 && !fullTextNorm) return []

  const scored: RelatedTerm[] = []

  for (const entry of TERMINOLOGY) {
    const termNorm = normalizeSearchText(entry.term)
    const hay = termHaystack(entry)
    const figTokens = termTokens(entry)
    let score = 0
    let phraseHit = false
    let matchedInScript = false

    if (termNorm.length > 2 && fullTextNorm.includes(termNorm)) {
      phraseHit = true
      score += 22
    }

    for (const token of ideaTokens) {
      if (figTokens.has(token)) {
        matchedInScript = true
        score += 2
      } else if (hay.includes(token)) score += 1
    }

    const termWords = termNorm.split(/\s+/).filter((w) => w.length > 2)
    if (termWords.length > 1) {
      const allPresent = termWords.every((w) => ideaTokens.has(w) || fullTextNorm.includes(w))
      if (allPresent) score += 8
    }

    if (normalizeSearchText(idea.category).includes(termNorm) || hay.includes(normalizeSearchText(idea.category))) {
      score += 3
    }

    if (score < 4) continue

    scored.push({
      entry,
      score,
      reason: buildReason(entry, phraseHit, matchedInScript),
    })
  }

  scored.sort((a, b) => b.score - a.score || a.entry.term.localeCompare(b.entry.term))
  return scored.slice(0, limit)
}
