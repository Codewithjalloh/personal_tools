import {
  buildGenerateIdeasSystemPrompt,
  buildGenerateIdeasUserPrompt,
} from '../shared/youtubeIdeas/prompts'
import type { GenerateIdeasResponse } from '../shared/youtubeIdeas/types'
import {
  generateIdeasRequestSchema,
  generateIdeasResponseSchema,
} from './youtubeIdeasSchemas'
import { chatJson } from './openaiJson'

export async function generateIdeas(body: unknown): Promise<GenerateIdeasResponse> {
  const req = generateIdeasRequestSchema.parse(body)
  return chatJson(
    buildGenerateIdeasSystemPrompt(),
    buildGenerateIdeasUserPrompt(req),
    generateIdeasResponseSchema,
  )
}

export type { GenerateIdeasRequest } from '../shared/youtubeIdeas/types'
