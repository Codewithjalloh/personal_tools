import {
  EXCELLENT117_BRAND,
  THUMBNAIL_DEFAULT_TAGLINE,
} from '../../../shared/youtubeIdeas/constants'
import type { ThumbnailFontId, ThumbnailPrefs, ThumbnailTextAlign } from '../../../shared/youtubeIdeas/types'
import { fontStackForId } from '../fonts'
import type { TitleFontId } from '../../types'

export const THUMBNAIL_ALIGN_OPTIONS: { id: ThumbnailTextAlign; label: string }[] = [
  { id: 'left', label: 'Left' },
  { id: 'center', label: 'Center' },
  { id: 'right', label: 'Right' },
]

export const THUMBNAIL_FONT_OPTIONS: { id: ThumbnailFontId; label: string }[] = [
  { id: 'system', label: 'System sans' },
  { id: 'serif', label: 'Classic serif' },
  { id: 'mono', label: 'Mono' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'condensed', label: 'Condensed' },
]

export const THUMBNAIL_DEFAULT_COLORS = {
  brand: '#d4af37',
  partLabel: '#e8e8e8',
  headline: '#ffffff',
  tagline: '#d4af37',
  accent: '#d4af37',
} as const

function fontStack(id: ThumbnailFontId): string {
  return fontStackForId(id as TitleFontId)
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image for thumbnail'))
    img.src = url
  })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, maxLines)
}

function textX(align: ThumbnailTextAlign, w: number, pad: number): number {
  if (align === 'center') return w / 2
  if (align === 'right') return w - pad
  return pad
}

function drawAlignedLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  y: number,
  align: ThumbnailTextAlign,
  w: number,
  pad: number,
): void {
  ctx.textAlign = align
  ctx.fillText(line, textX(align, w, pad), y)
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  focalY: number,
): void {
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  let dx = (w - dw) / 2
  let dy = (h - dh) / 2
  if (dh > h) dy = -(dh - h) * focalY
  if (dw > w) dx = -(dw - w) * 0.5
  ctx.drawImage(img, dx, dy, dw, dh)
}

export function defaultPartLabel(partNumber: number): string {
  return `PART ${partNumber}`
}

export function defaultThumbnailPrefs(partNumber: number, headline: string, backgroundUrl?: string): ThumbnailPrefs {
  return {
    brandText: EXCELLENT117_BRAND.toUpperCase(),
    partLabel: defaultPartLabel(partNumber),
    headline: headline.trim(),
    tagline: THUMBNAIL_DEFAULT_TAGLINE,
    backgroundUrl,
    focalY: 0.35,
    headlineFont: 'serif',
    detailFont: 'system',
    brandColor: THUMBNAIL_DEFAULT_COLORS.brand,
    partLabelColor: THUMBNAIL_DEFAULT_COLORS.partLabel,
    headlineColor: THUMBNAIL_DEFAULT_COLORS.headline,
    taglineColor: THUMBNAIL_DEFAULT_COLORS.tagline,
    accentColor: THUMBNAIL_DEFAULT_COLORS.accent,
    brandAlign: 'left',
    partAlign: 'left',
    headlineAlign: 'left',
    taglineAlign: 'left',
  }
}

/** Fill in new fields when loading older saved prefs. */
export function normalizeThumbnailPrefs(
  raw: Partial<ThumbnailPrefs>,
  partNumber: number,
  headline: string,
): ThumbnailPrefs {
  const base = defaultThumbnailPrefs(partNumber, headline, raw.backgroundUrl)
  return {
    ...base,
    ...raw,
    headline: (raw.headline ?? base.headline).trim() || headline.trim(),
    partLabel: raw.partLabel ?? base.partLabel,
    headlineFont: raw.headlineFont ?? base.headlineFont,
    detailFont: raw.detailFont ?? base.detailFont,
    brandColor: raw.brandColor ?? base.brandColor,
    partLabelColor: raw.partLabelColor ?? base.partLabelColor,
    headlineColor: raw.headlineColor ?? base.headlineColor,
    taglineColor: raw.taglineColor ?? base.taglineColor,
    accentColor: raw.accentColor ?? base.accentColor,
    brandAlign: raw.brandAlign ?? base.brandAlign,
    partAlign: raw.partAlign ?? base.partAlign,
    headlineAlign: raw.headlineAlign ?? base.headlineAlign,
    taglineAlign: raw.taglineAlign ?? base.taglineAlign,
  }
}

/** 1280×720 Excellent117-style thumbnail using a licensed photo background */
export async function buildCanvasThumbnail(prefs: ThumbnailPrefs): Promise<string> {
  const w = 1280
  const h = 720
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const brandText = (prefs.brandText ?? EXCELLENT117_BRAND).toUpperCase()
  const tagline = prefs.tagline ?? THUMBNAIL_DEFAULT_TAGLINE
  const focalY = prefs.focalY ?? 0.35
  const detailStack = fontStack(prefs.detailFont)
  const headlineStack = fontStack(prefs.headlineFont)

  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, w, h)

  if (prefs.backgroundUrl) {
    try {
      const img = await loadImage(prefs.backgroundUrl)
      drawCoverImage(ctx, img, w, h, focalY)
    } catch {
      // solid background fallback
    }
  }

  const grad = ctx.createLinearGradient(0, 0, w * 0.6, h)
  grad.addColorStop(0, 'rgba(0,0,0,0.88)')
  grad.addColorStop(0.45, 'rgba(8,8,8,0.55)')
  grad.addColorStop(1, 'rgba(0,0,0,0.35)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(0, h - 120, w, 120)

  ctx.fillStyle = prefs.accentColor
  ctx.fillRect(0, h - 8, w, 8)

  const pad = 56
  const textShadow = () => {
    ctx.shadowColor = 'rgba(0,0,0,0.85)'
    ctx.shadowBlur = 14
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 2
  }
  const clearShadow = () => {
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  const textBlockWidth = w - pad * 2

  textShadow()
  ctx.font = `600 28px ${detailStack}`
  ctx.fillStyle = prefs.brandColor
  drawAlignedLine(ctx, brandText, 72, prefs.brandAlign, w, pad)
  clearShadow()

  textShadow()
  ctx.font = `700 22px ${detailStack}`
  ctx.fillStyle = prefs.partLabelColor
  drawAlignedLine(ctx, prefs.partLabel, 108, prefs.partAlign, w, pad)
  clearShadow()

  textShadow()
  ctx.font = `800 52px ${headlineStack}`
  ctx.fillStyle = prefs.headlineColor
  const lines = wrapText(ctx, prefs.headline, textBlockWidth, 4)
  let y = 196
  for (const line of lines) {
    drawAlignedLine(ctx, line, y, prefs.headlineAlign, w, pad)
    y += 58
  }
  clearShadow()

  textShadow()
  ctx.font = `500 22px ${detailStack}`
  ctx.fillStyle = prefs.taglineColor
  const tagLines = wrapText(ctx, tagline, textBlockWidth, 2)
  let ty = h - 52 - (tagLines.length - 1) * 28
  for (const line of tagLines) {
    drawAlignedLine(ctx, line, ty, prefs.taglineAlign, w, pad)
    ty += 28
  }
  clearShadow()

  ctx.textAlign = 'left'

  return canvas.toDataURL('image/jpeg', 0.92)
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}
