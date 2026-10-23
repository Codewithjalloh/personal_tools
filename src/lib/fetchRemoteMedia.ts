export function isLikelyVideoUrl(url: string, mime?: string): boolean {
  if (mime?.startsWith('video/')) return true
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)
}

export function isLikelyImageUrl(url: string, mime?: string): boolean {
  if (mime?.startsWith('image/')) return true
  return /\.(png|jpe?g|gif|webp|avif)(\?|#|$)/i.test(url)
}

export async function fetchRemoteMedia(url: string): Promise<{ blob: Blob; mime: string }> {
  const trimmed = url.trim()
  if (!trimmed) throw new Error('Enter a URL')
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error('Invalid URL')
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http(s) URLs are supported')
  }

  const res = await fetch(trimmed)
  if (!res.ok) throw new Error(`Could not fetch (${res.status})`)
  const mime = res.headers.get('content-type')?.split(';')[0]?.trim() ?? ''
  const blob = await res.blob()
  if (blob.size === 0) throw new Error('Empty response')
  return { blob, mime }
}
