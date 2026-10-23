import { IDEA_STATUSES, type EpisodeSeries, type IdeaStatus, type SavedIdea } from '../../../shared/youtubeIdeas/types'

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function isIdeaStatus(v: unknown): v is IdeaStatus {
  return isString(v) && (IDEA_STATUSES as readonly string[]).includes(v)
}

export function parseSavedIdea(item: unknown): SavedIdea | null {
  if (!item || typeof item !== 'object') return null
  const o = item as Record<string, unknown>
  if (
    !isString(o.id) ||
    typeof o.partNumber !== 'number' ||
    !isString(o.title) ||
    !o.inspiration ||
    typeof o.inspiration !== 'object' ||
    !isString(o.openingQuestion) ||
    !Array.isArray(o.africanConnection) ||
    !Array.isArray(o.discussionQuestions) ||
    !isString(o.closingQuestion) ||
    !Array.isArray(o.images) ||
    !isString(o.category) ||
    !isIdeaStatus(o.status) ||
    !isString(o.createdAt) ||
    !isString(o.updatedAt)
  ) {
    return null
  }
  const inspiration = o.inspiration as Record<string, unknown>
  if (!isString(inspiration.name) || !isString(inspiration.explanation)) return null
  return item as SavedIdea
}

export function parseEpisodeSeries(item: unknown): EpisodeSeries | null {
  if (!item || typeof item !== 'object') return null
  const o = item as Record<string, unknown>
  if (!isString(o.id) || !isString(o.name) || !Array.isArray(o.ideaIds) || !isString(o.createdAt)) return null
  if (!o.ideaIds.every(isString)) return null
  return item as EpisodeSeries
}
