import { figureMatchesRegion, regionSearchTerms } from './regionGroups'
import type { FigureCategory, FigureEra, WorldFigure } from './types'

export type FigureFilters = {
  query: string
  region: string
  category: FigureCategory | 'all'
  era: FigureEra | 'all'
}

/** Lowercase + strip accents so “Traore” matches “Traoré”. */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[''']/g, "'")
}

function figureHaystack(figure: WorldFigure): string {
  return normalizeSearchText(
    [
      figure.id.replace(/-/g, ' '),
      figure.name,
      figure.region,
      ...regionSearchTerms(figure.region),
      figure.tradition,
      figure.bio,
      figure.lifespan,
      figure.category.replace('-', ' '),
      ...figure.themes.flatMap((t) => [t.title, t.explore]),
    ].join(' '),
  )
}

export function figureMatchesQuery(figure: WorldFigure, rawQuery: string): boolean {
  const trimmed = rawQuery.trim()
  if (!trimmed) return true

  const tokens = normalizeSearchText(trimmed).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true

  const haystack = figureHaystack(figure)
  return tokens.every((token) => haystack.includes(token))
}

export function filterWorldFigures(
  figures: WorldFigure[],
  { query, region, category, era }: FigureFilters,
): WorldFigure[] {
  let list = figures

  if (region !== 'All regions') {
    list = list.filter((f) => figureMatchesRegion(f.region, region))
  }
  if (category !== 'all') {
    list = list.filter((f) => f.category === category)
  }
  if (era !== 'all') {
    list = list.filter((f) => f.era === era)
  }
  if (query.trim()) {
    list = list.filter((f) => figureMatchesQuery(f, query))
  }

  return [...list].sort((a, b) => a.name.localeCompare(b.name))
}

export function countActiveFilters(filters: FigureFilters): number {
  let n = 0
  if (filters.query.trim()) n += 1
  if (filters.region !== 'All regions') n += 1
  if (filters.category !== 'all') n += 1
  if (filters.era !== 'all') n += 1
  return n
}
