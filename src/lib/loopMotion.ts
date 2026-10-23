import type { FitMode } from '../types'

export type LoopMotionStyle =
  | 'static'
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'pan-up'
  | 'pan-down'
  | 'drift'
  | 'pulse'
  | 'sway'

/** Styles users often combine for a 1-minute mix (multi-select). */
export const LOOP_MOTION_MIX_IDS: LoopMotionStyle[] = [
  'static',
  'zoom-in',
  'zoom-out',
  'pan-left',
  'pan-right',
  'pan-up',
]

export function normalizeMotionSelection(motions: LoopMotionStyle[]): LoopMotionStyle[] {
  const seen = new Set<LoopMotionStyle>()
  const out: LoopMotionStyle[] = []
  for (const m of motions) {
    if (seen.has(m)) continue
    seen.add(m)
    out.push(m)
  }
  return out.length > 0 ? out : ['static']
}

export type MotionSegmentSample = {
  style: LoopMotionStyle
  /** 0..1 progress within the current segment. */
  segmentProgress: number
}

/** Map elapsed time into one of several motion segments (equal length). */
export function motionAtElapsed(
  elapsedSec: number,
  motions: LoopMotionStyle[],
  cycleDurationSec: number,
): MotionSegmentSample {
  const list = normalizeMotionSelection(motions)
  if (list.length === 1) {
    const cycle = Math.max(0.001, cycleDurationSec)
    const t = ((elapsedSec % cycle) + cycle) % cycle / cycle
    return { style: list[0], segmentProgress: t }
  }
  const total = Math.max(0.001, cycleDurationSec)
  const seg = total / list.length
  const idx = Math.min(list.length - 1, Math.max(0, Math.floor(elapsedSec / seg)))
  const tInSeg = Math.min(1, Math.max(0, (elapsedSec - idx * seg) / seg))
  return { style: list[idx], segmentProgress: tInSeg }
}

export const LOOP_MOTION_OPTIONS: { id: LoopMotionStyle; label: string; hint: string }[] = [
  { id: 'static', label: 'Static', hint: 'No movement' },
  { id: 'zoom-in', label: 'Zoom in', hint: 'Slow push in' },
  { id: 'zoom-out', label: 'Zoom out', hint: 'Slow pull back' },
  { id: 'pan-left', label: 'Pan left', hint: 'Drift left' },
  { id: 'pan-right', label: 'Pan right', hint: 'Drift right' },
  { id: 'pan-up', label: 'Pan up', hint: 'Drift up' },
  { id: 'pan-down', label: 'Pan down', hint: 'Drift down' },
  { id: 'drift', label: 'Diagonal drift', hint: 'Pan + mild zoom' },
  { id: 'pulse', label: 'Pulse', hint: 'Breathing zoom (loops cleanly)' },
  { id: 'sway', label: 'Sway', hint: 'Gentle side-to-side' },
]

const FPS = 30

export type LoopMotionTransform = {
  /** Uniform scale applied to drawn image (1 = fit frame). */
  scale: number
  /** Pan offset as fraction of extra width (0 = centered, 1 = max right). */
  panX: number
  /** Pan offset as fraction of extra height. */
  panY: number
}

/** `t` is 0..1 within one source clip cycle. */
export function loopMotionAt(t: number, style: LoopMotionStyle): LoopMotionTransform {
  const clamped = Math.min(1, Math.max(0, t))
  switch (style) {
    case 'static':
      return { scale: 1, panX: 0.5, panY: 0.5 }
    case 'zoom-in':
      return { scale: 1 + clamped * 0.12, panX: 0.5, panY: 0.5 }
    case 'zoom-out':
      return { scale: 1.12 - clamped * 0.12, panX: 0.5, panY: 0.5 }
    case 'pan-left':
      return { scale: 1.08, panX: 1 - clamped, panY: 0.5 }
    case 'pan-right':
      return { scale: 1.08, panX: clamped, panY: 0.5 }
    case 'pan-up':
      return { scale: 1.08, panX: 0.5, panY: 1 - clamped }
    case 'pan-down':
      return { scale: 1.08, panX: 0.5, panY: clamped }
    case 'drift':
      return {
        scale: 1 + clamped * 0.08,
        panX: clamped,
        panY: clamped * 0.5,
      }
    case 'pulse': {
      const wave = (Math.sin(clamped * Math.PI * 2) + 1) / 2
      return { scale: 1 + wave * 0.07, panX: 0.5, panY: 0.5 }
    }
    case 'sway': {
      const wave = (Math.sin(clamped * Math.PI * 2) + 1) / 2
      return { scale: 1.06, panX: wave, panY: 0.5 }
    }
    default:
      return { scale: 1, panX: 0.5, panY: 0.5 }
  }
}

export function drawLoopMotionFrame(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource & { naturalWidth?: number; naturalHeight?: number },
  width: number,
  height: number,
  fit: FitMode,
  style: LoopMotionStyle,
  clipProgress: number,
) {
  const srcW = img.naturalWidth ?? 0
  const srcH = img.naturalHeight ?? 0
  if (srcW <= 0 || srcH <= 0) return

  const { scale, panX, panY } = loopMotionAt(clipProgress, style)

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)

  const baseScale = fit === 'cover' ? Math.max(width / srcW, height / srcH) : Math.min(width / srcW, height / srcH)
  const drawScale = baseScale * scale
  const drawW = srcW * drawScale
  const drawH = srcH * drawScale

  const extraX = Math.max(0, drawW - width)
  const extraY = Math.max(0, drawH - height)
  const x = (width - drawW) / 2 - extraX * (panX - 0.5)
  const y = (height - drawH) / 2 - extraY * (panY - 0.5)

  ctx.drawImage(img, x, y, drawW, drawH)
}

export function loopMotionZoompanFilter(
  style: LoopMotionStyle,
  width: number,
  height: number,
  durationSec: number,
  inputLabel: string,
  outputLabel: string,
): string | null {
  if (style === 'static') return null

  const frames = Math.max(1, Math.round(durationSec * FPS))
  const f = String(frames)

  const base = `${inputLabel}zoompan=`
  const size = `:d=${frames}:s=${width}x${height}:fps=${FPS}${outputLabel}`

  switch (style) {
    case 'zoom-in':
      return `${base}z='min(zoom+0.0012,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'${size}`
    case 'zoom-out':
      return `${base}z='if(eq(on,0),1.12,max(1.0,zoom-0.0012))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'${size}`
    case 'pan-left':
      return `${base}z=1.08:x='(iw-iw/zoom)*(1-on/${f})':y='ih/2-ih/zoom/2'${size}`
    case 'pan-right':
      return `${base}z=1.08:x='(iw-iw/zoom)*(on/${f})':y='ih/2-ih/zoom/2'${size}`
    case 'pan-up':
      return `${base}z=1.08:x='iw/2-iw/zoom/2':y='(ih-ih/zoom)*(1-on/${f})'${size}`
    case 'pan-down':
      return `${base}z=1.08:x='iw/2-iw/zoom/2':y='(ih-ih/zoom)*(on/${f})'${size}`
    case 'drift':
      return `${base}z='min(zoom+0.0006,1.08)':x='(iw-iw/zoom)*(on/${f})':y='(ih-ih/zoom)*(on/${f})*0.5'${size}`
    case 'pulse':
      return `${base}z='1+0.07*sin(2*PI*on/${f})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'${size}`
    case 'sway':
      return `${base}z=1.06:x='(iw-iw/zoom)*(0.5+0.5*sin(2*PI*on/${f}))':y='ih/2-ih/zoom/2'${size}`
    default:
      return null
  }
}
