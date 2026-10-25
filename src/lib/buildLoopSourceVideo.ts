import {
  INTRO_EXPORT_FPS,
  renderSlideWithTitle,
  renderTitleAnimationFrames,
} from './drawTitleText'
import { execFfmpeg, getFfmpegLastLogs, loadFfmpeg } from './ffmpegClient'
import { scaleFilter } from './ffmpegFilters'
import type { LoopMotionStyle } from './loopMotion'
import { renderLoopMotionFrameFiles } from './renderLoopMotionFrames'
import type { ExportProgress, ExportSettings, FitMode, TitleCardSettings } from '../types'

export type BuildLoopSourceOptions = {
  width?: number
  height?: number
  clipDurationSec: number
  fit: FitMode
  motions: LoopMotionStyle[]
  fastDraft?: boolean
}

function report(onProgress: (p: ExportProgress) => void, phase: ExportProgress['phase'], progress: number) {
  onProgress({ phase, progress: Math.min(1, Math.max(0, progress)) })
}

function solidBackgroundDataUrl(width: number, height: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  const grd = ctx.createLinearGradient(0, 0, width, height)
  grd.addColorStop(0, '#27272a')
  grd.addColorStop(1, '#09090b')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, width, height)
  return canvas.toDataURL('image/png')
}

function miniExportSettings(
  width: number,
  height: number,
  fit: FitMode,
  fastDraft?: boolean,
): ExportSettings {
  return {
    totalDurationSec: 4,
    width,
    height,
    fit,
    format: 'mp4',
    intro: { text: '', color: '#fff', durationSec: 4, fontScale: 1, position: 'center', showBar: false, animation: 'none', fontId: 'system' },
    outro: { text: '', color: '#fff', durationSec: 4, fontScale: 1, position: 'center', showBar: false, animation: 'none', fontId: 'system' },
    crossfadeSec: 0,
    transitionType: 'fade',
    kenBurns: false,
    fastDraft: fastDraft ?? false,
    exportFileName: 'loop-source',
    musicFile: null,
    music: { volume: 0.85, fadeInSec: 1, fadeOutSec: 2 },
  }
}

async function encodeToLoopSourceFile(
  onProgress: (p: ExportProgress) => void,
  buildArgs: (ff: Awaited<ReturnType<typeof loadFfmpeg>>) => Promise<string[]>,
  options: BuildLoopSourceOptions,
): Promise<File> {
  const outFile = 'loop_source_seed.mp4'

  report(onProgress, 'loading-encoder', 0.02)
  const ff = await loadFfmpeg((p) => report(onProgress, 'loading-encoder', 0.02 + p * 0.25))

  report(onProgress, 'preparing', 0.3)
  const execArgs = await buildArgs(ff)
  report(onProgress, 'preparing', 0.35)

  ff.on('progress', ({ progress }) => {
    report(onProgress, 'encoding', 0.38 + progress * 0.6)
  })

  const videoEncode = options.fastDraft
    ? ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-pix_fmt', 'yuv420p']
    : ['-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']

  await execFfmpeg(ff, [...execArgs, ...videoEncode, '-an', outFile])

  const data = await ff.readFile(outFile)
  report(onProgress, 'encoding', 1)
  await ff.deleteFile(outFile).catch(() => {})

  const bytes = new Uint8Array(data as Uint8Array)
  if (bytes.byteLength === 0) {
    const tail = getFfmpegLastLogs().slice(-6).join(' ')
    throw new Error(tail || 'Encoder produced an empty file')
  }
  return new File([bytes], 'loop-source.mp4', { type: 'video/mp4' })
}

export async function buildLoopSourceFromImageBlob(
  blob: Blob,
  onProgress: (p: ExportProgress) => void,
  options: BuildLoopSourceOptions,
): Promise<File> {
  const width = options.width ?? 1280
  const height = options.height ?? 720
  const fps = options.fastDraft ? 20 : options.clipDurationSec > 20 ? 24 : 30

  return encodeToLoopSourceFile(
    onProgress,
    async (ff) => {
      const { pattern, files } = await renderLoopMotionFrameFiles(blob, {
        width,
        height,
        durationSec: options.clipDurationSec,
        fit: options.fit,
        motions: options.motions,
        fps,
        onFrame: (frame, total) => {
          report(onProgress, 'preparing', 0.28 + (frame / total) * 0.14)
        },
      })
      for (const file of files) {
        await ff.writeFile(file.name, file.bytes)
      }
      const dur = options.clipDurationSec.toFixed(4)
      return ['-framerate', String(fps), '-i', pattern, '-t', dur, '-map', '0:v:0']
    },
    options,
  )
}

export async function buildLoopSourceFromImageFile(
  file: File,
  onProgress: (p: ExportProgress) => void,
  options: BuildLoopSourceOptions,
): Promise<File> {
  return buildLoopSourceFromImageBlob(file, onProgress, options)
}

export async function buildLoopSourceFromText(
  card: TitleCardSettings,
  onProgress: (p: ExportProgress) => void,
  options: BuildLoopSourceOptions,
): Promise<File> {
  const text = card.text.trim()
  if (!text) throw new Error('Enter text for your loop')

  const width = options.width ?? 1280
  const height = options.height ?? 720
  const clipDurationSec = options.clipDurationSec
  const bgUrl = solidBackgroundDataUrl(width, height)
  const settings = miniExportSettings(width, height, 'cover', options.fastDraft)

  const animated = card.animation !== 'none'

  return encodeToLoopSourceFile(
    onProgress,
    async (ff) => {
      if (!animated) {
        const png = await renderSlideWithTitle(bgUrl, card, width, height, 'cover')
        const imageName = 'loop_text.png'
        await ff.writeFile(imageName, new Uint8Array(await png.arrayBuffer()))
        const dur = clipDurationSec.toFixed(4)
        const vf = scaleFilter(settings, '[0:v]', '[out]')
        return [
          '-loop',
          '1',
          '-t',
          dur,
          '-i',
          imageName,
          '-filter_complex',
          vf,
          '-map',
          '[out]',
          '-t',
          dur,
        ]
      }

      const frames = await renderTitleAnimationFrames(
        bgUrl,
        card,
        width,
        height,
        'cover',
        clipDurationSec,
        'loop_text',
      )
      for (const frame of frames) {
        await ff.writeFile(frame.name, frame.bytes)
      }
      const pattern = frames[0]?.pattern ?? 'loop_text_%04d.png'
      const dur = clipDurationSec.toFixed(4)
      return [
        '-framerate',
        String(INTRO_EXPORT_FPS),
        '-i',
        pattern,
        '-t',
        dur,
        '-map',
        '0:v:0',
      ]
    },
    options,
  )
}

export type LoopSourceBuildResult = {
  file: File
  includeSourceAudio: boolean
}

export async function remoteBlobToSourceVideo(
  blob: Blob,
  mime: string,
  url: string,
  onProgress: (p: ExportProgress) => void,
  options: BuildLoopSourceOptions,
): Promise<LoopSourceBuildResult> {
  if (isLikelyVideoMime(mime, url)) {
    const ext = mime.includes('webm') ? 'webm' : 'mp4'
    return {
      file: new File([blob], `remote.${ext}`, { type: mime || `video/${ext}` }),
      includeSourceAudio: true,
    }
  }
  if (!mime.startsWith('image/') && !isLikelyImageMime(mime, url)) {
    throw new Error('URL must point to an image or video file')
  }
  const file = await buildLoopSourceFromImageBlob(blob, onProgress, options)
  return { file, includeSourceAudio: false }
}

function isLikelyVideoMime(mime: string, url: string): boolean {
  if (mime.startsWith('video/')) return true
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)
}

function isLikelyImageMime(mime: string, url: string): boolean {
  if (mime.startsWith('image/')) return true
  return /\.(png|jpe?g|gif|webp|avif)(\?|#|$)/i.test(url)
}
