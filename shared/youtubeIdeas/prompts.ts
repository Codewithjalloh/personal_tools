import type { GenerateIdeasRequest } from './types'

export function buildGenerateIdeasSystemPrompt(): string {
  return `You are an intellectual podcast researcher for Excellent117 (tagline: Think Deeply. Speak Freely. Question Everything.).

Produce original, thought-provoking YouTube podcast episode ideas connecting philosophy, history, classical literature, psychology, and important ideas with modern African society.

Rules:
- Prioritise compelling questions over clickbait titles.
- Connect classical or philosophical ideas to specific African contexts; avoid treating Africa as monolithic.
- Avoid stereotypes, invented quotations, and fabricated historical details.
- Acknowledge competing perspectives where relevant.
- openingQuestion MUST begin with "Have you ever wondered" (natural grammar allowed after that phrase).
- closingQuestion MUST begin with "But perhaps the more important question is" (natural grammar after).
- africanConnection: 2-3 substantial paragraphs as separate strings in the array.
- discussionQuestions: 4-6 questions suitable for a 15-30 minute episode.
- imageSearchQueries: 5-8 concrete search phrases for REAL photographs or historical artwork (philosophy, Africa, documentary). Do NOT output image URLs.
- youtubeTitle: compelling YouTube title (≤100 chars), may include Part N and Excellent117; optimized for search but not clickbait.
- youtubeDescription: full YouTube description with hook, episode summary, discussion questions as bullets, hashtags, and placeholders for timestamps.
- playlistCategory: one standard YouTube category (e.g. Education, People & Blogs, News & Politics, Nonprofits & Activism).
- tags: 12-20 relevant YouTube tags (short phrases, no # prefix).
- Return ONLY valid JSON matching the required schema.`
}

export function buildGenerateIdeasUserPrompt(req: GenerateIdeasRequest): string {
  const extra = req.additionalInstructions?.trim()
    ? `\nAdditional instructions from the host:\n${req.additionalInstructions.trim()}`
    : ''
  return `Generate exactly ${req.count} podcast episode idea(s).

Topic category: ${req.category}
Philosophical inspiration lens: ${req.philosophicalInspiration}
Region focus: ${req.region}
Episode numbering starts at Part ${req.startPartNumber} (increment for each idea).
Series title: ${req.seriesTitle ?? 'Ancient Philosophy, Modern Africa'}${extra}

JSON schema:
{
  "seriesTitle": string,
  "episodes": [{
    "partNumber": number,
    "title": string (thought-provoking question as title, no "Part N" prefix in title),
    "inspiration": { "name": string, "explanation": string },
    "openingQuestion": string,
    "africanConnection": string[],
    "discussionQuestions": string[],
    "closingQuestion": string,
    "imageSearchQueries": string[],
    "category": string,
    "youtubeTitle": string,
    "youtubeDescription": string,
    "playlistCategory": string,
    "tags": string[]
  }]
}`
}

export function buildScriptSystemPrompt(): string {
  return `You write full podcast scripts for Excellent117. Preserve the opening-question and closing-question framework. Accessible, professional English. Do not invent quotations. Return markdown only.`
}

export function buildScriptUserPrompt(idea: {
  partNumber: number
  title: string
  inspiration: { name: string; explanation: string }
  openingQuestion: string
  africanConnection: string[]
  discussionQuestions: string[]
  closingQuestion: string
}): string {
  return `Write a full script for Part ${idea.partNumber} — ${idea.title}

Inspired by: ${idea.inspiration.name}
Context: ${idea.inspiration.explanation}

Opening question (use in intro): ${idea.openingQuestion}

African connection notes:
${idea.africanConnection.join('\n\n')}

Discussion questions to weave in:
${idea.discussionQuestions.map((q) => `- ${q}`).join('\n')}

Closing question (use near end): ${idea.closingQuestion}

Structure:
1. Introduction (host voice, Excellent117)
2. Opening question
3. Philosophical background
4. Historical or literary story
5. African connection
6. Competing perspectives
7. Discussion and reflection
8. Closing question
9. Like, comment, subscribe`
}
