import type { VercelRequest, VercelResponse } from '@vercel/node'
import { generateAiThumbnail } from '../server/generateThumbnail'
import { generatedEpisodeSchema } from '../server/youtubeIdeasSchemas'
import { runWithRequestSecretsAsync, secretsFromHeaders, resolveOpenAiKey } from '../server/requestSecrets'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const secrets = secretsFromHeaders(req.headers)
  try {
    await runWithRequestSecretsAsync(secrets, async () => {
      try {
        resolveOpenAiKey()
      } catch (e) {
        res.status(503).json({ error: e instanceof Error ? e.message : 'OPENAI_API_KEY is not configured.' })
        return
      }
      const episode = generatedEpisodeSchema.parse(req.body?.episode ?? req.body)
      const dataUrl = await generateAiThumbnail(episode)
      res.status(200).json({ thumbnailDataUrl: dataUrl })
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Thumbnail generation failed'
    res.status(400).json({ error: message })
  }
}
