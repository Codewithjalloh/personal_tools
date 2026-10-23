import { fetchFile } from '@ffmpeg/util'
import type { ExportProgress } from '../types'
import { execFfmpeg, getFfmpegLastLogs, loadFfmpeg } from './ffmpegClient'

export type LoopedVideoExportOptions = {
  fastDraft?: boolean
  includeAudio?: boolean
}

function report(onProgress: (p: ExportProgress) => void, phase: ExportProgress['phase'], progress: number) {
  onProgress({ phase, progress: Math.min(1, Math.max(0, progress)) })
}

function inputExt(file: File, fallback: string): string {
  const m = file.name.match(/\.([a-zA-Z0-9]+)$/)
  return m ? m[1].toLowerCase() : fallback
}

export async function exportLoopedVideo(
  videoFile: File,
  durationSec: number,
  onProgress: (p: ExportProgress) => void,
  options?: LoopedVideoExportOptions,
): Promise<Blob> {
  const videoName = `extend_loop.${inputExt(videoFile, 'mp4')}`
  const outFile = 'extend_loop_output.mp4'
  const includeAudio = options?.includeAudio ?? true

  report(onProgress, 'loading-encoder', 0.02)
  const ff = await loadFfmpeg((p) => report(onProgress, 'loading-encoder', 0.02 + p * 0.18))

  report(onProgress, 'preparing', 0.22)
  await ff.writeFile(videoName, await fetchFile(videoFile))
  report(onProgress, 'preparing', 0.28)

  ff.on('progress', ({ progress }) => {
    report(onProgress, 'encoding', 0.3 + progress * 0.68)
  })

  const videoEncode = options?.fastDraft
    ? ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-pix_fmt', 'yuv420p']
    : ['-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']

  const execArgs = [
    '-stream_loop',
    '-1',
    '-i',
    videoName,
    '-t',
    durationSec.toFixed(4),
    '-map',
    '0:v:0',
  ]

  if (includeAudio) {
    execArgs.push('-map', '0:a?')
    execArgs.push('-c:a', 'aac', '-b:a', '128k')
  } else {
    execArgs.push('-an')
  }

  execArgs.push(...videoEncode, outFile)

  await execFfmpeg(ff, execArgs)

  const data = await ff.readFile(outFile)
  report(onProgress, 'encoding', 1)

  await ff.deleteFile(videoName)
  await ff.deleteFile(outFile)

  const bytes = new Uint8Array(data as Uint8Array)
  if (bytes.byteLength === 0) {
    const tail = getFfmpegLastLogs().slice(-6).join(' ')
    throw new Error(tail || 'Encoder produced an empty file')
  }
  return new Blob([bytes], { type: 'video/mp4' })
}
