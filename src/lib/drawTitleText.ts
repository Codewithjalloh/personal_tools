import type { FitMode, TextPosition, TitleCardSettings } from '../types'
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

export function drawTitleTextOverlay(
  ctx: CanvasRenderingContext2D,
  card: TitleCardSettings,
  width: number,
  height: number,
) {
  const trimmed = card.text.trim()
  if (!trimmed) return

  const fontSize = Math.max(24, Math.round(width * 0.055 * card.fontScale))
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const maxWidth = width * 0.82
  const lines = wrapLines(ctx, trimmed, maxWidth)
  const lineHeight = fontSize * 1.25
  const blockHeight = lines.length * lineHeight
  const centerY = yForPosition(card.position, height, blockHeight)
  let y = centerY - blockHeight / 2 + lineHeight / 2

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
}

export async function renderSlideWithTitle(
  imageUrl: string,
  card: TitleCardSettings,
  width: number,
  height: number,
  fit: FitMode,
): Promise<Blob> {
  const img = await loadImageElement(imageUrl)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  drawImageOnCanvas(ctx, img, width, height, fit)
  drawTitleTextOverlay(ctx, card, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode PNG'))), 'image/png')
  })
}
