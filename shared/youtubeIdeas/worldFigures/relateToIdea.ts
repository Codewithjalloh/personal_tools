import type { SavedIdea } from '../types'
import { normalizeSearchText } from './filterFigures'
import { ALL_WORLD_FIGURES } from './index'
import type { WorldFigure } from './types'

const STOP = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'for',
  'from',
  'has',
  'have',
  'how',
  'in',
  'into',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'they',
  'this',
  'to',
  'was',
  'we',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'with',
  'you',
  'your',
])

function tokensFrom(text: string): string[] {
  const norm = normalizeSearchText(text)
  return norm
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t))
}

function uniqueTokens(parts: string[]): Set<string> {
  const set = new Set<string>()
  for (const part of parts) {
    for (const t of tokensFrom(part)) set.add(t)
  }
  return set
}

function ideaCorpus(idea: SavedIdea): { tokens: Set<string>; inspirationNorm: string } {
  const parts = [
    idea.title,
    idea.inspiration.name,
    idea.inspiration.explanation,
    idea.openingQuestion,
    ...idea.africanConnection,
    ...idea.discussionQuestions,
    idea.closingQuestion,
    idea.category,
    idea.philosophicalInspiration ?? '',
    idea.region ?? '',
    ...(idea.tags ?? []),
  ]
  return {
    tokens: uniqueTokens(parts),
    inspirationNorm: normalizeSearchText(idea.inspiration.name),
  }
}

function figureTokens(figure: WorldFigure): Set<string> {
  return uniqueTokens([
    figure.name,
    figure.tradition,
    figure.bio,
    figure.region,
    ...figure.themes.map((t) => `${t.title} ${t.explore}`),
  ])
}

function nameMatchScore(inspirationNorm: string, figure: WorldFigure): number {
  const nameNorm = normalizeSearchText(figure.name)
  if (!inspirationNorm || !nameNorm) return 0
  if (inspirationNorm === nameNorm) return 40
  if (nameNorm.includes(inspirationNorm) || inspirationNorm.includes(nameNorm)) return 25
  const inspParts = inspirationNorm.split(/\s+/).filter((p) => p.length > 3)
  const nameParts = nameNorm.split(/\s+/).filter((p) => p.length > 3)
  for (const p of inspParts) {
    if (nameParts.some((n) => n.includes(p) || p.includes(n))) return 15
  }
  return 0
}

export type RelatedWorldFigure = {
  figure: WorldFigure
  score: number
  reason: string
}

function buildReason(
  figure: WorldFigure,
  matchedThemes: string[],
  nameBoost: number,
): string {
  if (nameBoost >= 40) return 'Matches the thinker named in your “Inspired by” line.'
  if (nameBoost >= 15) return 'Closely related to your stated inspiration.'
  if (matchedThemes.length > 0) {
    const shown = matchedThemes.slice(0, 2).join(' · ')
    return `Shared themes: ${shown}`
  }
  return `Relevant ${figure.tradition} — useful for quotes and contrast.`
}

export function relateWorldFiguresToIdea(idea: SavedIdea, limit = 8): RelatedWorldFigure[] {
  const { tokens: ideaTokens, inspirationNorm } = ideaCorpus(idea)
  if (ideaTokens.size === 0 && !inspirationNorm) return []

  const scored: RelatedWorldFigure[] = []

  for (const figure of ALL_WORLD_FIGURES) {
    const figTokens = figureTokens(figure)
    let score = 0
    const matchedThemes: string[] = []

    for (const token of ideaTokens) {
      if (figTokens.has(token)) score += 2
      else if ([...figTokens].some((ft) => ft.includes(token) || token.includes(ft))) score += 1
    }

    for (const theme of figure.themes) {
      const themeNorm = normalizeSearchText(`${theme.title} ${theme.explore}`)
      for (const token of ideaTokens) {
        if (themeNorm.includes(token)) {
          matchedThemes.push(theme.title)
          score += 3
          break
        }
      }
    }

    const nameBoost = nameMatchScore(inspirationNorm, figure)
    score += nameBoost

    if (idea.philosophicalInspiration && figure.category === 'philosopher') score += 2
    if (idea.region && normalizeSearchText(idea.region) === normalizeSearchText(figure.region)) {
      score += 4
    }

    if (score < 4) continue

    scored.push({
      figure,
      score,
      reason: buildReason(figure, [...new Set(matchedThemes)], nameBoost),
    })
  }

  scored.sort((a, b) => b.score - a.score || a.figure.name.localeCompare(b.figure.name))
  return scored.slice(0, limit)
}
