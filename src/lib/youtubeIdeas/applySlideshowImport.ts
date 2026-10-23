import { clearSlideshowImport, peekSlideshowImport } from './slideshowBridge'

export async function fetchSlideshowImportFiles(): Promise<{ introTitle: string; files: File[] } | null> {
  const pending = peekSlideshowImport()
  if (!pending || pending.imageUrls.length === 0) return null
  clearSlideshowImport()

  const files: File[] = []
  for (let i = 0; i < pending.imageUrls.length; i++) {
    try {
      const res = await fetch(pending.imageUrls[i])
      if (!res.ok) continue
      const blob = await res.blob()
      const ext = blob.type.includes('png') ? 'png' : 'jpg'
      files.push(new File([blob], `excellent117-slide-${i + 1}.${ext}`, { type: blob.type || 'image/jpeg' }))
    } catch {
      // skip failed URLs (CORS or network)
    }
  }
  if (files.length === 0) return null
  return { introTitle: pending.introTitle, files }
}
