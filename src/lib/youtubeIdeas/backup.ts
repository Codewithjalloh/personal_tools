import type { EpisodeSeries, SavedIdea } from '../../../shared/youtubeIdeas/types'

export const IDEAS_KEY = 'excellent117.savedIdeas.v1'
export const SERIES_KEY = 'excellent117.series.v1'

export type ResearchStudioBackup = {
  version: 1
  exportedAt: string
  ideas: SavedIdea[]
  series: EpisodeSeries[]
}

export function buildBackup(ideas: SavedIdea[], series: EpisodeSeries[]): ResearchStudioBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    ideas,
    series,
  }
}

export function downloadBackupJson(backup: ResearchStudioBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `excellent117-research-studio-${backup.exportedAt.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function parseBackupJson(raw: string): ResearchStudioBackup {
  const data = JSON.parse(raw) as ResearchStudioBackup
  if (data.version !== 1 || !Array.isArray(data.ideas) || !Array.isArray(data.series)) {
    throw new Error('Invalid backup file format')
  }
  return data
}

/** Rough UTF-16 size of Research Studio keys in localStorage. */
export function estimateResearchStudioStorageBytes(): number {
  let bytes = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith('excellent117.')) continue
    bytes += key.length * 2
    bytes += (localStorage.getItem(key)?.length ?? 0) * 2
  }
  return bytes
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}
