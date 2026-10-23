export function formatDurationClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '—'
  const total = Math.round(sec)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

export function getMediaDurationSec(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const isVideo = file.type.startsWith('video/')
    const el = document.createElement(isVideo ? 'video' : 'audio')
    el.preload = 'metadata'
    const cleanup = () => URL.revokeObjectURL(url)

    el.addEventListener('loadedmetadata', () => {
      cleanup()
      const d = el.duration
      if (Number.isFinite(d) && d > 0) resolve(d)
      else reject(new Error('Could not read duration from file'))
    })
    el.addEventListener('error', () => {
      cleanup()
      reject(new Error('Could not load file for duration'))
    })
    el.src = url
  })
}
