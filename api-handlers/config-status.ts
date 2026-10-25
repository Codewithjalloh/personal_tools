import type { VercelRequest, VercelResponse } from '@vercel/node'
import { runWithRequestSecretsAsync, secretsFromHeaders, resolveOpenAiKey, resolvePexelsKey } from '../server/requestSecrets'

export { config } from './vercelConfig'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const secrets = secretsFromHeaders(req.headers)
    await runWithRequestSecretsAsync(secrets, async () => {
      let openai = false
      try {
        resolveOpenAiKey()
        openai = true
      } catch {
        openai = false
      }
      res.status(200).json({ openai, pexels: !!resolvePexelsKey() })
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Config check failed'
    res.status(500).json({ error: message })
  }
}
