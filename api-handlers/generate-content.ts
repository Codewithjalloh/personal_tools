import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { generateEpisodeContent, type ContentKind } from '../server/generateContent'
import { generatedEpisodeSchema } from '../server/youtubeIdeasSchemas'
import { runWithRequestSecretsAsync, secretsFromHeaders, resolveOpenAiKey } from '../server/requestSecrets'

export { config } from './vercelConfig'

const bodySchema = z.object({
  kind: z.enum(['script', 'youtube-description', 'youtube-tags', 'facebook-post', 'expand-topic']),
  episode: generatedEpisodeSchema,
})

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
      const { kind, episode } = bodySchema.parse(req.body)
      const content = await generateEpisodeContent(kind as ContentKind, episode)
      res.status(200).json({ content })
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Content generation failed'
    res.status(400).json({ error: message })
  }
}
