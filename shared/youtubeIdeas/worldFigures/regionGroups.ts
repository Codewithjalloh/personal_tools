/** Canonical region labels used in profile data. */
export type ProfileRegion = string

/**
 * When a user picks a broad region in the filter (e.g. Europe), include profiles
 * tagged with finer-grained regions (e.g. Ancient Greece, Modern European).
 */
const REGION_GROUPS: Record<string, readonly string[]> = {
  Europe: ['Europe', 'Ancient Greece', 'Ancient Rome', 'Modern European'],
  Americas: ['Americas', 'United States', 'Caribbean'],
  'Middle Eastern': ['Middle Eastern', 'Middle Eastern & Islamic'],
  'Middle Eastern & Islamic': ['Middle Eastern', 'Middle Eastern & Islamic'],
  African: ['African'],
  'South Asian': ['South Asian'],
  'East Asian': ['East Asian'],
  'United States': ['United States'],
  'Ancient Greece': ['Ancient Greece'],
  'Ancient Rome': ['Ancient Rome'],
  'Modern European': ['Modern European'],
  Caribbean: ['Caribbean'],
}

/** Extra terms for search (e.g. “europe” finds Modern European philosophers). */
const REGION_SEARCH_ALIASES: Record<string, readonly string[]> = {
  Europe: ['europe', 'european', 'greek', 'greece', 'roman', 'rome', 'western'],
  'Ancient Greece': ['greece', 'greek', 'athens', 'hellenic'],
  'Ancient Rome': ['rome', 'roman', 'italy', 'latin'],
  'Modern European': ['europe', 'european', 'enlightenment', 'continental'],
  African: ['africa', 'african'],
  Americas: ['americas', 'latin america', 'caribbean'],
  'United States': ['america', 'american', 'usa', 'u.s.'],
  'South Asian': ['india', 'indian', 'south asia'],
  'East Asian': ['china', 'chinese', 'japan', 'japanese', 'east asia'],
  'Middle Eastern': ['middle east', 'islamic', 'arab', 'persian'],
  'Middle Eastern & Islamic': ['middle east', 'islamic', 'arab', 'persian', 'sufi'],
  Caribbean: ['caribbean', 'jamaica', 'reggae'],
}

export function regionsMatchingFilter(selected: string): Set<string> | null {
  if (selected === 'All regions') return null
  const group = REGION_GROUPS[selected]
  if (group) return new Set(group)
  return new Set([selected])
}

export function figureMatchesRegion(profileRegion: ProfileRegion, selected: string): boolean {
  const allowed = regionsMatchingFilter(selected)
  if (!allowed) return true
  return allowed.has(profileRegion)
}

export function regionSearchTerms(profileRegion: ProfileRegion): string[] {
  const terms = new Set<string>([profileRegion])
  for (const [key, aliases] of Object.entries(REGION_SEARCH_ALIASES)) {
    const group = REGION_GROUPS[key]
    if (group?.includes(profileRegion)) {
      terms.add(key)
      for (const a of aliases) terms.add(a)
    }
  }
  for (const a of REGION_SEARCH_ALIASES[profileRegion] ?? []) terms.add(a)
  return [...terms]
}
