import type { PhilosopherTheme } from './types'

/** For non-philosopher profiles (presidents, etc.) — title only. */
export function simpleThemes(titles: string[]): PhilosopherTheme[] {
  return titles.map((title) => ({ title, explore: '' }))
}
