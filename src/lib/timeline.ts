import type { SlideItem, TitleCardSettings } from '../types'

export function titleDurationSec(card: TitleCardSettings): number {
  return card.text.trim() ? card.durationSec : 0
}

export function bookendDurationSec(intro: TitleCardSettings, outro: TitleCardSettings): number {
  return titleDurationSec(intro) + titleDurationSec(outro)
}

export function bodyDurationSec(
  slideCount: number,
  totalDurationSec: number,
  intro: TitleCardSettings,
  outro: TitleCardSettings,
): number {
  if (slideCount === 0) return 0
  return totalDurationSec - bookendDurationSec(intro, outro)
}

export function computeSlideDurations(
  slides: SlideItem[],
  totalDurationSec: number,
  intro: TitleCardSettings,
  outro: TitleCardSettings,
): number[] {
  const body = bodyDurationSec(slides.length, totalDurationSec, intro, outro)
  if (body <= 0) return slides.map(() => 0)

  const fixedSum = slides.reduce((sum, s) => sum + (s.durationSec ?? 0), 0)
  const autoCount = slides.filter((s) => s.durationSec == null).length
  const remaining = body - fixedSum
  const autoEach = autoCount > 0 ? remaining / autoCount : 0

  return slides.map((s) => s.durationSec ?? autoEach)
}

export type TimelineSegment =
  | { kind: 'intro'; slideIndex: 0; duration: number }
  | { kind: 'slide'; slideIndex: number; duration: number }
  | { kind: 'outro'; slideIndex: number; duration: number }

export function buildTimeline(
  slides: SlideItem[],
  totalDurationSec: number,
  intro: TitleCardSettings,
  outro: TitleCardSettings,
): TimelineSegment[] {
  if (slides.length === 0) return []

  const segments: TimelineSegment[] = []
  const introD = titleDurationSec(intro)
  const outroD = titleDurationSec(outro)
  const slideDurs = computeSlideDurations(slides, totalDurationSec, intro, outro)

  if (introD > 0) {
    segments.push({ kind: 'intro', slideIndex: 0, duration: introD })
  }
  for (let i = 0; i < slides.length; i++) {
    segments.push({ kind: 'slide', slideIndex: i, duration: slideDurs[i] })
  }
  if (outroD > 0) {
    segments.push({ kind: 'outro', slideIndex: slides.length - 1, duration: outroD })
  }
  return segments
}

export function getFrameAtTime(
  t: number,
  slides: SlideItem[],
  totalDurationSec: number,
  intro: TitleCardSettings,
  outro: TitleCardSettings,
): { slideIndex: number; overlay: 'intro' | 'outro' | null } {
  if (slides.length === 0) return { slideIndex: 0, overlay: null }

  const clampedT = ((t % totalDurationSec) + totalDurationSec) % totalDurationSec
  const segments = buildTimeline(slides, totalDurationSec, intro, outro)
  let elapsed = 0

  for (const seg of segments) {
    if (clampedT < elapsed + seg.duration) {
      if (seg.kind === 'intro') return { slideIndex: 0, overlay: 'intro' }
      if (seg.kind === 'outro') return { slideIndex: seg.slideIndex, overlay: 'outro' }
      return { slideIndex: seg.slideIndex, overlay: null }
    }
    elapsed += seg.duration
  }

  const last = slides.length - 1
  return { slideIndex: last, overlay: titleDurationSec(outro) > 0 ? 'outro' : null }
}

export type TimelineValidation = { ok: true } | { ok: false; message: string }

export function validateTimeline(
  slides: SlideItem[],
  totalDurationSec: number,
  intro: TitleCardSettings,
  outro: TitleCardSettings,
): TimelineValidation {
  if (slides.length === 0) return { ok: false, message: 'Add at least one image' }

  const bookends = bookendDurationSec(intro, outro)
  if (bookends >= totalDurationSec) {
    return {
      ok: false,
      message: `Video must be longer than intro + outro (${bookends.toFixed(1)}s)`,
    }
  }

  const body = bodyDurationSec(slides.length, totalDurationSec, intro, outro)
  const fixedSum = slides.reduce((sum, s) => sum + (s.durationSec ?? 0), 0)
  if (fixedSum > body + 0.01) {
    return {
      ok: false,
      message: `Custom slide times (${fixedSum.toFixed(1)}s) exceed body time (${body.toFixed(1)}s)`,
    }
  }

  const slideDurs = computeSlideDurations(slides, totalDurationSec, intro, outro)
  if (slideDurs.some((d) => d < 0.2)) {
    return { ok: false, message: 'Some slides would be under 0.2s — shorten intro/outro or lengthen video' }
  }

  return { ok: true }
}
