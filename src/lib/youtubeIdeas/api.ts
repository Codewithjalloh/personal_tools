import type { GeneratedEpisode, GenerateIdeasRequest, GenerateIdeasResponse, ImageAsset } from '../../../shared/youtubeIdeas/types'
import { apiKeyHeaders } from './secretsStorage'

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...apiKeyHeaders() },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as T & { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`)
  }
  return data
}

export async function apiGenerateIdeas(req: GenerateIdeasRequest): Promise<GenerateIdeasResponse> {
  return postJson('/api/generate-ideas', req)
}

export async function apiSearchImages(
  queries: string[],
  limit = 7,
): Promise<{ images: ImageAsset[]; warning?: string }> {
  return postJson('/api/search-images', { queries, limit })
}

export async function apiGenerateAiThumbnail(episode: GeneratedEpisode): Promise<string> {
  const { thumbnailDataUrl } = await postJson<{ thumbnailDataUrl: string }>('/api/generate-thumbnail', {
    episode,
  })
  return thumbnailDataUrl
}

export type ContentKind = 'script' | 'youtube-description' | 'youtube-tags' | 'facebook-post' | 'expand-topic'

export async function apiGenerateContent(
  kind: ContentKind,
  episode: GeneratedEpisode,
): Promise<string> {
  const { content } = await postJson<{ content: string }>('/api/generate-content', { kind, episode })
  return content
}

export type EpisodeWithImages = GeneratedEpisode & {
  images: ImageAsset[]
  thumbnailDataUrl?: string
}
