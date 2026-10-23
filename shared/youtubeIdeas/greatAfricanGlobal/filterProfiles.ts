import type { GreatAfricanEra, GreatAfricanGender, GreatAfricanProfile } from './types'

export function normalizeSearchText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

export type GreatAfricanFilter = {
  query: string
  region: string
  gender: 'all' | GreatAfricanGender
  era: 'all' | GreatAfricanEra
}

export function filterGreatAfricanProfiles(
  profiles: GreatAfricanProfile[],
  filter: GreatAfricanFilter,
): GreatAfricanProfile[] {
  let list = [...profiles]
  if (filter.gender !== 'all') list = list.filter((p) => p.gender === filter.gender)
  if (filter.era !== 'all') list = list.filter((p) => p.era === filter.era)
  if (filter.region !== 'All regions') list = list.filter((p) => p.region === filter.region)

  const q = normalizeSearchText(filter.query.trim())
  if (!q) return list.sort((a, b) => a.name.localeCompare(b.name))

  const tokens = q.split(/\s+/).filter(Boolean)
  return list
    .filter((p) => {
      const hay = normalizeSearchText(
        `${p.name} ${p.region} ${p.roles.join(' ')} ${p.bio} ${p.ideas.join(' ')} ${p.philosophy}`,
      )
      return tokens.every((t) => hay.includes(t))
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function countGreatAfricanActiveFilters(filter: GreatAfricanFilter): number {
  let n = 0
  if (filter.query.trim()) n++
  if (filter.region !== 'All regions') n++
  if (filter.gender !== 'all') n++
  if (filter.era !== 'all') n++
  return n
}
