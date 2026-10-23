import { GREAT_AFRICAN_GLOBAL_PROFILES } from './catalog'
import type { GreatAfricanProfile } from './types'

export function getGreatAfricanProfileById(id: string): GreatAfricanProfile | undefined {
  return GREAT_AFRICAN_GLOBAL_PROFILES.find((p) => p.id === id)
}

export function listGreatAfricanRegions(): string[] {
  const set = new Set(GREAT_AFRICAN_GLOBAL_PROFILES.map((p) => p.region))
  return ['All regions', ...Array.from(set).sort()]
}

export { GREAT_AFRICAN_GLOBAL_PROFILES }
export type { GreatAfricanProfile, GreatAfricanEra, GreatAfricanGender } from './types'
export {
  GAG_ERA_FILTERS,
  GAG_GENDER_FILTERS,
} from './types'
export {
  countGreatAfricanActiveFilters,
  filterGreatAfricanProfiles,
  normalizeSearchText,
  type GreatAfricanFilter,
} from './filterProfiles'
