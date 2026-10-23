import OpenAI from 'openai'
import type { z } from 'zod'
import { openAiModel } from './env'
import { resolveOpenAiKey } from './requestSecrets'

export function createOpenAI(): OpenAI {
  return new OpenAI({ apiKey: resolveOpenAiKey() })
}

export async function chatJson<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const client = createOpenAI()
  const model = openAiModel()

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.85,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error('Empty response from OpenAI')

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('OpenAI returned invalid JSON')
  }

  const result = schema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`Response validation failed: ${result.error.message}`)
  }
  return result.data
}

export async function chatMarkdown(system: string, user: string): Promise<string> {
  const client = createOpenAI()
  const model = openAiModel()
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.7,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })
  const text = completion.choices[0]?.message?.content?.trim()
  if (!text) throw new Error('Empty response from OpenAI')
  return text
}
