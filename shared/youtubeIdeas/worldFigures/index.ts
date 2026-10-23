import { PHILOSOPHERS } from '../philosophers/catalog'
import { ACTIVISTS_AND_REFORMERS } from './activists'
import { ARTISTS_AND_MUSICIANS } from './artists'
import { BILLIONAIRES_AND_WEALTH } from './billionaires'
import { PRESIDENTS_AND_LEADERS } from './presidents'
import { SCIENTISTS_AND_INVENTORS } from './scientists'
import { GREAT_WRITERS } from './writers'
import { inferEra } from './figureEra'
import type { FigureCategory, FigureEra, WorldFigure } from './types'

const philosophersAsFigures: WorldFigure[] = PHILOSOPHERS.map((p) => ({
  ...p,
  category: 'philosopher' as const,
  era: inferEra(p.lifespan),
}))

/** Keep catalog era in sync with lifespan so Living / era filters stay accurate. */
function withResolvedEra(figure: WorldFigure): WorldFigure {
  return { ...figure, era: inferEra(figure.lifespan) }
}

export const ALL_WORLD_FIGURES: WorldFigure[] = [
  ...philosophersAsFigures,
  ...PRESIDENTS_AND_LEADERS,
  ...GREAT_WRITERS,
  ...SCIENTISTS_AND_INVENTORS,
  ...ARTISTS_AND_MUSICIANS,
  ...ACTIVISTS_AND_REFORMERS,
  ...BILLIONAIRES_AND_WEALTH,
].map(withResolvedEra)

export function getWorldFigureById(id: string): WorldFigure | undefined {
  return ALL_WORLD_FIGURES.find((f) => f.id === id)
}

export function listFigureRegions(): string[] {
  const set = new Set(ALL_WORLD_FIGURES.map((f) => f.region))
  return ['All regions', ...Array.from(set).sort()]
}

export type { FigureCategory, FigureEra, WorldFigure }
export { FIGURE_CATEGORIES } from './types'
export {
  countActiveFilters,
  filterWorldFigures,
  figureMatchesQuery,
  normalizeSearchText,
} from './filterFigures'
export { inferEra } from './figureEra'
