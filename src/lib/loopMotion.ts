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

export const LOOP_MOTION_OPTIONS: { id: LoopMotionStyle; label: string; hint: string }[] = [
  { id: 'static', label: 'Static', hint: 'No movement' },
  { id: 'zoom-in', label: 'Zoom in', hint: 'Slow push in & out' },
  { id: 'zoom-out', label: 'Zoom out', hint: 'Pull back & return' },
  { id: 'pan-left', label: 'Pan left', hint: 'Drift left & back' },
  { id: 'pan-right', label: 'Pan right', hint: 'Drift right & back' },
  { id: 'pan-up', label: 'Pan up', hint: 'Drift up & back' },
  { id: 'pan-down', label: 'Pan down', hint: 'Drift down & back' },
  { id: 'drift', label: 'Diagonal drift', hint: 'Figure-eight drift' },
  { id: 'pulse', label: 'Pulse', hint: 'Breathing zoom' },
  { id: 'sway', label: 'Sway', hint: 'Gentle side-to-side' },
]

const TAU = Math.PI * 2

/** 0 at t=0 and t=1 — smooth rise and fall (one loop cycle). */
function loopWave(t: number): number {
  const clamped = Math.min(1, Math.max(0, t))
  return (1 - Math.cos(clamped * TAU)) / 2
}

export type LoopMotionTransform = {
  scale: number
  panX: number
  panY: number
}

/** Periodic motion: ends match starts for seamless loops. `t` is 0..1 within one cycle. */
export function loopMotionAt(t: number, style: LoopMotionStyle): LoopMotionTransform {
  const w = loopWave(t)
  const s = Math.sin(t * TAU)
  const c = Math.cos(t * TAU)

  switch (style) {
    case 'static':
      return { scale: 1, panX: 0.5, panY: 0.5 }
    case 'zoom-in':
      return { scale: 1 + w * 0.09, panX: 0.5, panY: 0.5 }
    case 'zoom-out':
      return { scale: 1 + (1 - w) * 0.06, panX: 0.5, panY: 0.5 }
    case 'pan-left':
      return { scale: 1.05, panX: 0.5 - s * 0.2, panY: 0.5 }
    case 'pan-right':
      return { scale: 1.05, panX: 0.5 + s * 0.2, panY: 0.5 }
    case 'pan-up':
      return { scale: 1.05, panX: 0.5, panY: 0.5 - s * 0.2 }
    case 'pan-down':
      return { scale: 1.05, panX: 0.5, panY: 0.5 + s * 0.2 }
    case 'drift':
      return {
        scale: 1 + w * 0.05,
        panX: 0.5 + s * 0.14,
        panY: 0.5 + c * 0.08,
      }
    case 'pulse':
      return { scale: 1 + w * 0.06, panX: 0.5, panY: 0.5 }
    case 'sway':
      return { scale: 1.04, panX: 0.5 + s * 0.16, panY: 0.5 }
    default:
      return { scale: 1, panX: 0.5, panY: 0.5 }
  }
}

function segmentGaussianWeight(pos: number, segIndex: number, segLen: number, cycle: number): number {
  const center = (segIndex + 0.5) * segLen
  const sigma = segLen * 0.48
  const distances = [pos - center, pos - center + cycle, pos - center - cycle]
  let w = 0
  for (const d of distances) {
    w = Math.max(w, Math.exp(-0.5 * (d / sigma) ** 2))
  }
  return w
}

/**
 * Smooth blend across multiple motion styles (no hard cuts).
 * Single style uses one periodic cycle over `cycleDurationSec`.
 */
export function loopMotionTransformContinuous(
  elapsedSec: number,
  motions: LoopMotionStyle[],
  cycleDurationSec: number,
): LoopMotionTransform {
  const list = normalizeMotionSelection(motions)
  const cycle = Math.max(0.001, cycleDurationSec)
  const pos = ((elapsedSec % cycle) + cycle) % cycle

  if (list.length === 1) {
    return loopMotionAt(pos / cycle, list[0])
  }

  const seg = cycle / list.length
  let wSum = 0
  let scale = 0
  let panX = 0
  let panY = 0

  for (let i = 0; i < list.length; i++) {
    const weight = segmentGaussianWeight(pos, i, seg, cycle)
    if (weight < 0.0005) continue
    const local = Math.min(1, Math.max(0, (pos - i * seg) / seg))
    const tr = loopMotionAt(local, list[i])
    scale += tr.scale * weight
    panX += tr.panX * weight
    panY += tr.panY * weight
    wSum += weight
  }

  if (wSum <= 0) return loopMotionAt(pos / cycle, list[0])
  return { scale: scale / wSum, panX: panX / wSum, panY: panY / wSum }
}

export function drawLoopMotionTransform(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource & { naturalWidth?: number; naturalHeight?: number },
  width: number,
  height: number,
  fit: FitMode,
  transform: LoopMotionTransform,
) {
  const srcW = img.naturalWidth ?? 0
  const srcH = img.naturalHeight ?? 0
  if (srcW <= 0 || srcH <= 0) return

  const { scale, panX, panY } = transform

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

export function drawLoopMotionFrame(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource & { naturalWidth?: number; naturalHeight?: number },
  width: number,
  height: number,
  fit: FitMode,
  style: LoopMotionStyle,
  clipProgress: number,
) {
  drawLoopMotionTransform(ctx, img, width, height, fit, loopMotionAt(clipProgress, style))
}
