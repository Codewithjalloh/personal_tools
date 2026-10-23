import { fetchFile } from '@ffmpeg/util'
import type { ExportProgress, FitMode } from '../types'
import { renderTextOverlayPng } from './sceneComposer/drawSceneText'
import {
  repackClipStarts,
  resolveExportDurationSec,
  timelineVisualEndSec,
} from './sceneComposer/timeline'
import type { SceneComposerSettings, TextLayer, VisualClip } from './sceneComposer/types'
import { execFfmpeg, getFfmpegLastLogs, loadFfmpeg } from './ffmpegClient'
import { fileToPngBytes } from './fileToPng'

function report(onProgress: (p: ExportProgress) => void, phase: ExportProgress['phase'], progress: number) {
  onProgress({ phase, progress: Math.min(1, Math.max(0, progress)) })
}

function inputExt(file: File, fallback: string): string {
  const m = file.name.match(/\.([a-zA-Z0-9]+)$/)
  return m ? m[1].toLowerCase() : fallback
}

function scaleFilter(fit: FitMode, inputLabel: string, outputLabel: string, width: number, height: number) {
  if (fit === 'cover') {
    return `${inputLabel}scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}${outputLabel}`
  }
  return `${inputLabel}scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black${outputLabel}`
}

export type SceneExportPayload = {
  clips: VisualClip[]
  texts: TextLayer[]
  audioFile: File | null
  audioDurationSec: number | null
  settings: SceneComposerSettings
}

export function validateSceneExport(payload: SceneExportPayload): { ok: true } | { ok: false; message: string } {
  const packed = repackClipStarts(payload.clips)
  if (packed.length === 0) return { ok: false, message: 'Add at least one image or video clip.' }
  if (packed.some((c) => c.durationSec <= 0)) {
    return { ok: false, message: 'Each clip needs a duration greater than zero.' }
  }
  for (const t of payload.texts) {
    if (!t.text.trim()) continue
    if (t.endSec <= t.startSec) return { ok: false, message: 'Text layers need an end time after the start time.' }
  }
  if (payload.settings.durationMode === 'audio' && !payload.audioFile) {
    return { ok: false, message: 'Choose an audio file or switch length to “Timeline”.' }
  }
  return { ok: true }
}

export async function exportSceneComposer(
  payload: SceneExportPayload,
  onProgress: (p: ExportProgress) => void,
): Promise<Blob> {
  const validation = validateSceneExport(payload)
  if (!validation.ok) throw new Error(validation.message)

  const { settings, texts, audioFile, audioDurationSec } = payload
  const packed = repackClipStarts(payload.clips)
  const w = settings.width
  const h = settings.height
  const totalDuration = resolveExportDurationSec(
    packed,
    texts,
    audioDurationSec,
    settings.durationMode,
  )
  const visualEnd = timelineVisualEndSec(packed)
  const padSec = Math.max(0, totalDuration - visualEnd)

  const outFile = 'scene_output.mp4'
  const activeTexts = texts.filter((t) => t.text.trim())

  report(onProgress, 'loading-encoder', 0.02)
  const ff = await loadFfmpeg((p) => report(onProgress, 'loading-encoder', 0.02 + p * 0.18))

  report(onProgress, 'preparing', 0.22)

  const clipInputNames: string[] = []
  for (let i = 0; i < packed.length; i++) {
    const clip = packed[i]
    const ext = clip.kind === 'image' ? 'png' : inputExt(clip.file, 'mp4')
    const name = `clip_${i}.${ext}`
    clipInputNames.push(name)
    if (clip.kind === 'image') {
      await ff.writeFile(name, await fileToPngBytes(clip.file))
    } else {
      await ff.writeFile(name, await fetchFile(clip.file))
    }
  }

  const textOverlayNames: string[] = []
  for (let i = 0; i < activeTexts.length; i++) {
    const name = `text_${i}.png`
    textOverlayNames.push(name)
    await ff.writeFile(name, await renderTextOverlayPng(activeTexts[i], w, h))
  }

  let audioName: string | null = null
  if (audioFile) {
    audioName = `scene_audio.${inputExt(audioFile, 'm4a')}`
    await ff.writeFile(audioName, await fetchFile(audioFile))
  }

  report(onProgress, 'preparing', 0.32)

  const args: string[] = []
  for (let i = 0; i < packed.length; i++) {
    const clip = packed[i]
    const name = clipInputNames[i]
    const dur = clip.durationSec.toFixed(4)
    if (clip.kind === 'image') {
      args.push('-loop', '1', '-t', dur, '-i', name)
    } else if (clip.loop) {
      args.push('-stream_loop', '-1', '-t', dur, '-i', name)
    } else {
      args.push('-t', dur, '-i', name)
    }
  }

  for (const name of textOverlayNames) {
    args.push('-loop', '1', '-t', totalDuration.toFixed(4), '-i', name)
  }

  if (audioName) {
    args.push('-i', audioName)
  }

  const filters: string[] = []
  const scaledLabels: string[] = []
  for (let i = 0; i < packed.length; i++) {
    const out = `[sv${i}]`
    filters.push(scaleFilter(settings.fit, `[${i}:v]`, out, w, h))
    scaledLabels.push(out)
  }

  let videoLabel = '[basev]'
  if (packed.length === 1) {
    videoLabel = scaledLabels[0]
  } else {
    filters.push(`${scaledLabels.join('')}concat=n=${packed.length}:v=1:a=0${videoLabel}`)
  }

  if (padSec > 0.01) {
    const padded = '[vpadded]'
    filters.push(
      `${videoLabel}tpad=stop_mode=add:stop_duration=${padSec.toFixed(4)}${padded}`,
    )
    videoLabel = padded
  }

  let current = videoLabel
  let finalVideoLabel = videoLabel
  for (let i = 0; i < activeTexts.length; i++) {
    const layer = activeTexts[i]
    const inputIndex = packed.length + i
    const next = i === activeTexts.length - 1 ? '[outv]' : `[txt${i}]`
    const enable = `between(t\\,${layer.startSec.toFixed(3)}\\,${layer.endSec.toFixed(3)})`
    filters.push(`${current}[${inputIndex}:v]overlay=0:0:enable='${enable}'${next}`)
    current = next
    finalVideoLabel = next
  }

  const filterComplex = filters.join(';')

  ff.on('progress', ({ progress }) => {
    report(onProgress, 'encoding', 0.35 + progress * 0.63)
  })

  const videoEncode = settings.fastDraft
    ? ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-pix_fmt', 'yuv420p']
    : ['-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']

  const execArgs = [
    ...args,
    '-filter_complex',
    filterComplex,
    '-map',
    finalVideoLabel,
    '-t',
    totalDuration.toFixed(4),
    ...videoEncode,
  ]

  if (audioName) {
    const audioIndex = packed.length + activeTexts.length
    execArgs.push('-map', `${audioIndex}:a:0`, '-c:a', 'aac', '-b:a', '128k', '-shortest')
  }

  execArgs.push(outFile)

  await execFfmpeg(ff, execArgs)

  const data = await ff.readFile(outFile)
  report(onProgress, 'encoding', 1)

  for (const name of clipInputNames) await ff.deleteFile(name)
  for (const name of textOverlayNames) await ff.deleteFile(name)
  if (audioName) await ff.deleteFile(audioName)
  await ff.deleteFile(outFile)

  const bytes = new Uint8Array(data as Uint8Array)
  if (bytes.byteLength === 0) {
    const tail = getFfmpegLastLogs().slice(-6).join(' ')
    throw new Error(tail || 'Encoder produced an empty file')
  }
  return new Blob([bytes], { type: 'video/mp4' })
}
