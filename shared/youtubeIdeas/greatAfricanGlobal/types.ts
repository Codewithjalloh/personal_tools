export type GreatAfricanGender = 'man' | 'woman'

export type GreatAfricanEra = 'ancient' | 'historical' | 'contemporary'

export type GreatAfricanProfile = {
  id: string
  name: string
  lifespan: string
  /** e.g. Ghana, Mali Empire, United States (diaspora) */
  region: string
  roles: string[]
  gender: GreatAfricanGender
  era: GreatAfricanEra
  /** Optional link to the shorter World Library entry */
  worldFigureId?: string
  bio: string
  background: string
  education: string
  ideas: string[]
  philosophy: string
  pros: string[]
  cons: string[]
  /** Hooks for Excellent117 episodes */
  episodeAngles: string[]
}

export const GAG_GENDER_FILTERS: { id: 'all' | GreatAfricanGender; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'man', label: 'Men' },
  { id: 'woman', label: 'Women' },
]

export const GAG_ERA_FILTERS: { id: 'all' | GreatAfricanEra; label: string }[] = [
  { id: 'all', label: 'All eras' },
  { id: 'ancient', label: 'Ancient' },
  { id: 'historical', label: 'Historical' },
  { id: 'contemporary', label: 'Living / contemporary' },
]
