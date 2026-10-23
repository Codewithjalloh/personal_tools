import type { FitMode } from '../types'

export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

export function drawImageOnCanvas(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  fit: FitMode,
) {
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)

  const scale =
    fit === 'cover'
      ? Math.max(width / img.naturalWidth, height / img.naturalHeight)
      : Math.min(width / img.naturalWidth, height / img.naturalHeight)

  const drawW = img.naturalWidth * scale
  const drawH = img.naturalHeight * scale
  const x = (width - drawW) / 2
  const y = (height - drawH) / 2

  ctx.drawImage(img, x, y, drawW, drawH)
}
