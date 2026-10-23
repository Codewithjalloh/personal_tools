import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ToolPageHeader } from '../components/layout/ToolPageHeader'
import { exportSceneComposer, validateSceneExport } from '../lib/exportSceneComposer'
import { drawImageOnCanvas, loadImageElement } from '../lib/drawFrame'
import { drawSceneTextOnCanvas } from '../lib/sceneComposer/drawSceneText'
import {
  clipAtTime,
  localTimeInClip,
  repackClipStarts,
  resolveExportDurationSec,
  textsVisibleAt,
  timelineVisualEndSec,
} from '../lib/sceneComposer/timeline'
import {
  DEFAULT_SCENE_SETTINGS,
  RESOLUTION_PRESETS,
  type SceneComposerSettings,
  type TextLayer,
  type VisualClip,
} from '../lib/sceneComposer/types'
import { errorMessage } from '../lib/errorMessage'
import { formatDurationClock, getMediaDurationSec } from '../lib/mediaDuration'
import type { ExportPhase } from '../types'

const PHASE_LABEL: Record<ExportPhase, string> = {
  'loading-encoder': 'Loading encoder…',
  preparing: 'Preparing files…',
  encoding: 'Encoding video…',
}

function newId(): string {
  return crypto.randomUUID()
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp)$/i.test(file.name)
}

function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name)
}

async function fileToVisualClip(file: File): Promise<VisualClip> {
  const url = URL.createObjectURL(file)
  const kind = isVideoFile(file) ? 'video' : 'image'
  let sourceDurationSec: number | null = null
  if (kind === 'video') {
    try {
      sourceDurationSec = await getMediaDurationSec(file)
    } catch {
      sourceDurationSec = null
    }
  }
  const durationSec =
    kind === 'video' && sourceDurationSec != null ? Math.max(1, sourceDurationSec) : 5
  return {
    id: newId(),
    kind,
    file,
    url,
    name: file.name,
    startSec: 0,
    durationSec,
    loop: kind === 'video',
    sourceDurationSec,
  }
}

function defaultTextLayer(endSec: number): TextLayer {
  return {
    id: newId(),
    text: 'Your title',
    x: 0.5,
    y: 0.5,
    fontScale: 1,
    color: '#ffffff',
    showBar: true,
    fontId: 'system',
    startSec: 0,
    endSec: Math.min(5, endSec),
  }
}

export function SceneComposerPage() {
  const [clips, setClips] = useState<VisualClip[]>([])
  const [texts, setTexts] = useState<TextLayer[]>([])
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioDurationSec, setAudioDurationSec] = useState<number | null>(null)
  const [settings, setSettings] = useState<SceneComposerSettings>(DEFAULT_SCENE_SETTINGS)
  const [playheadSec, setPlayheadSec] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportPhase, setExportPhase] = useState<ExportPhase>('preparing')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [draggingText, setDraggingText] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const playRafRef = useRef<number | null>(null)
  const playStartRef = useRef(0)
  const playheadStartRef = useRef(0)

  const packedClips = useMemo(() => repackClipStarts(clips), [clips])
  const exportDurationSec = useMemo(
    () => resolveExportDurationSec(packedClips, texts, audioDurationSec, settings.durationMode),
    [packedClips, texts, audioDurationSec, settings.durationMode],
  )
  const visualEndSec = useMemo(() => timelineVisualEndSec(packedClips), [packedClips])

  const validation = useMemo(
    () => validateSceneExport({ clips: packedClips, texts, audioFile, audioDurationSec, settings }),
    [packedClips, texts, audioFile, audioDurationSec, settings],
  )

  const selectedClip = packedClips.find((c) => c.id === selectedClipId) ?? null
  const selectedText = texts.find((t) => t.id === selectedTextId) ?? null

  const clipsRef = useRef(clips)
  clipsRef.current = clips
  useEffect(() => {
    return () => {
      for (const c of clipsRef.current) URL.revokeObjectURL(c.url)
    }
  }, [])

  useEffect(() => {
    if (!audioFile) {
      setAudioUrl(null)
      setAudioDurationSec(null)
      return
    }
    const url = URL.createObjectURL(audioFile)
    setAudioUrl(url)
    void getMediaDurationSec(audioFile)
      .then(setAudioDurationSec)
      .catch(() => setAudioDurationSec(null))
    return () => URL.revokeObjectURL(url)
  }, [audioFile])

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => isImageFile(f) || isVideoFile(f))
    if (list.length === 0) return
    const newClips = await Promise.all(list.map((f) => fileToVisualClip(f)))
    setClips((prev) => repackClipStarts([...prev, ...newClips]))
    if (!selectedClipId && newClips[0]) setSelectedClipId(newClips[0].id)
  }, [selectedClipId])

  const onMediaDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (exporting) return
    void addFiles(e.dataTransfer.files)
  }

  const drawPreview = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = settings.width
    const h = settings.height
    canvas.width = w
    canvas.height = h

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)

    const clip = clipAtTime(packedClips, playheadSec)
    if (clip) {
      const localT = localTimeInClip(clip, playheadSec)
      if (clip.kind === 'image') {
        try {
          const img = await loadImageElement(clip.url)
          drawImageOnCanvas(ctx, img, w, h, settings.fit)
        } catch {
          /* ignore */
        }
      } else {
        const video = videoRef.current
        if (video && video.src !== clip.url) {
          video.src = clip.url
          video.load()
        }
        if (video && video.readyState >= 2) {
          drawImageOnCanvas(ctx, video, w, h, settings.fit)
        }
        if (video) {
          const target =
            clip.loop && clip.sourceDurationSec
              ? localT % clip.sourceDurationSec
              : Math.min(localT, clip.sourceDurationSec ?? localT)
          if (Math.abs(video.currentTime - target) > 0.15) {
            video.currentTime = target
          }
        }
      }
    }

    for (const layer of textsVisibleAt(texts, playheadSec)) {
      drawSceneTextOnCanvas(ctx, layer, w, h)
    }
  }, [packedClips, playheadSec, settings.fit, settings.height, settings.width, texts])

  useEffect(() => {
    void drawPreview()
  }, [drawPreview])

  const stopPlayback = useCallback(() => {
    setPlaying(false)
    if (playRafRef.current != null) cancelAnimationFrame(playRafRef.current)
    playRafRef.current = null
    videoRef.current?.pause()
    audioRef.current?.pause()
  }, [])

  const startPlayback = useCallback(() => {
    stopPlayback()
    setPlaying(true)
    playStartRef.current = performance.now()
    playheadStartRef.current = playheadSec
    void audioRef.current?.play()
    const tick = () => {
      const elapsed = (performance.now() - playStartRef.current) / 1000
      const next = playheadStartRef.current + elapsed
      if (next >= exportDurationSec) {
        setPlayheadSec(exportDurationSec)
        stopPlayback()
        return
      }
      setPlayheadSec(next)
      playRafRef.current = requestAnimationFrame(tick)
    }
    playRafRef.current = requestAnimationFrame(tick)
  }, [exportDurationSec, playheadSec, stopPlayback])

  const updateClip = (id: string, patch: Partial<VisualClip>) => {
    setClips((prev) => repackClipStarts(prev.map((c) => (c.id === id ? { ...c, ...patch } : c))))
  }

  const updateText = (id: string, patch: Partial<TextLayer>) => {
    setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  const moveClip = (id: string, dir: -1 | 1) => {
    setClips((prev) => {
      const idx = prev.findIndex((c) => c.id === id)
      if (idx < 0) return prev
      const next = idx + dir
      if (next < 0 || next >= prev.length) return prev
      const copy = [...prev]
      const [item] = copy.splice(idx, 1)
      copy.splice(next, 0, item)
      return repackClipStarts(copy)
    })
  }

  const removeClip = (id: string) => {
    setClips((prev) => {
      const removed = prev.find((c) => c.id === id)
      if (removed) URL.revokeObjectURL(removed.url)
      const next = repackClipStarts(prev.filter((c) => c.id !== id))
      if (selectedClipId === id) setSelectedClipId(next[0]?.id ?? null)
      return next
    })
  }

  const onCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!selectedText) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    updateText(selectedText.id, { x, y })
    setDraggingText(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingText || !selectedText) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
    updateText(selectedText.id, { x, y })
  }

  const onCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDraggingText(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const downloadBlob = (blob: Blob) => {
    const safeName = settings.exportFileName.trim().replace(/[^\w.-]+/g, '_') || 'scene'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${safeName}.mp4`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const runExport = async () => {
    if (!validation.ok) {
      setError(validation.message)
      return
    }
    setExporting(true)
    setError(null)
    setProgress(0)
    stopPlayback()
    try {
      const blob = await exportSceneComposer(
        { clips: packedClips, texts, audioFile, audioDurationSec, settings },
        (p) => {
          setExportPhase(p.phase)
          setProgress(p.progress)
        },
      )
      downloadBlob(blob)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setExporting(false)
    }
  }

  const pxPerSec = 28
  const timelineWidth = Math.max(320, exportDurationSec * pxPerSec)

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      <ToolPageHeader
        title="Scene composer"
        description="Drop images and video on the timeline, add voice-over, place text on the canvas, and export one MP4 — all in your browser."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onMediaDrop}
            className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-6 text-center"
          >
            <p className="text-sm text-zinc-300">Drag images or video here</p>
            <p className="mt-1 text-xs text-zinc-500">They are added in order on the visual track.</p>
            <label className="mt-3 inline-block cursor-pointer rounded-lg bg-zinc-800 px-4 py-2 text-xs text-zinc-200 hover:bg-zinc-700">
              Browse files
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                disabled={exporting}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files
                  if (f?.length) void addFiles(f)
                  e.target.value = ''
                }}
              />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-200">Preview</h2>
              <p className="text-xs text-zinc-500">
                {formatDurationClock(playheadSec)} / {formatDurationClock(exportDurationSec)}
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black">
              <canvas
                ref={canvasRef}
                className="mx-auto max-h-[50vh] w-full cursor-crosshair touch-none"
                style={{ aspectRatio: `${settings.width} / ${settings.height}` }}
                onPointerDown={onCanvasPointerDown}
                onPointerMove={onCanvasPointerMove}
                onPointerUp={onCanvasPointerUp}
              />
            </div>
            <p className="text-xs text-zinc-500">
              Select a text layer, then drag on the preview to position it.
            </p>
            <video ref={videoRef} muted playsInline className="hidden" />
            {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={exporting || packedClips.length === 0}
                onClick={() => (playing ? stopPlayback() : startPlayback())}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
              >
                {playing ? 'Pause' : 'Play preview'}
              </button>
              <button
                type="button"
                disabled={exporting}
                onClick={() => {
                  stopPlayback()
                  setPlayheadSec(0)
                }}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-900"
              >
                Reset playhead
              </button>
              <button
                type="button"
                disabled={exporting}
                onClick={() => {
                  const layer = defaultTextLayer(exportDurationSec)
                  setTexts((prev) => [...prev, layer])
                  setSelectedTextId(layer.id)
                  setSelectedClipId(null)
                }}
                className="rounded-lg border border-violet-700/50 bg-violet-950/30 px-4 py-2 text-sm text-violet-200 hover:bg-violet-950/50"
              >
                Add text
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-zinc-200">Timeline</h2>
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
              <div className="relative h-24" style={{ width: timelineWidth }}>
                <div className="absolute inset-x-0 top-0 h-10 rounded-lg bg-zinc-900/80">
                  {packedClips.map((clip) => (
                    <button
                      key={clip.id}
                      type="button"
                      disabled={exporting}
                      onClick={() => {
                        setSelectedClipId(clip.id)
                        setSelectedTextId(null)
                        setPlayheadSec(clip.startSec)
                      }}
                      className={`absolute top-1 h-8 overflow-hidden rounded-md border px-2 text-left text-[10px] ${
                        selectedClipId === clip.id
                          ? 'border-violet-500 bg-violet-950/50 text-violet-100'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500'
                      }`}
                      style={{
                        left: clip.startSec * pxPerSec,
                        width: Math.max(clip.durationSec * pxPerSec, 24),
                      }}
                      title={clip.name}
                    >
                      <span className="block truncate">{clip.kind === 'video' ? '🎬' : '🖼'} {clip.name}</span>
                    </button>
                  ))}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-10 rounded-lg bg-zinc-900/80">
                  {texts.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      disabled={exporting || !t.text.trim()}
                      onClick={() => {
                        setSelectedTextId(t.id)
                        setSelectedClipId(null)
                        setPlayheadSec(t.startSec)
                      }}
                      className={`absolute top-1 h-8 overflow-hidden rounded-md border px-2 text-left text-[10px] ${
                        selectedTextId === t.id
                          ? 'border-amber-500 bg-amber-950/40 text-amber-100'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
                      }`}
                      style={{
                        left: t.startSec * pxPerSec,
                        width: Math.max((t.endSec - t.startSec) * pxPerSec, 20),
                      }}
                    >
                      <span className="block truncate">✏️ {t.text}</span>
                    </button>
                  ))}
                </div>
                <div
                  className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-violet-400"
                  style={{ left: playheadSec * pxPerSec }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={exportDurationSec}
                step={0.05}
                value={playheadSec}
                disabled={exporting}
                onChange={(e) => {
                  stopPlayback()
                  setPlayheadSec(Number(e.target.value))
                }}
                className="mt-3 w-full accent-violet-500"
              />
            </div>
            <p className="text-xs text-zinc-600">
              Visual track ends at {formatDurationClock(visualEndSec)}
              {settings.durationMode === 'audio' && audioDurationSec != null && visualEndSec < audioDurationSec
                ? ` · black fill to ${formatDurationClock(audioDurationSec)} audio`
                : ''}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Voice / audio</h2>
            <p className="mt-1 text-xs text-zinc-500">Optional. When “Match audio” is on, export length follows this file.</p>
            <div className="mt-3 flex gap-2">
              <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-zinc-700 bg-zinc-950 px-3 py-2 text-center text-xs text-zinc-400 hover:border-zinc-500">
                {audioFile ? audioFile.name : 'Choose audio'}
                <input
                  type="file"
                  accept="audio/*"
                  disabled={exporting}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    setAudioFile(f ?? null)
                    e.target.value = ''
                  }}
                />
              </label>
              {audioFile && (
                <button
                  type="button"
                  disabled={exporting}
                  onClick={() => setAudioFile(null)}
                  className="rounded-lg bg-zinc-800 px-3 text-xs text-zinc-300"
                >
                  Remove
                </button>
              )}
            </div>
            {audioDurationSec != null && (
              <p className="mt-2 text-xs text-zinc-500">Duration {formatDurationClock(audioDurationSec)}</p>
            )}
          </div>
        </div>

        <aside className="h-fit space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 lg:sticky lg:top-6">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Canvas</h2>
            <label className="mt-2 block text-xs text-zinc-500">
              Resolution
              <select
                value={`${settings.width}x${settings.height}`}
                disabled={exporting}
                onChange={(e) => {
                  const preset = RESOLUTION_PRESETS.find((p) => `${p.width}x${p.height}` === e.target.value)
                  if (preset) setSettings((s) => ({ ...s, width: preset.width, height: preset.height }))
                }}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              >
                {RESOLUTION_PRESETS.map((p) => (
                  <option key={p.label} value={`${p.width}x${p.height}`}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-2 block text-xs text-zinc-500">
              Fit
              <select
                value={settings.fit}
                disabled={exporting}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, fit: e.target.value as SceneComposerSettings['fit'] }))
                }
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              >
                <option value="cover">Cover (crop)</option>
                <option value="contain">Contain (letterbox)</option>
              </select>
            </label>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Export length</h2>
            <label className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="radio"
                checked={settings.durationMode === 'audio'}
                disabled={exporting}
                onChange={() => setSettings((s) => ({ ...s, durationMode: 'audio' }))}
              />
              Match audio (pad with black if visuals are shorter)
            </label>
            <label className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="radio"
                checked={settings.durationMode === 'timeline'}
                disabled={exporting}
                onChange={() => setSettings((s) => ({ ...s, durationMode: 'timeline' }))}
              />
              Timeline only (clips + text)
            </label>
          </div>

          {selectedClip && (
            <div className="space-y-2 border-t border-zinc-800 pt-4">
              <h2 className="text-sm font-semibold text-zinc-200">Clip</h2>
              <p className="truncate text-xs text-zinc-500">{selectedClip.name}</p>
              <label className="block text-xs text-zinc-500">
                Duration (sec)
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={selectedClip.durationSec}
                  disabled={exporting}
                  onChange={(e) => updateClip(selectedClip.id, { durationSec: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                />
              </label>
              {selectedClip.kind === 'video' && (
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  <input
                    type="checkbox"
                    checked={selectedClip.loop}
                    disabled={exporting}
                    onChange={(e) => updateClip(selectedClip.id, { loop: e.target.checked })}
                  />
                  Loop video within clip
                </label>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={exporting}
                  onClick={() => moveClip(selectedClip.id, -1)}
                  className="flex-1 rounded-lg bg-zinc-800 py-2 text-xs text-zinc-300"
                >
                  Move earlier
                </button>
                <button
                  type="button"
                  disabled={exporting}
                  onClick={() => moveClip(selectedClip.id, 1)}
                  className="flex-1 rounded-lg bg-zinc-800 py-2 text-xs text-zinc-300"
                >
                  Move later
                </button>
              </div>
              <button
                type="button"
                disabled={exporting}
                onClick={() => removeClip(selectedClip.id)}
                className="w-full rounded-lg border border-red-900/50 py-2 text-xs text-red-300 hover:bg-red-950/30"
              >
                Remove clip
              </button>
            </div>
          )}

          {selectedText && (
            <div className="space-y-2 border-t border-zinc-800 pt-4">
              <h2 className="text-sm font-semibold text-zinc-200">Text</h2>
              <label className="block text-xs text-zinc-500">
                Content
                <textarea
                  value={selectedText.text}
                  disabled={exporting}
                  rows={3}
                  onChange={(e) => updateText(selectedText.id, { text: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs text-zinc-500">
                  Start (s)
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={selectedText.startSec}
                    disabled={exporting}
                    onChange={(e) => updateText(selectedText.id, { startSec: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block text-xs text-zinc-500">
                  End (s)
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={selectedText.endSec}
                    disabled={exporting}
                    onChange={(e) => updateText(selectedText.id, { endSec: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
              <label className="block text-xs text-zinc-500">
                Color
                <input
                  type="color"
                  value={selectedText.color}
                  disabled={exporting}
                  onChange={(e) => updateText(selectedText.id, { color: e.target.value })}
                  className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={selectedText.showBar}
                  disabled={exporting}
                  onChange={(e) => updateText(selectedText.id, { showBar: e.target.checked })}
                />
                Dark bar behind text
              </label>
              <button
                type="button"
                disabled={exporting}
                onClick={() => {
                  setTexts((prev) => prev.filter((t) => t.id !== selectedText.id))
                  setSelectedTextId(null)
                }}
                className="w-full rounded-lg border border-red-900/50 py-2 text-xs text-red-300 hover:bg-red-950/30"
              >
                Remove text
              </button>
            </div>
          )}

          <div className="border-t border-zinc-800 pt-4">
            <label className="block text-xs text-zinc-500">
              File name
              <input
                type="text"
                value={settings.exportFileName}
                disabled={exporting}
                onChange={(e) => setSettings((s) => ({ ...s, exportFileName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={settings.fastDraft}
                disabled={exporting}
                onChange={(e) => setSettings((s) => ({ ...s, fastDraft: e.target.checked }))}
              />
              Fast draft encode
            </label>
          </div>

          {exporting && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-400">{PHASE_LABEL[exportPhase]}</p>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-violet-500 transition-all"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>
          )}

          {!validation.ok && !exporting && (
            <p className="text-xs text-amber-400/90">{validation.message}</p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="button"
            disabled={!validation.ok || exporting}
            onClick={() => void runExport()}
            className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? 'Exporting…' : 'Export MP4'}
          </button>
        </aside>
      </div>
    </div>
  )
}
