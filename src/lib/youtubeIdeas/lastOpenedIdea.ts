const KEY = 'excellent117.lastOpenedIdeaId.v1'

export function setLastOpenedIdeaId(id: string): void {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    // ignore
  }
}

export function getLastOpenedIdeaId(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}
