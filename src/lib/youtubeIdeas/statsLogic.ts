import type { IdeaStatus, SavedIdea } from '../../../shared/youtubeIdeas/types'
import { IDEA_STATUSES } from '../../../shared/youtubeIdeas/types'

export type DashboardStats = {
  totalIdeas: number
  upcoming: number
  published: number
  recent: SavedIdea[]
  topThemes: { name: string; count: number }[]
  byStatus: Record<IdeaStatus, number>
}

export function computeDashboardStats(ideas: SavedIdea[]): DashboardStats {
  const byStatus = IDEA_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0
      return acc
    },
    {} as Record<IdeaStatus, number>,
  )
  for (const idea of ideas) {
    byStatus[idea.status] = (byStatus[idea.status] ?? 0) + 1
  }

  const categories = ideas.reduce(
    (acc, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
  const topThemes = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  const recent = [...ideas].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)

  return {
    totalIdeas: ideas.length,
    upcoming: ideas.filter((i) => i.status === 'Idea' || i.status === 'Researching').length,
    published: byStatus.Published ?? 0,
    recent,
    topThemes,
    byStatus,
  }
}
