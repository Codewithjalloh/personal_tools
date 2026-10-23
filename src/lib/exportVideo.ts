import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import type { ExportProgress, ExportSettings, SlideItem } from '../types'
import { renderSlideWithTitle } from './drawTitleText'
import { buildVideoFilterChain } from './ffmpegFilters'
import { fileToPngBytes } from './fileToPng'
import { buildTimeline, validateTimeline } from './timeline'

let ffmpeg: FFmpeg | null = null
let loadPromise: Promise<FFmpeg> | null = null
let lastLogs: string[] = []

async function getFfmpeg(onLoadProgress?: (ratio: number) => void): Promise<FFmpeg> {
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

function report(onProgress: (p: ExportProgress) => void, phase: ExportProgress['phase'], progress: number) {
  onProgress({ phase, progress: Math.min(1, Math.max(0, progress)) })
}

export async function exportSlideshowVideo(
  slides: SlideItem[],
  settings: ExportSettings,
  onProgress: (p: ExportProgress) => void,
): Promise<Blob> {
  const validation = validateTimeline(slides, settings.totalDurationSec, settings.intro, settings.outro)
  if (!validation.ok) throw new Error(validation.message)

  const isMp4 = settings.format === 'mp4'
  const outFile = isMp4 ? 'output.mp4' : 'output.webm'
  const mime = isMp4 ? 'video/mp4' : 'video/webm'
  const w = settings.width
  const h = settings.height

  report(onProgress, 'loading-encoder', 0.02)
  const ff = await getFfmpeg((p) => report(onProgress, 'loading-encoder', 0.02 + p * 0.18))

  report(onProgress, 'preparing', 0.22)
  const timeline = buildTimeline(slides, settings.totalDurationSec, settings.intro, settings.outro)
  const pngs = await Promise.all(slides.map((s) => fileToPngBytes(s.file)))

  const segments: { name: string; duration: number; bytes: Uint8Array }[] = []

  for (const seg of timeline) {
    if (seg.kind === 'intro') {
      const blob = await renderSlideWithTitle(
        slides[0].url,
        settings.intro,
        w,
        h,
        settings.fit,
      )
      segments.push({
        name: 'intro.png',
        duration: seg.duration,
        bytes: new Uint8Array(await blob.arrayBuffer()),
      })
    } else if (seg.kind === 'outro') {
      const blob = await renderSlideWithTitle(
        slides[seg.slideIndex].url,
        settings.outro,
        w,
        h,
        settings.fit,
      )
      segments.push({
        name: 'outro.png',
        duration: seg.duration,
        bytes: new Uint8Array(await blob.arrayBuffer()),
      })
    } else {
      segments.push({
        name: `slide_${seg.slideIndex}_${segments.length}.png`,
        duration: seg.duration,
        bytes: pngs[seg.slideIndex],
      })
    }
  }

  const cf = settings.crossfadeSec
  const segmentDurations = segments.map((s, i) =>
    cf > 0 && i < segments.length - 1 ? s.duration + cf : s.duration,
  )

  report(onProgress, 'preparing', 0.28)

  const args: string[] = []
  for (const seg of segments) {
    await ff.writeFile(seg.name, seg.bytes)
    args.push('-loop', '1', '-t', seg.duration.toFixed(4), '-i', seg.name)
  }

  let musicInputIndex: number | null = null
  if (settings.musicFile) {
    musicInputIndex = segments.length
    await ff.writeFile('music_audio', await fetchFile(settings.musicFile))
    args.push('-i', 'music_audio')
  }

  const { filterComplex, outputLabel } = buildVideoFilterChain(
    settings,
    segments.length,
    segmentDurations,
  )

  ff.on('progress', ({ progress }) => {
    report(onProgress, 'encoding', 0.3 + progress * 0.68)
  })

  const videoEncode = settings.fastDraft
    ? ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-pix_fmt', 'yuv420p']
    : isMp4
      ? ['-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
      : ['-c:v', 'libvpx', '-deadline', 'realtime', '-cpu-used', '8', '-b:v', '2M']

  const execArgs = [
    ...args,
    '-filter_complex',
    filterComplex,
    '-map',
    outputLabel,
  ]

  if (musicInputIndex != null) {
    execArgs.push(
      '-map',
      `${musicInputIndex}:a`,
      '-c:a',
      isMp4 ? 'aac' : 'libopus',
      '-b:a',
      '128k',
      '-t',
      String(settings.totalDurationSec),
      '-shortest',
    )
  }

  const videoEncodeFinal =
    settings.fastDraft && !isMp4
      ? ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-pix_fmt', 'yuv420p']
      : videoEncode

  execArgs.push(...videoEncodeFinal, outFile)

  try {
    const code = await ff.exec(execArgs)
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

  const data = await ff.readFile(outFile)
  report(onProgress, 'encoding', 1)

  for (const seg of segments) {
    await ff.deleteFile(seg.name)
  }
  if (settings.musicFile) await ff.deleteFile('music_audio')
  await ff.deleteFile(outFile)

  const bytes = new Uint8Array(data as Uint8Array)
  if (bytes.byteLength === 0) throw new Error('Encoder produced an empty file')
  return new Blob([bytes], { type: mime })
}

export function isEncoderLoaded(): boolean {
  return ffmpeg?.loaded ?? false
}
