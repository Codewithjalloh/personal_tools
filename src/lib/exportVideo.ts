import { fetchFile } from '@ffmpeg/util'
import type { ExportProgress, ExportSettings, SlideItem } from '../types'
import {
  INTRO_EXPORT_FPS,
  renderSlideWithTitle,
  renderTitleAnimationFrames,
} from './drawTitleText'
import { execFfmpeg, isEncoderLoaded, loadFfmpeg } from './ffmpegClient'
import { buildVideoFilterChain } from './ffmpegFilters'
import { fileToPngBytes } from './fileToPng'
import { buildTimeline, validateTimeline } from './timeline'

export { isEncoderLoaded }

export type ExportOverrides = {
  width?: number
  height?: number
  totalDurationSec?: number
  fastDraft?: boolean
}

type ExportSegment = {
  duration: number
  files: { name: string; bytes: Uint8Array }[]
  mode: 'loop' | 'sequence'
  fps?: number
  sequencePattern?: string
}

function applyOverrides(settings: ExportSettings, overrides?: ExportOverrides): ExportSettings {
  if (!overrides) return settings
  return {
    ...settings,
    width: overrides.width ?? settings.width,
    height: overrides.height ?? settings.height,
    totalDurationSec: overrides.totalDurationSec ?? settings.totalDurationSec,
    fastDraft: overrides.fastDraft ?? settings.fastDraft,
  }
}

function report(onProgress: (p: ExportProgress) => void, phase: ExportProgress['phase'], progress: number) {
  onProgress({ phase, progress: Math.min(1, Math.max(0, progress)) })
}

async function buildTitleSegment(
  imageUrl: string,
  card: ExportSettings['intro'],
  w: number,
  h: number,
  fit: ExportSettings['fit'],
  duration: number,
  framePrefix: string,
): Promise<ExportSegment> {
  if (card.animation !== 'none') {
    const frames = await renderTitleAnimationFrames(
      imageUrl,
      card,
      w,
      h,
      fit,
      duration,
      framePrefix,
    )
    return {
      duration,
      files: frames.map(({ name, bytes }) => ({ name, bytes })),
      mode: 'sequence',
      fps: INTRO_EXPORT_FPS,
      sequencePattern: `${framePrefix}_%04d.png`,
    }
  }
  const blob = await renderSlideWithTitle(imageUrl, card, w, h, fit)
  return {
    duration,
    files: [{ name: `${framePrefix}_static.png`, bytes: new Uint8Array(await blob.arrayBuffer()) }],
    mode: 'loop',
  }
}

export async function exportSlideshowVideo(
  slides: SlideItem[],
  settings: ExportSettings,
  onProgress: (p: ExportProgress) => void,
  overrides?: ExportOverrides,
): Promise<Blob> {
  const effective = applyOverrides(settings, overrides)
  const validation = validateTimeline(
    slides,
    effective.totalDurationSec,
    effective.intro,
    effective.outro,
  )
  if (!validation.ok) throw new Error(validation.message)

  const isMp4 = effective.format === 'mp4'
  const outFile = isMp4 ? 'output.mp4' : 'output.webm'
  const mime = isMp4 ? 'video/mp4' : 'video/webm'
  const w = effective.width
  const h = effective.height

  report(onProgress, 'loading-encoder', 0.02)
  const ff = await loadFfmpeg((p) => report(onProgress, 'loading-encoder', 0.02 + p * 0.18))

  report(onProgress, 'preparing', 0.22)
  const timeline = buildTimeline(
    slides,
    effective.totalDurationSec,
    effective.intro,
    effective.outro,
  )
  const pngs = await Promise.all(slides.map((s) => fileToPngBytes(s.file)))

  const segments: ExportSegment[] = []

  for (const seg of timeline) {
    if (seg.kind === 'intro') {
      segments.push(
        await buildTitleSegment(
          slides[0].url,
          effective.intro,
          w,
          h,
          effective.fit,
          seg.duration,
          'intro',
        ),
      )
    } else if (seg.kind === 'outro') {
      segments.push(
        await buildTitleSegment(
          slides[seg.slideIndex].url,
          effective.outro,
          w,
          h,
          effective.fit,
          seg.duration,
          'outro',
        ),
      )
    } else {
      segments.push({
        duration: seg.duration,
        files: [{ name: `slide_${seg.slideIndex}_${segments.length}.png`, bytes: pngs[seg.slideIndex] }],
        mode: 'loop',
      })
    }
  }

  const cf = effective.crossfadeSec
  const segmentDurations = segments.map((s, i) =>
    cf > 0 && i < segments.length - 1 ? s.duration + cf : s.duration,
  )

  report(onProgress, 'preparing', 0.28)

  const args: string[] = []
  for (const seg of segments) {
    for (const file of seg.files) {
      await ff.writeFile(file.name, file.bytes)
    }
    if (seg.mode === 'sequence') {
      args.push('-framerate', String(seg.fps ?? INTRO_EXPORT_FPS), '-i', seg.sequencePattern!)
    } else {
      args.push('-loop', '1', '-t', seg.duration.toFixed(4), '-i', seg.files[0].name)
    }
  }

  let musicInputIndex: number | null = null
  if (effective.musicFile) {
    musicInputIndex = segments.length
    await ff.writeFile('music_audio', await fetchFile(effective.musicFile))
    args.push('-i', 'music_audio')
  }

  const { filterComplex: videoFilter, outputLabel } = buildVideoFilterChain(
    effective,
    segments.length,
    segmentDurations,
  )

  let filterComplex = videoFilter
  let audioMap: string | null = null

  if (musicInputIndex != null) {
    const { volume, fadeInSec, fadeOutSec } = effective.music
    const fadeOutStart = Math.max(0, effective.totalDurationSec - fadeOutSec)
    filterComplex += `;[${musicInputIndex}:a]volume=${volume.toFixed(2)},afade=t=in:st=0:d=${fadeInSec.toFixed(2)},afade=t=out:st=${fadeOutStart.toFixed(2)}:d=${fadeOutSec.toFixed(2)}[aout]`
    audioMap = '[aout]'
  }

  ff.on('progress', ({ progress }) => {
    report(onProgress, 'encoding', 0.3 + progress * 0.68)
  })

  const videoEncode = effective.fastDraft
    ? ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-pix_fmt', 'yuv420p']
    : isMp4
      ? ['-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
      : ['-c:v', 'libvpx', '-deadline', 'realtime', '-cpu-used', '8', '-b:v', '2M']

  const execArgs = [...args, '-filter_complex', filterComplex, '-map', outputLabel]

  if (audioMap) {
    execArgs.push('-map', audioMap, '-c:a', isMp4 ? 'aac' : 'libopus', '-b:a', '128k', '-shortest')
  }

  const videoEncodeFinal =
    effective.fastDraft && !isMp4
      ? ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-pix_fmt', 'yuv420p']
      : videoEncode

  execArgs.push(...videoEncodeFinal, outFile)

  await execFfmpeg(ff, execArgs)

  const data = await ff.readFile(outFile)
  report(onProgress, 'encoding', 1)

  for (const seg of segments) {
    for (const file of seg.files) {
      await ff.deleteFile(file.name)
    }
  }
  if (effective.musicFile) await ff.deleteFile('music_audio')
  await ff.deleteFile(outFile)

  const bytes = new Uint8Array(data as Uint8Array)
  if (bytes.byteLength === 0) throw new Error('Encoder produced an empty file')
  return new Blob([bytes], { type: mime })
}
