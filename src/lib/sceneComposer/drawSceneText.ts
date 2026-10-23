import { fontStackForId } from '../fonts'
import type { TextLayer } from './types'

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

export type SceneTextStyle = Pick<
  TextLayer,
  'text' | 'x' | 'y' | 'fontScale' | 'color' | 'showBar' | 'fontId'
>

export function drawSceneTextOnCanvas(
  ctx: CanvasRenderingContext2D,
  layer: SceneTextStyle,
  width: number,
  height: number,
) {
  const trimmed = layer.text.trim()
  if (!trimmed) return

  const fontSize = Math.max(18, Math.round(width * 0.045 * layer.fontScale))
  ctx.save()
  ctx.font = `600 ${fontSize}px ${fontStackForId(layer.fontId)}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const maxWidth = width * 0.75
  const lines = wrapLines(ctx, trimmed, maxWidth)
  const lineHeight = fontSize * 1.25
  const blockHeight = lines.length * lineHeight
  const centerX = layer.x * width
  const centerY = layer.y * height
  let y = centerY - blockHeight / 2 + lineHeight / 2

  if (layer.showBar) {
    const barPad = fontSize * 0.45
    const barTop = centerY - blockHeight / 2 - barPad
    const barH = blockHeight + barPad * 2
    const barW = Math.min(width * 0.92, maxWidth + fontSize * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(centerX - barW / 2, barTop, barW, barH)
  }

  for (const line of lines) {
    ctx.strokeStyle = 'rgba(0,0,0,0.75)'
    ctx.lineWidth = Math.max(2, fontSize * 0.1)
    ctx.lineJoin = 'round'
    ctx.strokeText(line, centerX, y)
    ctx.fillStyle = layer.color
    ctx.fillText(line, centerX, y)
    y += lineHeight
  }
  ctx.restore()
}

export async function renderTextOverlayPng(
  layer: SceneTextStyle,
  width: number,
  height: number,
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  drawSceneTextOnCanvas(ctx, layer, width, height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode PNG'))), 'image/png')
  })
  return new Uint8Array(await blob.arrayBuffer())
}
