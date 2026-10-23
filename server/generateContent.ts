import {
  buildScriptSystemPrompt,
  buildScriptUserPrompt,
} from '../shared/youtubeIdeas/prompts'
import type { GeneratedEpisode } from '../shared/youtubeIdeas/types'
import { chatMarkdown } from './openaiJson'

export type ContentKind =
  | 'script'
  | 'youtube-description'
  | 'youtube-tags'
  | 'facebook-post'
  | 'expand-topic'

function episodeBlock(ep: GeneratedEpisode): string {
  return `Part ${ep.partNumber} — ${ep.title}
YouTube title: ${ep.youtubeTitle}
Playlist: ${ep.playlistCategory}
Tags: ${ep.tags.join(', ')}
Inspired by ${ep.inspiration.name}
Opening: ${ep.openingQuestion}
African connection:
${ep.africanConnection.join('\n\n')}
Questions: ${ep.discussionQuestions.join(' | ')}
Closing: ${ep.closingQuestion}`
}

export async function generateEpisodeContent(
  kind: ContentKind,
  episode: GeneratedEpisode,
): Promise<string> {
  if (kind === 'script') {
    return chatMarkdown(buildScriptSystemPrompt(), buildScriptUserPrompt(episode))
  }

  const system = `You are a YouTube content strategist for Excellent117 podcast. Return only the requested output, no preamble.`
  const userMap: Record<Exclude<ContentKind, 'script'>, string> = {
    'youtube-description': `Write a YouTube description (with timestamps placeholder lines) for:\n${episodeBlock(episode)}`,
    'youtube-tags': `Return 15-25 comma-separated YouTube tags for:\n${episodeBlock(episode)}`,
    'facebook-post': `Write an engaging Facebook post with 2-3 paragraphs and 3-5 hashtags for:\n${episodeBlock(episode)}`,
    'expand-topic': `Expand this episode idea with deeper research angles, suggested readings, and 3 follow-up episode ideas:\n${episodeBlock(episode)}`,
  }

  return chatMarkdown(system, userMap[kind])
}
