import type { ExportSettings } from '../types'
import { xfadeTransition } from './transitions'

const FPS = 30

export function scaleFilter(settings: ExportSettings, inputLabel: string, outputLabel: string) {
  const { width, height, fit } = settings
  if (fit === 'cover') {
    return `${inputLabel}scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}${outputLabel}`
  }
  return `${inputLabel}scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black${outputLabel}`
}

export function kenBurnsFilter(
  settings: ExportSettings,
  inputLabel: string,
  outputLabel: string,
  durationSec: number,
) {
  const frames = Math.max(1, Math.round(durationSec * FPS))
  const { width, height } = settings
  return `${inputLabel}zoompan=z='min(zoom+0.0012,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${width}x${height}:fps=${FPS}${outputLabel}`
}

export function buildVideoFilterChain(
  settings: ExportSettings,
  segmentCount: number,
  segmentDurations: number[],
): { filterComplex: string; outputLabel: string } {
  const cf = settings.crossfadeSec
  const useFade = cf > 0 && segmentCount > 1
  const useKb = settings.kenBurns

  const scaled: string[] = []
  for (let i = 0; i < segmentCount; i++) {
    let inLabel = `[${i}:v]`
    let outLabel = `[s${i}]`
    scaled.push(scaleFilter(settings, inLabel, outLabel))
    if (useKb) {
      inLabel = outLabel
      outLabel = `[k${i}]`
      scaled.push(kenBurnsFilter(settings, inLabel, outLabel, segmentDurations[i]))
    }
  }

  const streamLabels = Array.from({ length: segmentCount }, (_, i) =>
    useKb ? `[k${i}]` : `[s${i}]`,
  )

  if (!useFade) {
    const concatIn = streamLabels.join('')
    scaled.push(`${concatIn}concat=n=${segmentCount}:v=1:a=0[outv]`)
    return { filterComplex: scaled.join(';'), outputLabel: '[outv]' }
  }

  let prev = streamLabels[0]
  let running = segmentDurations[0]
  for (let i = 1; i < segmentCount; i++) {
    const offset = Math.max(0, running - cf)
    const nextOut = i === segmentCount - 1 ? '[outv]' : `[x${i}]`
    const transition = xfadeTransition(settings.transitionType)
    scaled.push(`${prev}${streamLabels[i]}xfade=transition=${transition}:duration=${cf.toFixed(3)}:offset=${offset.toFixed(3)}${nextOut}`)
    prev = nextOut
    running = running + segmentDurations[i] - cf
  }

  return { filterComplex: scaled.join(';'), outputLabel: '[outv]' }
}
