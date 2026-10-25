/** Crossfade length between motion segments or loop repeats. */
export function loopCrossfadeSec(segmentOrLoopSec: number): number {
  return Math.min(0.85, Math.max(0.25, segmentOrLoopSec * 0.22))
}

/** Smallest n where n·D − (n−1)·cf ≥ target. */
export function loopRepeatsForDuration(loopSec: number, targetSec: number, crossfadeSec: number): number {
  if (loopSec <= 0) return 1
  let n = 1
  while (n * loopSec - (n - 1) * crossfadeSec < targetSec && n < 64) n++
  return n
}

/** FFmpeg xfade chain for equal-length video segments. */
export function buildXfadeChain(
  streamLabels: string[],
  segmentDurationSec: number,
  crossfadeSec: number,
  finalLabel = '[outv]',
): string {
  if (streamLabels.length === 0) return ''
  if (streamLabels.length === 1) return `${streamLabels[0]}null${finalLabel}`

  const cf = Math.min(crossfadeSec, segmentDurationSec * 0.4)
  const parts: string[] = []
  let prev = streamLabels[0]
  let running = segmentDurationSec

  for (let i = 1; i < streamLabels.length; i++) {
    const offset = Math.max(0, running - cf)
    const nextOut = i === streamLabels.length - 1 ? finalLabel : `[xf${i}]`
    parts.push(
      `${prev}${streamLabels[i]}xfade=transition=fade:duration=${cf.toFixed(3)}:offset=${offset.toFixed(3)}${nextOut}`,
    )
    prev = nextOut
    running += segmentDurationSec - cf
  }
  return parts.join(';')
}
