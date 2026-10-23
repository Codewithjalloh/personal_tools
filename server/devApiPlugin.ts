import type { Plugin } from 'vite'
import { z } from 'zod'
import { loadLocalEnv } from './loadLocalEnv'
import { generateIdeas } from './generateIdeas'
import { searchImagesForQueries } from './searchImages'
import { generateEpisodeContent, type ContentKind } from './generateContent'
import { generatedEpisodeSchema } from './youtubeIdeasSchemas'
import { rateLimit, readJsonBody, sendError, sendJson } from './http'
import { generateAiThumbnail } from './generateThumbnail'
import {
  runWithRequestSecretsAsync,
  secretsFromHeaders,
  resolveOpenAiKey,
  resolvePexelsKey,
} from './requestSecrets'

export function devApiPlugin(): Plugin {
  return {
    name: 'excellent117-dev-api',
    configureServer(server) {
      loadLocalEnv()
      server.middlewares.use(async (req, res, next) => {
        loadLocalEnv()
        const url = req.url?.split('?')[0]
        if (!url?.startsWith('/api/')) return next()

        if (url === '/api/config-status' && req.method === 'GET') {
          loadLocalEnv()
          await runWithRequestSecretsAsync(secretsFromHeaders(req.headers as Record<string, string | string[] | undefined>), async () => {
            let openai = false
            try {
              resolveOpenAiKey()
              openai = true
            } catch {
              openai = false
            }
            sendJson(res, 200, { openai, pexels: !!resolvePexelsKey() })
          })
          return
        }

        if (req.method !== 'POST') {
          sendError(res, 405, 'Method not allowed')
          return
        }
        const ip = req.socket.remoteAddress ?? 'local'
        if (!rateLimit(ip)) {
          sendError(res, 429, 'Please wait a few seconds before trying again.')
          return
        }

        const secrets = secretsFromHeaders(req.headers as Record<string, string | string[] | undefined>)

        try {
          await runWithRequestSecretsAsync(secrets, async () => {
            const body = await readJsonBody(req)

            if (url === '/api/generate-ideas') {
              try {
                resolveOpenAiKey()
              } catch (e) {
                sendError(res, 503, e instanceof Error ? e.message : 'OPENAI_API_KEY is not configured.')
                return
              }
              const data = await generateIdeas(body)
              sendJson(res, 200, data)
              return
            }

            if (url === '/api/search-images') {
              const parsed = z
                .object({
                  queries: z.array(z.string()).min(1),
                  limit: z.number().int().min(1).max(15).optional(),
                })
                .parse(body)
              const result = await searchImagesForQueries(parsed.queries, parsed.limit ?? 7)
              sendJson(res, 200, result)
              return
            }

            if (url === '/api/generate-thumbnail') {
              try {
                resolveOpenAiKey()
              } catch (e) {
                sendError(res, 503, e instanceof Error ? e.message : 'OPENAI_API_KEY is not configured.')
                return
              }
              const episode = generatedEpisodeSchema.parse(
                (body as { episode?: unknown }).episode ?? body,
              )
              const thumbnailDataUrl = await generateAiThumbnail(episode)
              sendJson(res, 200, { thumbnailDataUrl })
              return
            }

            if (url === '/api/generate-content') {
              try {
                resolveOpenAiKey()
              } catch (e) {
                sendError(res, 503, e instanceof Error ? e.message : 'OPENAI_API_KEY is not configured.')
                return
              }
              const parsed = z
                .object({
                  kind: z.enum([
                    'script',
                    'youtube-description',
                    'youtube-tags',
                    'facebook-post',
                    'expand-topic',
                  ]),
                  episode: generatedEpisodeSchema,
                })
                .parse(body)
              const content = await generateEpisodeContent(parsed.kind as ContentKind, parsed.episode)
              sendJson(res, 200, { content })
              return
            }

            sendError(res, 404, 'Not found')
          })
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Request failed'
          sendJson(res, 400, { error: message })
        }
      })
    },
  }
}
