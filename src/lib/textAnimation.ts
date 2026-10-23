import type { TextAnimation } from '../types'

export type AnimState = {
  opacity: number
  offsetY: number
  scale: number
  visibleRatio: number
}

export const TEXT_ANIMATION_OPTIONS: { id: TextAnimation; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'fade-up', label: 'Fade up' },
  { id: 'fade', label: 'Fade in' },
  { id: 'scale-in', label: 'Scale in' },
  { id: 'typewriter', label: 'Typewriter' },
]

export function animationWindowSec(introDurationSec: number): number {
  return Math.min(2.5, Math.max(0.8, introDurationSec * 0.35))
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

/** @param t progress 0–1 within the animation window */
export function getAnimState(animation: TextAnimation, t: number): AnimState {
  const p = easeOutCubic(Math.min(1, Math.max(0, t)))

  switch (animation) {
    case 'fade':
      return { opacity: p, offsetY: 0, scale: 1, visibleRatio: 1 }
    case 'fade-up':
      return { opacity: p, offsetY: (1 - p) * 28, scale: 1, visibleRatio: 1 }
    case 'scale-in':
      return { opacity: p, offsetY: 0, scale: 0.88 + p * 0.12, visibleRatio: 1 }
    case 'typewriter':
      return { opacity: 1, offsetY: 0, scale: 1, visibleRatio: p }
    case 'none':
    default:
      return { opacity: 1, offsetY: 0, scale: 1, visibleRatio: 1 }
  }
}

export function animProgressAtTime(
  animation: TextAnimation,
  elapsedSec: number,
  introDurationSec: number,
): number {
  if (animation === 'none') return 1
  const window = animationWindowSec(introDurationSec)
  return Math.min(1, elapsedSec / window)
}
