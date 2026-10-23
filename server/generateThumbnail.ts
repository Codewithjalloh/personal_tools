import type { GeneratedEpisode } from '../shared/youtubeIdeas/types'
import { createOpenAI } from './openaiJson'

export async function generateAiThumbnail(episode: GeneratedEpisode): Promise<string> {
  const client = createOpenAI()
  const prompt = `Professional YouTube podcast thumbnail, cinematic documentary photography, 16:9.
Main visual theme must reflect this episode title: "${episode.title}" (category: ${episode.category}).
Setting: contemporary African life or society matching that theme—not a generic marble Greek philosopher statue unless the title is explicitly about ancient Greece.
Mood: thoughtful, editorial. Color accents: gold and charcoal. High contrast. No readable text, no logos, no watermarks.`

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
