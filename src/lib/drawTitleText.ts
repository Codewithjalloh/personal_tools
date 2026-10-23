import type { AnimState } from './textAnimation'
import { getAnimState } from './textAnimation'
import type { FitMode, TextPosition, TitleCardSettings } from '../types'
import { fontStackForId } from './fonts'
import { drawImageOnCanvas, loadImageElement } from './drawFrame'

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/)
  if (words.length === 0) return []

  const lines: string[] = []
  let line = words[0]
  for (let i = 1; i < words.length; i++) {
    const next = `${line} ${words[i]}`
    if (ctx.measureText(next).width <= maxWidth) {
      line = next
    } else {
      lines.push(line)
      line = words[i]
    }
  }
  lines.push(line)
  return lines
}

function yForPosition(position: TextPosition, height: number, blockHeight: number): number {
  const pad = height * 0.1
  if (position === 'top') return pad + blockHeight / 2
  if (position === 'bottom') return height - pad - blockHeight / 2
  return height / 2
}

function displayText(full: string, anim: AnimState, animation: TitleCardSettings['animation']) {
  if (animation !== 'typewriter') return full
  const n = Math.max(0, Math.floor(full.length * anim.visibleRatio))
  return full.slice(0, n)
}

export function drawTitleTextOverlay(
  ctx: CanvasRenderingContext2D,
  card: TitleCardSettings,
  width: number,
  height: number,
  animProgress = 1,
) {
  const trimmed = card.text.trim()
  if (!trimmed) return

  const anim = getAnimState(card.animation, animProgress)
  const shown = displayText(trimmed, anim, card.animation)
  if (!shown) return

  const fontSize = Math.max(24, Math.round(width * 0.055 * card.fontScale))
  ctx.save()
  ctx.globalAlpha = anim.opacity
  ctx.font = `600 ${fontSize}px ${fontStackForId(card.fontId)}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const maxWidth = width * 0.82
  const lines = wrapLines(ctx, shown, maxWidth)
  const lineHeight = fontSize * 1.25
  const blockHeight = lines.length * lineHeight
  const centerY = yForPosition(card.position, height, blockHeight)
  let y = centerY - blockHeight / 2 + lineHeight / 2

  const cx = width / 2
  const cy = centerY
  ctx.translate(cx, cy + anim.offsetY)
  ctx.scale(anim.scale, anim.scale)
  ctx.translate(-cx, -cy)

  if (card.showBar) {
    const barPad = fontSize * 0.5
    const barTop = centerY - blockHeight / 2 - barPad
    const barH = blockHeight + barPad * 2
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(width * 0.06, barTop, width * 0.88, barH)
  }

  for (const line of lines) {
    ctx.strokeStyle = 'rgba(0,0,0,0.75)'
    ctx.lineWidth = Math.max(3, fontSize * 0.12)
    ctx.lineJoin = 'round'
    ctx.strokeText(line, width / 2, y)
    ctx.fillStyle = card.color
    ctx.fillText(line, width / 2, y)
    y += lineHeight
  }
  ctx.restore()
}

export async function renderSlideWithTitle(
  imageUrl: string,
  card: TitleCardSettings,
  width: number,
  height: number,
  fit: FitMode,
  animProgress = 1,
): Promise<Blob> {
  const img = await loadImageElement(imageUrl)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  drawImageOnCanvas(ctx, img, width, height, fit)
  drawTitleTextOverlay(ctx, card, width, height, animProgress)

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode PNG'))), 'image/png')
  })
}

const INTRO_EXPORT_FPS = 24

export async function renderTitleAnimationFrames(
  imageUrl: string,
  card: TitleCardSettings,
  width: number,
  height: number,
  fit: FitMode,
  durationSec: number,
  framePrefix: string,
): Promise<{ name: string; bytes: Uint8Array; pattern: string }[]> {
  const img = await loadImageElement(imageUrl)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const totalFrames = Math.max(1, Math.ceil(durationSec * INTRO_EXPORT_FPS))
  const window = Math.min(2.5, Math.max(0.8, durationSec * 0.35))
  const pattern = `${framePrefix}_%04d.png`
  const frames: { name: string; bytes: Uint8Array; pattern: string }[] = []

  for (let f = 0; f < totalFrames; f++) {
    const time = f / INTRO_EXPORT_FPS
    const animProgress =
      card.animation === 'none' ? 1 : Math.min(1, time / window)

    ctx.globalAlpha = 1
    drawImageOnCanvas(ctx, img, width, height, fit)
    drawTitleTextOverlay(ctx, card, width, height, animProgress)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Frame encode failed'))), 'image/png')
    })
    frames.push({
      name: `${framePrefix}_${String(f).padStart(4, '0')}.png`,
      bytes: new Uint8Array(await blob.arrayBuffer()),
      pattern,
    })
  }

  return frames
}

export const renderIntroAnimationFrames = (
  imageUrl: string,
  card: TitleCardSettings,
  width: number,
  height: number,
  fit: FitMode,
  durationSec: number,
) => renderTitleAnimationFrames(imageUrl, card, width, height, fit, durationSec, 'intro')

export { INTRO_EXPORT_FPS }
