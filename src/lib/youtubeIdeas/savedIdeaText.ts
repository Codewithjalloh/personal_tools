import type { SavedIdea } from '../../../shared/youtubeIdeas/types'

/** Podcast script body only — opening, African connection, explore, closing. */
export function formatSavedIdeaAsText(idea: SavedIdea): string {
  const connection = idea.africanConnection.join('\n\n')
  const questions = idea.discussionQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')

  return [
    'Inspired by',
    idea.inspiration.name,
    '',
    idea.inspiration.explanation,
    '',
    'Opening question',
    idea.openingQuestion,
    '',
    'The African connection',
    connection,
    '',
    'Questions to explore',
    questions,
    '',
    'Closing question',
    idea.closingQuestion,
  ].join('\n')
}
