import type {
  GeneratedEpisode,
  GenerateIdeasRequest,
  GenerateIdeasResponse,
  ImageAsset,
  ThumbnailPrefs,
} from '../../../shared/youtubeIdeas/types'
import { apiKeyHeaders } from './secretsStorage'

async function parseResponseBody(res: Response): Promise<{ data: unknown; text: string }> {
  const text = await res.text()
  if (!text.trim()) return { data: {}, text }
  try {
    return { data: JSON.parse(text) as unknown, text }
  } catch {
    return { data: null, text }
  }
}

function errorFromNonJson(res: Response, text: string): string {
  const snippet = text.trim().replace(/\s+/g, ' ').slice(0, 280)
  if (snippet.includes('FUNCTION_INVOCATION_FAILED') || snippet.includes('A server error has occurred')) {
    return 'Research Studio API failed on the server (deployment error). Redeploy from the latest code, or check Vercel → Project → Functions logs. You can still use your OpenAI key in Settings — it is sent with each request.'
  }
  if (res.status === 503) {
    return 'OpenAI is not configured on the server. Add OPENAI_API_KEY in Vercel → Settings → Environment Variables, or add your key in Research Studio → Settings.'
  }
  return snippet || `Request failed (${res.status})`
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...apiKeyHeaders() },
    body: JSON.stringify(body),
  })
  const { data, text } = await parseResponseBody(res)
  if (data === null) {
    throw new Error(errorFromNonJson(res, text))
  }
  const payload = data as T & { error?: string }
  if (!res.ok) {
    throw new Error(payload.error ?? errorFromNonJson(res, text))
  }
  return payload
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: apiKeyHeaders() })
  const { data, text } = await parseResponseBody(res)
  if (data === null) {
    throw new Error(errorFromNonJson(res, text))
  }
  const payload = data as T & { error?: string }
  if (!res.ok) {
    throw new Error(payload.error ?? errorFromNonJson(res, text))
  }
  return payload
}

export async function apiGenerateIdeas(req: GenerateIdeasRequest): Promise<GenerateIdeasResponse> {
  return postJson('/api/generate-ideas', req)
}

export async function apiSearchImages(
  queries: string[],
  limit = 7,
): Promise<{ images: ImageAsset[]; pexelsConfigured: boolean; warning?: string }> {
  return postJson('/api/search-images', { queries, limit })
}

export async function apiConfigStatus(): Promise<{ openai: boolean; pexels: boolean }> {
  return getJson('/api/config-status')
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
  thumbnailPrefs?: ThumbnailPrefs
  imageWarning?: string
}
