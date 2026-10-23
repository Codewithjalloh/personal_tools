import type { EpisodeSeries, IdeaStatus, SavedIdea } from '../../../shared/youtubeIdeas/types'
import { IDEAS_KEY, SERIES_KEY, type ResearchStudioBackup } from './backup'
import { parseEpisodeSeries, parseSavedIdea } from './parseStorage'
import { computeDashboardStats } from './statsLogic'

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

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase()
}

export function findIdeaByPartAndTitle(partNumber: number, title: string): SavedIdea | undefined {
  const t = normalizeTitle(title)
  return loadIdeas().find((i) => i.partNumber === partNumber && normalizeTitle(i.title) === t)
}

export function listSavedIdeas(): SavedIdea[] {
  return loadIdeas().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function listSavedIdeasByPart(): SavedIdea[] {
  return loadIdeas().sort((a, b) => a.partNumber - b.partNumber || b.updatedAt.localeCompare(a.updatedAt))
}

export function getSavedIdeaById(id: string): SavedIdea | undefined {
  return loadIdeas().find((i) => i.id === id)
}

export function getSeriesById(id: string): EpisodeSeries | undefined {
  return loadSeries().find((s) => s.id === id)
}

export function suggestNextPartNumber(seriesId?: string): number {
  const ideas = loadIdeas()
  if (seriesId) {
    const series = getSeriesById(seriesId)
    if (series?.nextPartNumber && series.nextPartNumber > 0) return series.nextPartNumber
    const inSeries = ideas.filter((i) => i.seriesId === seriesId)
    if (inSeries.length > 0) {
      return Math.max(...inSeries.map((i) => i.partNumber)) + 1
    }
  }
  if (ideas.length === 0) return 1
  return Math.max(...ideas.map((i) => i.partNumber)) + 1
}

export function priorTitlesForSeries(seriesId: string): string[] {
  const series = getSeriesById(seriesId)
  if (!series) return []
  const ideas = loadIdeas()
  return series.ideaIds
    .map((id) => ideas.find((i) => i.id === id))
    .filter((i): i is SavedIdea => !!i)
    .sort((a, b) => a.partNumber - b.partNumber)
    .map((i) => `Part ${i.partNumber}: ${i.title}`)
}

export function saveIdea(input: Omit<SavedIdea, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): SavedIdea {
  const now = new Date().toISOString()
  const existingById = input.id ? loadIdeas().find((i) => i.id === input.id) : undefined
  const duplicate =
    !input.id && !existingById
      ? findIdeaByPartAndTitle(input.partNumber, input.title)
      : undefined
  const base = existingById ?? duplicate

  const idea: SavedIdea = {
    ...input,
    id: base?.id ?? input.id ?? crypto.randomUUID(),
    textHighlightIds: input.textHighlightIds ?? base?.textHighlightIds,
    publishedYoutubeUrl: input.publishedYoutubeUrl ?? base?.publishedYoutubeUrl,
    publishedAt: input.publishedAt ?? base?.publishedAt,
    createdAt: base?.createdAt ?? now,
    updatedAt: now,
  }
  const ideas = loadIdeas().filter((i) => i.id !== idea.id)
  ideas.push(idea)
  saveIdeas(ideas)

  if (idea.seriesId) {
    linkIdeaToSeries(idea.seriesId, idea.id)
  }
  return idea
}

export function updateIdeaHighlights(id: string, textHighlightIds: string[]): void {
  const ideas = loadIdeas()
  const idx = ideas.findIndex((i) => i.id === id)
  if (idx === -1) return
  ideas[idx] = { ...ideas[idx], textHighlightIds, updatedAt: new Date().toISOString() }
  saveIdeas(ideas)
}

export function updateIdeaPublished(
  id: string,
  patch: { publishedYoutubeUrl?: string; publishedAt?: string; status?: IdeaStatus },
): void {
  const ideas = loadIdeas()
  const idx = ideas.findIndex((i) => i.id === id)
  if (idx === -1) return
  ideas[idx] = {
    ...ideas[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  saveIdeas(ideas)
}

export function deleteIdea(id: string): void {
  const ideas = loadIdeas().filter((i) => i.id !== id)
  saveIdeas(ideas)
  const allSeries = loadSeries()
  let changed = false
  for (const s of allSeries) {
    if (s.ideaIds.includes(id)) {
      s.ideaIds = s.ideaIds.filter((x) => x !== id)
      changed = true
    }
  }
  if (changed) saveSeriesList(allSeries)
}

export function updateIdeaStatus(id: string, status: IdeaStatus): void {
  const ideas = loadIdeas()
  const idx = ideas.findIndex((i) => i.id === id)
  if (idx === -1) return
  const now = new Date().toISOString()
  const patch: Partial<SavedIdea> = { status, updatedAt: now }
  if (status === 'Published' && !ideas[idx].publishedAt) {
    patch.publishedAt = now.slice(0, 10)
  }
  ideas[idx] = { ...ideas[idx], ...patch }
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
  const ideas = loadIdeas()
  let changed = false
  for (const idea of ideas) {
    if (idea.seriesId === id) {
      idea.seriesId = undefined
      changed = true
    }
  }
  if (changed) saveIdeas(ideas)
}

export function linkIdeaToSeries(seriesId: string, ideaId: string): void {
  const allSeries = loadSeries()
  const series = allSeries.find((s) => s.id === seriesId)
  if (!series) return

  for (const s of allSeries) {
    if (s.id !== seriesId && s.ideaIds.includes(ideaId)) {
      s.ideaIds = s.ideaIds.filter((x) => x !== ideaId)
    }
  }

  if (!series.ideaIds.includes(ideaId)) {
    series.ideaIds.push(ideaId)
  }

  const ideas = loadIdeas()
  const linked = ideas.filter((i) => series.ideaIds.includes(i.id))
  const maxPart = linked.length > 0 ? Math.max(...linked.map((i) => i.partNumber)) : 0
  series.nextPartNumber = maxPart + 1

  for (const idea of ideas) {
    if (idea.id === ideaId) {
      idea.seriesId = seriesId
    }
  }

  saveIdeas(ideas)
  saveSeriesList(allSeries)
}

export function unlinkIdeaFromSeries(ideaId: string): void {
  const ideas = loadIdeas()
  const idea = ideas.find((i) => i.id === ideaId)
  if (!idea?.seriesId) return
  const seriesId = idea.seriesId
  idea.seriesId = undefined
  saveIdeas(ideas)

  const allSeries = loadSeries()
  const series = allSeries.find((s) => s.id === seriesId)
  if (!series) return
  series.ideaIds = series.ideaIds.filter((x) => x !== ideaId)
  const linked = ideas.filter((i) => series.ideaIds.includes(i.id))
  series.nextPartNumber =
    linked.length > 0 ? Math.max(...linked.map((i) => i.partNumber)) + 1 : 1
  saveSeriesList(allSeries)
}

export function importResearchStudioBackup(backup: ResearchStudioBackup, mode: 'merge' | 'replace'): void {
  if (mode === 'replace') {
    saveIdeas(backup.ideas)
    saveSeriesList(backup.series)
    return
  }

  const existingIdeas = loadIdeas()
  const byId = new Map(existingIdeas.map((i) => [i.id, i]))
  for (const idea of backup.ideas) {
    byId.set(idea.id, idea)
  }
  saveIdeas([...byId.values()])

  const existingSeries = loadSeries()
  const seriesById = new Map(existingSeries.map((s) => [s.id, s]))
  for (const s of backup.series) {
    seriesById.set(s.id, s)
  }
  saveSeriesList([...seriesById.values()])
}

export function dashboardStats() {
  return computeDashboardStats(loadIdeas())
}
