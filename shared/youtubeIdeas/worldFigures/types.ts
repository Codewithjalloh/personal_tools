import type { Philosopher } from '../philosophers/types'

export type FigureCategory =
  | 'philosopher'
  | 'president'
  | 'writer'
  | 'scientist'
  | 'artist'
  | 'activist'
  | 'billionaire'
  | 'ancient ruler'

export type FigureEra = 'ancient' | 'historical' | 'contemporary'

export type WorldFigure = Philosopher & {
  category: FigureCategory
  era: FigureEra
}

export const FIGURE_CATEGORIES: { id: FigureCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'philosopher', label: 'Philosophers' },
  { id: 'president', label: 'Presidents & leaders' },
  { id: 'writer', label: 'Great writers' },
  { id: 'scientist', label: 'Scientists & inventors' },
  { id: 'artist', label: 'Artists & musicians' },
  { id: 'activist', label: 'Activists & reformers' },
  { id: 'billionaire', label: 'Billionaires & wealth' },
  { id: 'ancient ruler', label: 'Ancient rulers' },
]
