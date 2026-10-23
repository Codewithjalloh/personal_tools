import { PHILOSOPHERS } from '../philosophers/catalog'
import { ACTIVISTS_AND_REFORMERS } from './activists'
import { ARTISTS_AND_MUSICIANS } from './artists'
import { BILLIONAIRES_AND_WEALTH } from './billionaires'
import { PRESIDENTS_AND_LEADERS } from './presidents'
import { SCIENTISTS_AND_INVENTORS } from './scientists'
import { GREAT_WRITERS } from './writers'
import type { FigureCategory, FigureEra, WorldFigure } from './types'

function inferEra(lifespan: string): FigureEra {
  const s = lifespan.toLowerCase()
  if (s.includes('bce') || s.includes('c. 2') || s.includes('c. 1') && s.includes('bce')) return 'ancient'
  if (s.startsWith('b. ') || s.includes('present') || s.includes('–') && s.split('–')[1]?.trim().length <= 4) {
    const end = s.includes('–') ? s.split('–')[1] : ''
    if (s.startsWith('b. ') || end.length <= 4) return 'contemporary'
  }
  if (s.includes('bce') || /^\d+\s*–\s*\d+\s*bce/.test(s)) return 'ancient'
  return 'historical'
}

const philosophersAsFigures: WorldFigure[] = PHILOSOPHERS.map((p) => ({
  ...p,
  category: 'philosopher' as const,
  era: inferEra(p.lifespan),
}))

export const ALL_WORLD_FIGURES: WorldFigure[] = [
  ...philosophersAsFigures,
  ...PRESIDENTS_AND_LEADERS,
  ...GREAT_WRITERS,
  ...SCIENTISTS_AND_INVENTORS,
  ...ARTISTS_AND_MUSICIANS,
  ...ACTIVISTS_AND_REFORMERS,
  ...BILLIONAIRES_AND_WEALTH,
]

export function getWorldFigureById(id: string): WorldFigure | undefined {
  return ALL_WORLD_FIGURES.find((f) => f.id === id)
}

export function listFigureRegions(): string[] {
  const set = new Set(ALL_WORLD_FIGURES.map((f) => f.region))
  return ['All regions', ...Array.from(set).sort()]
}

export type { FigureCategory, FigureEra, WorldFigure }
export { FIGURE_CATEGORIES } from './types'
