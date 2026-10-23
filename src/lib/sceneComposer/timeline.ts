import type { TextLayer, VisualClip } from './types'

export function repackClipStarts(clips: VisualClip[]): VisualClip[] {
  let cursor = 0
  return clips.map((clip) => {
    const next = { ...clip, startSec: cursor }
    cursor += clip.durationSec
    return next
  })
}

export function timelineVisualEndSec(clips: VisualClip[]): number {
  if (clips.length === 0) return 0
  const packed = repackClipStarts(clips)
  const last = packed[packed.length - 1]
  return last.startSec + last.durationSec
}

export function resolveExportDurationSec(
  clips: VisualClip[],
  texts: TextLayer[],
  audioDurationSec: number | null,
  mode: 'audio' | 'timeline',
): number {
  const visualEnd = timelineVisualEndSec(clips)
  const textEnd = texts.reduce((max, t) => Math.max(max, t.endSec), 0)
  const timelineEnd = Math.max(visualEnd, textEnd, 0.1)

  if (mode === 'audio' && audioDurationSec != null && audioDurationSec > 0) {
    return Math.max(audioDurationSec, timelineEnd)
  }
  return timelineEnd
}

export function clipAtTime(clips: VisualClip[], timeSec: number): VisualClip | null {
  const packed = repackClipStarts(clips)
  for (const clip of packed) {
    if (timeSec >= clip.startSec && timeSec < clip.startSec + clip.durationSec) return clip
  }
  return null
}

export function localTimeInClip(clip: VisualClip, timeSec: number): number {
  return Math.max(0, timeSec - clip.startSec)
}

export function textsVisibleAt(texts: TextLayer[], timeSec: number): TextLayer[] {
  return texts.filter((t) => t.text.trim() && timeSec >= t.startSec && timeSec < t.endSec)
}
