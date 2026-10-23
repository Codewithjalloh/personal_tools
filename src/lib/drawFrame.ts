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
  img: CanvasImageSource & { naturalWidth?: number; naturalHeight?: number; videoWidth?: number; videoHeight?: number },
  width: number,
  height: number,
  fit: FitMode,
) {
  const srcW = img.naturalWidth ?? img.videoWidth ?? 0
  const srcH = img.naturalHeight ?? img.videoHeight ?? 0
  if (srcW <= 0 || srcH <= 0) return
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)

  const scale =
    fit === 'cover' ? Math.max(width / srcW, height / srcH) : Math.min(width / srcW, height / srcH)

  const drawW = srcW * scale
  const drawH = srcH * scale
  const x = (width - drawW) / 2
  const y = (height - drawH) / 2

  ctx.drawImage(img, x, y, drawW, drawH)
}
