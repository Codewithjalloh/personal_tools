import type { StoredSlideMeta } from './projectStore'

const KEY = 'slideshow-session-backup-v1'

export type SessionBackup = {
  savedAt: number
  slides: StoredSlideMeta[]
}

export function saveSessionBackup(slides: SessionBackup['slides']) {
  if (slides.length === 0) return
  const payload: SessionBackup = { savedAt: Date.now(), slides }
  sessionStorage.setItem(KEY, JSON.stringify(payload))
}

export function peekSessionBackup(): SessionBackup | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as SessionBackup
  } catch {
    return null
  }
}

export function clearSessionBackup() {
  sessionStorage.removeItem(KEY)
}
