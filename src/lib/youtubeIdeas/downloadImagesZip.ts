import JSZip from 'jszip'
import type { ImageAsset } from '../../../shared/youtubeIdeas/types'

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(',')
  const mime = meta.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg'
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function safeName(s: string): string {
  return s.replace(/[^\w\-]+/g, '-').slice(0, 40)
}

export async function downloadEpisodeImagesZip(
  partNumber: number,
  title: string,
  images: ImageAsset[],
  thumbnailDataUrl?: string,
): Promise<void> {
  if (images.length === 0 && !thumbnailDataUrl) {
    throw new Error('No images to download')
  }

  const zip = new JSZip()
  const root = zip.folder(`excellent117-part-${partNumber}`) ?? zip

  const lines: string[] = [`Part ${partNumber} — ${title}`, '']

  let index = 1
  for (const img of images) {
    try {
      const res = await fetch(img.url)
      if (!res.ok) continue
      const blob = await res.blob()
      const ext = blob.type.includes('png') ? 'png' : 'jpg'
      const name = `${String(index).padStart(2, '0')}-${safeName(img.searchQuery || 'image')}.${ext}`
      root.file(name, blob)
      lines.push(
        `${name}`,
        `  Alt: ${img.alt}`,
        `  ${img.attribution ?? ''}`,
        `  Source: ${img.sourceWebsite ?? img.url}`,
        `  License: ${img.license ?? 'See source'}`,
        '',
      )
      index++
    } catch {
      lines.push(`(skipped — could not download: ${img.url})`, '')
    }
  }

  if (thumbnailDataUrl) {
    root.file('thumbnail.jpg', dataUrlToBlob(thumbnailDataUrl))
    lines.push('thumbnail.jpg — generated episode thumbnail', '')
  }

  root.file('attributions.txt', lines.join('\n'))

  const blob = await zip.generateAsync({ type: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `excellent117-part-${partNumber}-images.zip`
  a.click()
  URL.revokeObjectURL(a.href)
}
