import { EPISODE_IMAGE_COUNT } from '../shared/youtubeIdeas/constants'
import type { ImageAsset } from '../shared/youtubeIdeas/types'
import { resolvePexelsKey } from './requestSecrets'

type PexelsPhoto = {
  url: string
  photographer: string
  alt: string
  src: { large: string; medium: string; original: string }
}

const FALLBACK_QUERIES = [
  'African city street life',
  'African university students campus',
  'West African market traders',
  'African family community gathering',
  'African young professionals office',
  'Nigerian Lagos skyline dusk',
  'African wedding celebration',
]

export type ImageSearchResult = {
  images: ImageAsset[]
  pexelsConfigured: boolean
  warning?: string
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
    const body = await res.text().catch(() => '')
    throw new Error(`Pexels search failed (${res.status})${body ? `: ${body.slice(0, 120)}` : ''}`)
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

async function collectImages(queries: string[], totalWanted: number): Promise<ImageAsset[]> {
  const out: ImageAsset[] = []
  const seen = new Set<string>()
  const uniqueQueries = [...new Set(queries.map((q) => q.trim()).filter(Boolean))]
  if (uniqueQueries.length === 0) return out

  let lastError: string | undefined

  const tryAddFromQuery = async (q: string, maxFromQuery: number) => {
    try {
      const found = await searchImagesForQuery(q, maxFromQuery + 4)
      let added = 0
      for (const img of found) {
        if (seen.has(img.url)) continue
        seen.add(img.url)
        out.push(img)
        added++
        if (added >= maxFromQuery || out.length >= totalWanted) break
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Pexels request failed'
    }
  }

  // One photo per query first so early queries do not fill the whole set with Plato busts.
  for (const q of uniqueQueries) {
    if (out.length >= totalWanted) break
    await tryAddFromQuery(q, 1)
  }

  let qIndex = 0
  let attempts = 0
  const maxAttempts = Math.max(uniqueQueries.length * 3, 10)
  while (out.length < totalWanted && attempts < maxAttempts) {
    const q = uniqueQueries[qIndex % uniqueQueries.length]
    qIndex++
    attempts++
    await tryAddFromQuery(q, 2)
  }

  if (out.length === 0 && lastError) {
    throw new Error(lastError)
  }

  return out
}

export async function searchImagesForQueries(
  queries: string[],
  totalWanted = EPISODE_IMAGE_COUNT,
): Promise<ImageSearchResult> {
  const key = resolvePexelsKey()
  if (!key) {
    return {
      images: [],
      pexelsConfigured: false,
      warning:
        'Pexels API key missing. Add PEXELS_API_KEY in .env.local (restart npm run dev) or save it in Settings → Pexels API key. On Vercel, set PEXELS_API_KEY in project environment variables.',
    }
  }

  const uniqueQueries = [...new Set(queries.map((q) => q.trim()).filter(Boolean))]
  let images = await collectImages(uniqueQueries, totalWanted)

  if (images.length < totalWanted) {
    const merged = [...uniqueQueries, ...FALLBACK_QUERIES]
    images = await collectImages(merged, totalWanted)
  }

  if (images.length === 0) {
    return {
      images: [],
      pexelsConfigured: true,
      warning: 'Pexels returned no photos for these search terms. Try Refresh images or broaden your topic.',
    }
  }

  return {
    images,
    pexelsConfigured: true,
    warning: images.length < totalWanted ? `Found ${images.length} of ${totalWanted} images.` : undefined,
  }
}
