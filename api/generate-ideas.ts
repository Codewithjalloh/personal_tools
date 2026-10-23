import type { VercelRequest, VercelResponse } from '@vercel/node'
import { generateIdeas } from '../server/generateIdeas'
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
        res.status(503).json({
          error:
            e instanceof Error
              ? e.message
              : 'OPENAI_API_KEY is not configured. Add it in Vercel project settings or YouTube Ideas → Settings.',
        })
        return
      }
      const data = await generateIdeas(req.body)
      res.status(200).json(data)
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Generation failed'
    res.status(400).json({ error: message })
  }
}
