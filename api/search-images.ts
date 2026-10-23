import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { searchImagesForQueries } from '../server/searchImages'
import { runWithRequestSecretsAsync, secretsFromHeaders } from '../server/requestSecrets'

const bodySchema = z.object({
  queries: z.array(z.string().min(1)).min(1).max(10),
  limit: z.number().int().min(1).max(15).optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const secrets = secretsFromHeaders(req.headers)
  try {
    await runWithRequestSecretsAsync(secrets, async () => {
      const { queries, limit } = bodySchema.parse(req.body)
      const images = await searchImagesForQueries(queries, limit ?? 7)
      return res.status(200).json({
        images,
        warning: images.length === 0 ? 'Add Pexels key in Settings or PEXELS_API_KEY in .env.local.' : undefined,
      })
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Image search failed'
    return res.status(400).json({ error: message })
  }
}
