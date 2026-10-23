import { FFmpeg } from '@ffmpeg/ffmpeg'

let ffmpeg: FFmpeg | null = null
let loadPromise: Promise<FFmpeg> | null = null
let lastLogs: string[] = []

export function getFfmpegLastLogs(): string[] {
  return lastLogs
}

export function isEncoderLoaded(): boolean {
  return ffmpeg?.loaded ?? false
}

export async function loadFfmpeg(onLoadProgress?: (ratio: number) => void): Promise<FFmpeg> {
  if (ffmpeg?.loaded) return ffmpeg

  if (!loadPromise) {
    loadPromise = (async () => {
      const ff = new FFmpeg()
      lastLogs = []
      ff.on('log', ({ message }) => {
        lastLogs.push(message)
        if (lastLogs.length > 40) lastLogs.shift()
      })
      ff.on('progress', ({ progress }) => {
        onLoadProgress?.(Math.min(1, Math.max(0, progress)))
      })

      try {
        const coreURL = new URL(
          `${import.meta.env.BASE_URL}ffmpeg/ffmpeg-core.js`,
          window.location.href,
        ).href
        const wasmURL = new URL(
          `${import.meta.env.BASE_URL}ffmpeg/ffmpeg-core.wasm`,
          window.location.href,
        ).href
        await ff.load({ coreURL, wasmURL })
      } catch (cause) {
        ffmpeg = null
        loadPromise = null
        const detail = cause instanceof Error ? cause.message : String(cause)
        throw new Error(
          `Could not load video encoder (check network / ad blockers). ${detail}`,
        )
      }

      ffmpeg = ff
      return ff
    })()
  }

  return loadPromise
}

export async function execFfmpeg(ff: FFmpeg, args: string[]): Promise<void> {
  try {
    const code = await ff.exec(args)
    if (code !== 0) {
      const tail = lastLogs.slice(-6).join(' ')
      throw new Error(tail || `FFmpeg exited with code ${code}`)
    }
  } catch (cause) {
    const tail = lastLogs.slice(-6).join(' ')
    if (cause instanceof Error && cause.message && cause.message !== 'failed to import ffmpeg-core.js') {
      throw tail ? new Error(`${cause.message} — ${tail}`) : cause
    }
    throw new Error(tail || 'Video encoding failed')
  }
}
