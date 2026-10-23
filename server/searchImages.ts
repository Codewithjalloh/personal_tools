import { EPISODE_IMAGE_COUNT } from '../shared/youtubeIdeas/constants'
import type { ImageAsset } from '../shared/youtubeIdeas/types'
import { resolvePexelsKey } from './requestSecrets'

type PexelsPhoto = {
  url: string
  photographer: string
  alt: string
  src: { large: string; medium: string; original: string }
}

export async function searchImagesForQuery(query: string, perPage = 15): Promise<ImageAsset[]> {
  const key = resolvePexelsKey()
  if (!key) return []

  const url = new URL('https://api.pexels.com/v1/search')
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', String(Math.min(Math.max(perPage, 1), 40)))

  const res = await fetch(url.toString(), {
    headers: { Authorization: key },
  })
  if (!res.ok) {
    throw new Error(`Pexels search failed (${res.status})`)
  }

  const data = (await res.json()) as { photos?: PexelsPhoto[] }
  return (data.photos ?? []).map((p) => ({
    url: p.src.large || p.src.medium,
    sourceWebsite: 'https://www.pexels.com',
    photographer: p.photographer,
    attribution: `Photo by ${p.photographer} on Pexels`,
    license: 'Pexels License',
    searchQuery: query,
    alt: p.alt || query,
  }))
}

export async function searchImagesForQueries(
  queries: string[],
  totalWanted = EPISODE_IMAGE_COUNT,
): Promise<ImageAsset[]> {
  const out: ImageAsset[] = []
  const seen = new Set<string>()
  if (queries.length === 0) return out

  let qIndex = 0
  let attempts = 0
  const maxAttempts = queries.length * 4

  while (out.length < totalWanted && attempts < maxAttempts) {
    const q = queries[qIndex % queries.length]
    qIndex++
    attempts++
    try {
      const need = totalWanted - out.length
      const found = await searchImagesForQuery(q, need + 3)
      for (const img of found) {
        if (seen.has(img.url)) continue
        seen.add(img.url)
        out.push(img)
        if (out.length >= totalWanted) break
      }
    } catch {
      // try next query
    }
  }

  return out
}
