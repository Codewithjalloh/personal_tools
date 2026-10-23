export type ReaderPrefs = {
  fontSize: number
  lineHeight: number
  highlightMode: boolean
  recordingMode: boolean
}

const KEY = 'excellent117.readerPrefs.v1'

const DEFAULT: ReaderPrefs = {
  fontSize: 17,
  lineHeight: 1.75,
  highlightMode: true,
  recordingMode: false,
}

export function loadReaderPrefs(): ReaderPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    const parsed = JSON.parse(raw) as Partial<ReaderPrefs>
    return {
      fontSize: clamp(parsed.fontSize ?? DEFAULT.fontSize, 14, 26),
      lineHeight: clamp(parsed.lineHeight ?? DEFAULT.lineHeight, 1.5, 2.2),
      highlightMode: parsed.highlightMode ?? DEFAULT.highlightMode,
      recordingMode: parsed.recordingMode ?? DEFAULT.recordingMode,
    }
  } catch {
    return { ...DEFAULT }
  }
}

export function saveReaderPrefs(prefs: ReaderPrefs): void {
  localStorage.setItem(KEY, JSON.stringify(prefs))
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function applyRecordingPreset(prefs: ReaderPrefs): ReaderPrefs {
  return {
    ...prefs,
    fontSize: 20,
    lineHeight: 2,
    highlightMode: true,
    recordingMode: true,
  }
}
