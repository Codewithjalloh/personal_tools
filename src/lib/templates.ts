import { DEFAULT_TITLE_CARD } from '../types'
import type { FitMode, TitleCardSettings } from '../types'

export type TemplateId = 'custom' | 'instagram-story' | 'youtube-short' | 'wedding'

export type TemplateApply = {
  id: TemplateId
  label: string
  totalDurationSec: number
  resolutionIndex: number
  fit: FitMode
  intro: Partial<TitleCardSettings>
  outro: Partial<TitleCardSettings>
  crossfadeSec: number
  kenBurns: boolean
}

export const TEMPLATES: TemplateApply[] = [
  {
    id: 'custom',
    label: 'Custom',
    totalDurationSec: 60,
    resolutionIndex: 1,
    fit: 'contain',
    intro: {},
    outro: {},
    crossfadeSec: 0.4,
    kenBurns: false,
  },
  {
    id: 'instagram-story',
    label: 'Instagram Story',
    totalDurationSec: 30,
    resolutionIndex: 2,
    fit: 'cover',
    intro: {
      text: 'My Story',
      durationSec: 5,
      position: 'center',
      showBar: true,
    },
    outro: { text: 'Thanks for watching', durationSec: 3, showBar: true },
    crossfadeSec: 0.35,
    kenBurns: true,
  },
  {
    id: 'youtube-short',
    label: 'YouTube Short',
    totalDurationSec: 45,
    resolutionIndex: 2,
    fit: 'cover',
    intro: { text: 'Highlights', durationSec: 4 },
    outro: { text: 'Subscribe', durationSec: 3 },
    crossfadeSec: 0.4,
    kenBurns: true,
  },
  {
    id: 'wedding',
    label: 'Wedding',
    totalDurationSec: 120,
    resolutionIndex: 1,
    fit: 'contain',
    intro: {
      text: 'Forever & Always',
      color: '#fbbf24',
      durationSec: 10,
      fontScale: 1.1,
      showBar: true,
    },
    outro: { text: 'With love', color: '#fbbf24', durationSec: 8, showBar: true },
    crossfadeSec: 0.5,
    kenBurns: true,
  },
]

export function mergeTitleCard(partial: Partial<TitleCardSettings>): TitleCardSettings {
  return { ...DEFAULT_TITLE_CARD, ...partial }
}
