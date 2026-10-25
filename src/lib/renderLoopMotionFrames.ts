import { loadImageElement } from './drawFrame'
import {
  drawLoopMotionTransform,
  loopMotionTransformContinuous,
  normalizeMotionSelection,
  type LoopMotionStyle,
} from './loopMotion'
import type { FitMode } from '../types'

const FRAME_PREFIX = 'loop_motion'

export async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode frame'))), 'image/png')
  })
  return new Uint8Array(await blob.arrayBuffer())
}

export async function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob)
  try {
    return await loadImageElement(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export type RenderMotionFramesOptions = {
  width?: number
  height?: number
  durationSec: number
  fit: FitMode
  motions: LoopMotionStyle[]
  fps?: number
  onFrame?: (frameIndex: number, totalFrames: number) => void
}

export async function renderLoopMotionFrameFiles(
  imageBlob: Blob,
  options: RenderMotionFramesOptions,
): Promise<{ pattern: string; files: { name: string; bytes: Uint8Array }[] }> {
  const width = options.width ?? 1280
  const height = options.height ?? 720
  const fps = options.fps ?? (options.durationSec > 20 ? 24 : 30)
  const totalFrames = Math.max(1, Math.round(options.durationSec * fps))
  const motions = normalizeMotionSelection(options.motions)

  const img = await loadImageFromBlob(imageBlob)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const pattern = `${FRAME_PREFIX}_%04d.png`
  const files: { name: string; bytes: Uint8Array }[] = []

  for (let f = 0; f < totalFrames; f++) {
    const elapsed = f / fps
    const tr = loopMotionTransformContinuous(elapsed, motions, options.durationSec)
    drawLoopMotionTransform(ctx, img, width, height, options.fit, tr)
    const name = `${FRAME_PREFIX}_${String(f).padStart(4, '0')}.png`
    files.push({ name, bytes: await canvasToPngBytes(canvas) })
    options.onFrame?.(f + 1, totalFrames)
  }

  return { pattern, files }
}
