function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image for thumbnail'))
    img.src = url
  })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
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
  return lines.slice(0, 4)
}

/** 1280×720 Excellent117-style thumbnail using a licensed photo background */
export async function buildCanvasThumbnail(opts: {
  partNumber: number
  youtubeTitle: string
  backgroundUrl?: string
}): Promise<string> {
  const w = 1280
  const h = 720
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, w, h)

  if (opts.backgroundUrl) {
    try {
      const img = await loadImage(opts.backgroundUrl)
      const scale = Math.max(w / img.width, h / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
    } catch {
      // solid background fallback
    }
  }

  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, 'rgba(0,0,0,0.75)')
  grad.addColorStop(0.5, 'rgba(10,10,10,0.55)')
  grad.addColorStop(1, 'rgba(0,0,0,0.85)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = '#d4af37'
  ctx.fillRect(0, h - 8, w, 8)

  ctx.font = '600 28px system-ui, sans-serif'
  ctx.fillStyle = '#d4af37'
  ctx.fillText('EXCELLENT117', 56, 72)

  ctx.font = '700 22px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText(`PART ${opts.partNumber}`, 56, 108)

  ctx.font = '800 52px Georgia, "Times New Roman", serif'
  ctx.fillStyle = '#ffffff'
  const lines = wrapText(ctx, opts.youtubeTitle, w - 112)
  let y = 200
  for (const line of lines) {
    ctx.fillText(line, 56, y)
    y += 62
  }

  ctx.font = '500 24px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(212,175,55,0.95)'
  ctx.fillText('Think Deeply · Speak Freely · Question Everything', 56, h - 48)

  return canvas.toDataURL('image/jpeg', 0.92)
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}
