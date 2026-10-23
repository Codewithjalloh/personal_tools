import type { ExportSettings, SlideItem } from '../types'
import { isEncoderLoaded } from './exportVideo'

export function estimateExportSeconds(
  slides: SlideItem[],
  settings: ExportSettings,
): { min: number; max: number; label: string } {
  const encoder = isEncoderLoaded()
  const load = encoder ? 0 : 35
  const prep = slides.length * 0.4 + (settings.intro.animation !== 'none' ? settings.intro.durationSec * 0.8 : 0)
  const encode = settings.fastDraft
    ? settings.totalDurationSec * 0.35
    : (settings.width * settings.height) / (1920 * 1080) * settings.totalDurationSec * 0.9
  const min = Math.round(load + prep + encode * 0.6)
  const max = Math.round(load + prep + encode * 1.4)
  const label = encoder
    ? `About ${min}–${max}s to encode`
    : `First export: ~${min}–${max}s (includes loading encoder)`
  return { min, max, label }
}
