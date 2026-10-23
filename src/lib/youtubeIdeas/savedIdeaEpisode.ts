import type { GeneratedEpisode, SavedIdea } from '../../../shared/youtubeIdeas/types'

/** Map a saved idea to the shape expected by content-generation APIs. */
export function savedIdeaToGeneratedEpisode(idea: SavedIdea): GeneratedEpisode {
  return {
    partNumber: idea.partNumber,
    title: idea.title,
    inspiration: idea.inspiration,
    openingQuestion: idea.openingQuestion,
    africanConnection: idea.africanConnection,
    discussionQuestions: idea.discussionQuestions,
    closingQuestion: idea.closingQuestion,
    imageSearchQueries: ['Africa documentary', 'philosophy portrait', idea.inspiration.name],
    category: idea.category,
    youtubeTitle: idea.youtubeTitle?.trim() || idea.title,
    youtubeDescription:
      idea.youtubeDescription?.trim() ||
      `Part ${idea.partNumber} — ${idea.title}\n\n${idea.openingQuestion}`,
    playlistCategory: idea.playlistCategory?.trim() || 'Education',
    tags: idea.tags?.length ? idea.tags : [idea.category, 'Excellent117', 'podcast'],
  }
}
