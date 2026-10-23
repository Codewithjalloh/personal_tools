import type { ImageAsset } from './types'

/** Stock-photo clichés that rarely match the episode topic. */
const GENERIC_PHILOSOPHY_RE =
  /\b(plato|socrates|aristotle|seneca|marcus aurelius|greek statue|roman statue|marble bust|philosopher bust|ancient sculpture|acropolis|parthenon|thinker statue|rodin)\b/i

const STOP_WORDS = new Set([
  'have',
  'ever',
  'wondered',
  'the',
  'and',
  'for',
  'with',
  'from',
  'that',
  'this',
  'what',
  'when',
  'where',
  'how',
  'can',
  'does',
  'are',
  'was',
  'were',
  'your',
  'our',
  'their',
  'about',
  'into',
  'truly',
  'more',
  'important',
  'question',
  'is',
  'in',
  'on',
  'all',
  'part',
  'excellent117',
  'ancient',
  'philosophy',
  'modern',
  'africa',
  'podcast',
])

function topicTokens(headline: string): string[] {
  return headline
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 3 && !STOP_WORDS.has(t))
}

export function scoreImageForEpisode(img: ImageAsset, headline: string): number {
  const hay = `${img.searchQuery} ${img.alt}`.toLowerCase()
  let score = 0

  if (GENERIC_PHILOSOPHY_RE.test(hay)) score -= 40

  const tokens = topicTokens(headline)
  for (const token of tokens) {
    if (hay.includes(token)) score += 12
  }

  // Prefer queries that look topic-specific (longer phrases), not single-word "philosophy"
  const q = img.searchQuery.trim()
  if (q.length > 24) score += 4
  if (/^(philosophy|greek|plato|thinker|statue)\b/i.test(q)) score -= 15

  return score
}

/** Best-first order for gallery + default thumbnail background. */
export function rankEpisodeImages(images: ImageAsset[], headline: string): ImageAsset[] {
  return [...images].sort(
    (a, b) => scoreImageForEpisode(b, headline) - scoreImageForEpisode(a, headline),
  )
}

export function pickThumbnailBackground(headline: string, images: ImageAsset[]): string | undefined {
  if (images.length === 0) return undefined
  return rankEpisodeImages(images, headline)[0]?.url
}
