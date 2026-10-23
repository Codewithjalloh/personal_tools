const KEY = 'excellent117.slideshowImport.v1'

export type SlideshowImportPayload = {
  introTitle: string
  imageUrls: string[]
  createdAt: string
}

export function queueSlideshowImport(payload: Omit<SlideshowImportPayload, 'createdAt'>): void {
  const item: SlideshowImportPayload = { ...payload, createdAt: new Date().toISOString() }
  sessionStorage.setItem(KEY, JSON.stringify(item))
}

export function peekSlideshowImport(): SlideshowImportPayload | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as SlideshowImportPayload
  } catch {
    return null
  }
}

export function clearSlideshowImport(): void {
  sessionStorage.removeItem(KEY)
}
