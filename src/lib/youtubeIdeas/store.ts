import type { EpisodeSeries, IdeaStatus, SavedIdea } from '../../../shared/youtubeIdeas/types'
import { parseEpisodeSeries, parseSavedIdea } from './parseStorage'

const IDEAS_KEY = 'excellent117.savedIdeas.v1'
const SERIES_KEY = 'excellent117.series.v1'

function loadIdeas(): SavedIdea[] {
  try {
    const raw = localStorage.getItem(IDEAS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown[]
    return parsed.map(parseSavedIdea).filter((item): item is SavedIdea => item !== null)
  } catch {
    return []
  }
}

function saveIdeas(ideas: SavedIdea[]): void {
  localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas))
}

function loadSeries(): EpisodeSeries[] {
  try {
    const raw = localStorage.getItem(SERIES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown[]
    return parsed.map(parseEpisodeSeries).filter((item): item is EpisodeSeries => item !== null)
  } catch {
    return []
  }
}

function saveSeriesList(series: EpisodeSeries[]): void {
  localStorage.setItem(SERIES_KEY, JSON.stringify(series))
}

export function listSavedIdeas(): SavedIdea[] {
  return loadIdeas().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getSavedIdeaById(id: string): SavedIdea | undefined {
  return loadIdeas().find((i) => i.id === id)
}

export function saveIdea(input: Omit<SavedIdea, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): SavedIdea {
  const now = new Date().toISOString()
  const idea: SavedIdea = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: input.id ? loadIdeas().find((i) => i.id === input.id)?.createdAt ?? now : now,
    updatedAt: now,
  }
  const ideas = loadIdeas().filter((i) => i.id !== idea.id)
  ideas.push(idea)
  saveIdeas(ideas)
  return idea
}

export function deleteIdea(id: string): void {
  saveIdeas(loadIdeas().filter((i) => i.id !== id))
}

export function updateIdeaStatus(id: string, status: IdeaStatus): void {
  const ideas = loadIdeas()
  const idx = ideas.findIndex((i) => i.id === id)
  if (idx === -1) return
  ideas[idx] = { ...ideas[idx], status, updatedAt: new Date().toISOString() }
  saveIdeas(ideas)
}

export function listSeries(): EpisodeSeries[] {
  return loadSeries().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function upsertSeries(series: Omit<EpisodeSeries, 'createdAt'> & { createdAt?: string }): EpisodeSeries {
  const now = new Date().toISOString()
  const item: EpisodeSeries = {
    ...series,
    createdAt: series.createdAt ?? now,
  }
  const all = loadSeries().filter((s) => s.id !== item.id)
  all.push(item)
  saveSeriesList(all)
  return item
}

export function deleteSeries(id: string): void {
  saveSeriesList(loadSeries().filter((s) => s.id !== id))
}

export function dashboardStats() {
  const ideas = loadIdeas()
  const byStatus = ideas.reduce(
    (acc, i) => {
      acc[i.status] = (acc[i.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
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
  return {
    totalGenerated: ideas.length,
    saved: ideas.length,
    upcoming: ideas.filter((i) => i.status === 'Idea' || i.status === 'Researching').length,
    recent: ideas.slice(0, 5),
    topThemes,
    byStatus,
  }
}
