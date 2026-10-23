import type { GeneratedEpisode } from '../shared/youtubeIdeas/types'
import { createOpenAI } from './openaiJson'

export async function generateAiThumbnail(episode: GeneratedEpisode): Promise<string> {
  const client = createOpenAI()
  const prompt = `Professional YouTube podcast thumbnail, cinematic documentary style, 16:9.
Topic: ${episode.title}. Philosophical inspiration: ${episode.inspiration.name}.
Modern African society, thoughtful mood, gold and charcoal color accents, high contrast, no watermark.
Do not include readable text or logos in the image.`

  const result = await client.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1792x1024',
    quality: 'standard',
    n: 1,
  })

  const url = result.data?.[0]?.url
  if (!url) throw new Error('No thumbnail image returned')

  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to download generated thumbnail')
  const buf = Buffer.from(await res.arrayBuffer())
  return `data:image/png;base64,${buf.toString('base64')}`
}
