import type { TransitionType } from '../types'

/** FFmpeg xfade transition names */
export function xfadeTransition(type: TransitionType): string {
  switch (type) {
    case 'slideleft':
      return 'slideleft'
    case 'slideright':
      return 'slideright'
    case 'wipeleft':
      return 'wipeleft'
    case 'fade':
    default:
      return 'fade'
  }
}

export const TRANSITION_OPTIONS: { id: TransitionType; label: string }[] = [
  { id: 'fade', label: 'Crossfade' },
  { id: 'slideleft', label: 'Slide left' },
  { id: 'slideright', label: 'Slide right' },
  { id: 'wipeleft', label: 'Wipe' },
]
