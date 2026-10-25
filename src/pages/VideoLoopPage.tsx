import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LoopMotionPicker } from '../components/LoopMotionPicker'
import { TitleCardControls } from '../components/TitleCardControls'
import { ToolPageHeader } from '../components/layout/ToolPageHeader'
import { loadImageElement } from '../lib/drawFrame'
import { drawMotionTimeline } from '../lib/loopMotionBlend'
import { normalizeMotionSelection, type LoopMotionStyle } from '../lib/loopMotion'
import {
  buildLoopSourceFromImageFile,
  buildLoopSourceFromText,
  remoteBlobToSourceVideo,
} from '../lib/buildLoopSourceVideo'
import { exportLoopedVideo } from '../lib/exportLoopedVideo'
import { errorMessage } from '../lib/errorMessage'
import { fetchRemoteMedia } from '../lib/fetchRemoteMedia'
import { formatDurationClock, getMediaDurationSec } from '../lib/mediaDuration'
import { apiSearchImages } from '../lib/youtubeIdeas/api'
import type { ImageAsset } from '../../shared/youtubeIdeas/types'
import type { ExportPhase, FitMode, TitleCardSettings } from '../types'
import { DEFAULT_TITLE_CARD } from '../types'

const MIN_DURATION_SEC = 10
const MAX_DURATION_SEC = 60
const DEFAULT_SOURCE_CLIP_SEC = 4

const DURATION_PRESETS = [
  { label: '10 sec', value: 10 },
  { label: '15 sec', value: 15 },
  { label: '30 sec', value: 30 },
  { label: '45 sec', value: 45 },
  { label: '1 min', value: 60 },
]

const PHASE_LABEL: Record<ExportPhase, string> = {
  'loading-encoder': 'Loading encoder…',
  preparing: 'Preparing files…',
  encoding: 'Encoding video…',
}

type SourceMode = 'video' | 'image' | 'text' | 'online'

const SOURCE_TABS: { id: SourceMode; label: string }[] = [
  { id: 'online', label: 'Online' },
  { id: 'image', label: 'Image' },
  { id: 'text', label: 'Text' },
  { id: 'video', label: 'Video file' },
]

export function VideoLoopPage() {
  const [sourceMode, setSourceMode] = useState<SourceMode>('online')

  const [sourceVideoFile, setSourceVideoFile] = useState<File | null>(null)
  const [sourceDurationSec, setSourceDurationSec] = useState<number | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [sourceIncludeAudio, setSourceIncludeAudio] = useState(false)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [fit, setFit] = useState<FitMode>('cover')
  const [motionStyles, setMotionStyles] = useState<LoopMotionStyle[]>(['sway'])
  const [sourceClipSec, setSourceClipSec] = useState(DEFAULT_SOURCE_CLIP_SEC)

  const [textCard, setTextCard] = useState<TitleCardSettings>({
    ...DEFAULT_TITLE_CARD,
    text: '',
    animation: 'fade-up',
    durationSec: DEFAULT_SOURCE_CLIP_SEC,
  })

  const [onlineUrl, setOnlineUrl] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<ImageAsset[]>([])
  const [searchWarning, setSearchWarning] = useState<string | null>(null)
  const [selectedOnlineImage, setSelectedOnlineImage] = useState<ImageAsset | null>(null)

  const [targetDurationSec, setTargetDurationSec] = useState(30)
  const [durationError, setDurationError] = useState<string | null>(null)
  const [includeAudio, setIncludeAudio] = useState(true)
  const [fastDraft, setFastDraft] = useState(false)
  const [exportFileName, setExportFileName] = useState('video-loop')

  const [buildingSource, setBuildingSource] = useState(false)
  const [sourcePhase, setSourcePhase] = useState<ExportPhase>('preparing')
  const [sourceProgress, setSourceProgress] = useState(0)
  const [sourceBuildError, setSourceBuildError] = useState<string | null>(null)

  const [generating, setGenerating] = useState(false)
  const [exportPhase, setExportPhase] = useState<ExportPhase>('preparing')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const sourceVideoRef = useRef<HTMLVideoElement>(null)
  const timingCanvasRef = useRef<HTMLCanvasElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const timingPreviewRef = useRef<number | null>(null)

  const clearSourceVideo = useCallback(() => {
    setSourceVideoFile(null)
    setSourceDurationSec(null)
    setSourceIncludeAudio(false)
    setSourceUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }, [])

  const applySourceFile = useCallback((file: File, includeSourceAudio: boolean) => {
    clearSourceVideo()
    setSourceVideoFile(file)
    setSourceIncludeAudio(includeSourceAudio)
    const url = URL.createObjectURL(file)
    setSourceUrl(url)
    void getMediaDurationSec(file)
      .then(setSourceDurationSec)
      .catch(() => setDurationError('Could not read video duration'))
  }, [clearSourceVideo])

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    }
  }, [sourceUrl])

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      return
    }
    const url = URL.createObjectURL(imageFile)
    setImagePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  useEffect(() => {
    setPreviewBlob(null)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setError(null)
  }, [sourceVideoFile, targetDurationSec, includeAudio, fastDraft, motionStyles])

  const effectiveClipSec = sourceMode === 'text' ? textCard.durationSec : sourceClipSec

  const normalizedMotions = useMemo(() => normalizeMotionSelection(motionStyles), [motionStyles])
  const multiMotion = normalizedMotions.length > 1
  const motionSegmentSec = multiMotion ? targetDurationSec / normalizedMotions.length : effectiveClipSec

  const stillPreviewUrl = useMemo(() => {
    if (sourceMode === 'image' && imagePreviewUrl) return imagePreviewUrl
    if (sourceMode === 'online' && selectedOnlineImage?.url) return selectedOnlineImage.url
    return null
  }, [sourceMode, imagePreviewUrl, selectedOnlineImage?.url])

  const canvasTimingPreview = stillPreviewUrl != null

  const loopCount = useMemo(() => {
    if (sourceDurationSec == null || sourceDurationSec <= 0) return null
    return Math.max(1, Math.ceil(targetDurationSec / sourceDurationSec))
  }, [sourceDurationSec, targetDurationSec])

  const ready = sourceVideoFile != null && sourceDurationSec != null
  const busy = buildingSource || generating
  const canIncludeAudio = sourceIncludeAudio

  const previewCycleSec = multiMotion ? targetDurationSec : effectiveClipSec

  const drawTimingFrame = useCallback(
    (ctx: CanvasRenderingContext2D, img: HTMLImageElement, elapsedSec: number) => {
      drawMotionTimeline(ctx, img, 1280, 720, fit, elapsedSec, normalizedMotions, previewCycleSec)
    },
    [fit, normalizedMotions, previewCycleSec],
  )

  useEffect(() => {
    if (!canvasTimingPreview || !stillPreviewUrl) return
    const canvas = timingCanvasRef.current
    if (!canvas) return
    void loadImageElement(stillPreviewUrl).then((img) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = 1280
      canvas.height = 720
      drawTimingFrame(ctx, img, 0)
    })
  }, [canvasTimingPreview, stillPreviewUrl, drawTimingFrame])

  const buildClipDurationSec = multiMotion ? targetDurationSec : effectiveClipSec

  const buildOptions = useMemo(
    () => ({
      clipDurationSec: buildClipDurationSec,
      fit,
      motions: normalizedMotions,
      fastDraft,
    }),
    [buildClipDurationSec, fit, normalizedMotions, fastDraft],
  )

  const runBuildSource = async (
    runner: () => Promise<{ file: File; includeSourceAudio: boolean }>,
  ) => {
    setBuildingSource(true)
    setSourceBuildError(null)
    setSourceProgress(0)
    clearSourceVideo()
    try {
      const { file, includeSourceAudio } = await runner()
      applySourceFile(file, includeSourceAudio)
    } catch (cause) {
      setSourceBuildError(errorMessage(cause))
    } finally {
      setBuildingSource(false)
    }
  }

  const onSourceProgress = (p: { phase: ExportPhase; progress: number }) => {
    setSourcePhase(p.phase)
    setSourceProgress(p.progress)
  }

  const buildFromImage = () => {
    if (!imageFile) return
    void runBuildSource(async () => ({
      file: await buildLoopSourceFromImageFile(imageFile, onSourceProgress, buildOptions),
      includeSourceAudio: false,
    }))
  }

  const buildFromText = () => {
    void runBuildSource(async () => ({
      file: await buildLoopSourceFromText(
        textCard,
        onSourceProgress,
        buildOptions,
      ),
      includeSourceAudio: false,
    }))
  }

  const loadOnlineUrl = () => {
    void runBuildSource(async () => {
      const { blob, mime } = await fetchRemoteMedia(onlineUrl)
      return remoteBlobToSourceVideo(blob, mime, onlineUrl, onSourceProgress, buildOptions)
    })
  }

  const buildFromOnlineSelection = () => {
    if (!selectedOnlineImage) return
    const asset = selectedOnlineImage
    void runBuildSource(async () => {
      const { blob, mime } = await fetchRemoteMedia(asset.url)
      return remoteBlobToSourceVideo(blob, mime, asset.url, onSourceProgress, buildOptions)
    })
  }

  const runImageSearch = async () => {
    const q = searchQuery.trim()
    if (!q) return
    setSearching(true)
    setSearchWarning(null)
    setSearchResults([])
    try {
      const res = await apiSearchImages([q], 12)
      setSearchResults(res.images)
      if (res.warning) setSearchWarning(res.warning)
      if (!res.pexelsConfigured) {
        setSearchWarning('Add a Pexels API key in Research Studio → Settings, or paste a direct image URL above.')
      }
    } catch (cause) {
      setSearchWarning(errorMessage(cause))
    } finally {
      setSearching(false)
    }
  }

  const onVideoFileChosen = (file: File) => {
    setDurationError(null)
    clearSourceVideo()
    applySourceFile(file, true)
  }

  const switchSourceMode = (mode: SourceMode) => {
    setSourceMode(mode)
    clearSourceVideo()
    setSourceBuildError(null)
    setDurationError(null)
  }

  const stopTimingPreview = useCallback(() => {
    if (timingPreviewRef.current != null) {
      cancelAnimationFrame(timingPreviewRef.current)
      timingPreviewRef.current = null
    }
    sourceVideoRef.current?.pause()
  }, [])

  const playTimingPreview = useCallback(() => {
    stopTimingPreview()

    if (canvasTimingPreview && stillPreviewUrl) {
      const canvas = timingCanvasRef.current
      if (!canvas) return
      void loadImageElement(stillPreviewUrl).then((img) => {
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const w = 1280
        const h = 720
        canvas.width = w
        canvas.height = h
        const startWall = performance.now()
        const tick = () => {
          const elapsedSec = (performance.now() - startWall) / 1000
          if (elapsedSec >= targetDurationSec) {
            timingPreviewRef.current = null
            return
          }
          drawTimingFrame(ctx, img, elapsedSec)
          timingPreviewRef.current = requestAnimationFrame(tick)
        }
        timingPreviewRef.current = requestAnimationFrame(tick)
      })
      return
    }

    const video = sourceVideoRef.current
    if (!video) return
    video.currentTime = 0
    video.muted = !includeAudio || !canIncludeAudio
    void video.play()
    const startWall = performance.now()
    const tick = () => {
      if (performance.now() - startWall >= targetDurationSec * 1000) {
        video.pause()
        timingPreviewRef.current = null
        return
      }
      timingPreviewRef.current = requestAnimationFrame(tick)
    }
    timingPreviewRef.current = requestAnimationFrame(tick)
  }, [
    canvasTimingPreview,
    canIncludeAudio,
    drawTimingFrame,
    includeAudio,
    stillPreviewUrl,
    stopTimingPreview,
    targetDurationSec,
  ])

  const timingPreviewReady = canvasTimingPreview || ready

  const generatePreview = async () => {
    if (!sourceVideoFile) return
    setGenerating(true)
    setError(null)
    setProgress(0)
    stopTimingPreview()
    previewVideoRef.current?.pause()
    try {
      const blob = await exportLoopedVideo(
        sourceVideoFile,
        targetDurationSec,
        (p) => {
          setExportPhase(p.phase)
          setProgress(p.progress)
        },
        {
          fastDraft,
          includeAudio: canIncludeAudio && includeAudio,
          sourceDurationSec: sourceDurationSec ?? undefined,
        },
      )
      setPreviewBlob(blob)
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(blob)
      })
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setGenerating(false)
    }
  }

  const downloadPreview = () => {
    if (!previewBlob) return
    const safeName = exportFileName.trim().replace(/[^\w.-]+/g, '_') || 'video-loop'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(previewBlob)
    a.download = `${safeName}.mp4`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-6">
      <ToolPageHeader
        title="Video loop builder"
        description="Start from an online image, your own image, text, or a video clip. Build a short loop source, stretch it to 10 sec–1 min, review, then download."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200">Source loop</h2>
            <div className="flex flex-wrap gap-2">
              {SOURCE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  disabled={busy}
                  onClick={() => switchSourceMode(tab.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    sourceMode === tab.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {sourceMode === 'online' && (
              <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <LoopMotionPicker
                  value={motionStyles}
                  onChange={setMotionStyles}
                  disabled={busy}
                  segmentDurationSec={motionSegmentSec}
                  onApplyMixPreset={() => setTargetDurationSec(60)}
                />
                <div>
                  <p className="text-xs text-zinc-500">Paste a direct link to an image or short video (MP4/WebM).</p>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="url"
                      value={onlineUrl}
                      disabled={busy}
                      placeholder="https://…"
                      onChange={(e) => setOnlineUrl(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                    />
                    <button
                      type="button"
                      disabled={busy || !onlineUrl.trim()}
                      onClick={loadOnlineUrl}
                      className="shrink-0 rounded-lg bg-zinc-800 px-4 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
                    >
                      Load
                    </button>
                  </div>
                </div>
                <div className="border-t border-zinc-800 pt-4">
                  <p className="text-xs text-zinc-500">Or search stock photos (Pexels — key in Research Studio settings).</p>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="search"
                      value={searchQuery}
                      disabled={busy}
                      placeholder="e.g. ocean waves, city night"
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void runImageSearch()
                      }}
                      className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                    />
                    <button
                      type="button"
                      disabled={busy || searching || !searchQuery.trim()}
                      onClick={() => void runImageSearch()}
                      className="shrink-0 rounded-lg bg-zinc-800 px-4 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
                    >
                      {searching ? '…' : 'Search'}
                    </button>
                  </div>
                  {searchWarning && <p className="mt-2 text-xs text-amber-400">{searchWarning}</p>}
                  {searchResults.length > 0 && (
                    <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {searchResults.map((img) => (
                        <li key={img.url}>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setSelectedOnlineImage(img)}
                            className={`block w-full overflow-hidden rounded-lg border ${
                              selectedOnlineImage?.url === img.url
                                ? 'border-violet-500 ring-2 ring-violet-500/40'
                                : 'border-zinc-800 hover:border-zinc-600'
                            }`}
                          >
                            <img src={img.url} alt={img.alt} className="aspect-video w-full object-cover" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {selectedOnlineImage && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={buildFromOnlineSelection}
                      className="mt-3 w-full rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                    >
                      Build source clip
                    </button>
                  )}
                </div>
              </div>
            )}

            {sourceMode === 'image' && (
              <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <label className="block cursor-pointer rounded-lg border border-dashed border-zinc-700 bg-zinc-950 px-3 py-3 text-center text-xs text-zinc-400 hover:border-zinc-500">
                  {imageFile ? imageFile.name : 'Choose JPG or PNG'}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={busy}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) setImageFile(f)
                      e.target.value = ''
                    }}
                  />
                </label>
                {imagePreviewUrl && (
                  <img src={imagePreviewUrl} alt="" className="max-h-48 w-full rounded-lg object-contain bg-black" />
                )}
                <LoopMotionPicker
                  value={motionStyles}
                  onChange={setMotionStyles}
                  disabled={busy}
                  segmentDurationSec={motionSegmentSec}
                  onApplyMixPreset={() => setTargetDurationSec(60)}
                />
                <label className="block text-xs text-zinc-400">
                  Fit
                  <select
                    value={fit}
                    disabled={busy}
                    onChange={(e) => setFit(e.target.value as FitMode)}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  >
                    <option value="cover">Cover (fill frame)</option>
                    <option value="contain">Contain (letterbox)</option>
                  </select>
                </label>
                <button
                  type="button"
                  disabled={busy || !imageFile}
                  onClick={buildFromImage}
                  className="w-full rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  Build source clip
                </button>
              </div>
            )}

            {sourceMode === 'text' && (
              <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <TitleCardControls
                  label="Loop text"
                  card={textCard}
                  disabled={busy}
                  onChange={setTextCard}
                />
                <button
                  type="button"
                  disabled={busy || !textCard.text.trim()}
                  onClick={buildFromText}
                  className="w-full rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  Build source clip
                </button>
              </div>
            )}

            {sourceMode === 'video' && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-xs text-zinc-500">Upload an existing short loop (MP4/WebM).</p>
                <div className="mt-2 flex gap-2">
                  <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-zinc-700 bg-zinc-950 px-3 py-3 text-center text-xs text-zinc-400 hover:border-zinc-500">
                    {sourceVideoFile && sourceMode === 'video' ? sourceVideoFile.name : 'Choose video'}
                    <input
                      type="file"
                      accept="video/*"
                      disabled={busy}
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) onVideoFileChosen(f)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {sourceVideoFile && sourceMode === 'video' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={clearSourceVideo}
                      className="rounded-lg bg-zinc-800 px-3 text-xs text-zinc-300 hover:bg-zinc-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )}

            {sourceMode !== 'text' && sourceMode !== 'video' && !multiMotion && (
              <label className="block text-xs text-zinc-400">
                Source clip length ({2}–{10} sec) — one repeat before extending
                <input
                  type="range"
                  min={2}
                  max={10}
                  step={1}
                  disabled={busy}
                  value={sourceClipSec}
                  onChange={(e) => setSourceClipSec(Number(e.target.value))}
                  className="mt-2 w-full accent-violet-500"
                />
                <span className="mt-1 block text-sm text-white">{sourceClipSec} sec</span>
              </label>
            )}

            {sourceMode !== 'text' && sourceMode !== 'video' && multiMotion && (
              <p className="text-xs text-violet-300/90">
                Multiple motions: source is built for the full output length ({formatDurationClock(targetDurationSec)}),
                split evenly — best at 1 min with the mix preset.
              </p>
            )}

            {buildingSource && (
              <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                <p className="text-xs text-zinc-400">Building source… {PHASE_LABEL[sourcePhase]}</p>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${Math.round(sourceProgress * 100)}%` }}
                  />
                </div>
              </div>
            )}
            {sourceBuildError && <p className="text-sm text-red-400">{sourceBuildError}</p>}
            {ready && (
              <p className="text-xs text-emerald-400/90">
                Source ready · {formatDurationClock(sourceDurationSec!)} per loop
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200">Output length</h2>
            <p className="text-xs text-zinc-500">Between {MIN_DURATION_SEC} sec and 1 minute.</p>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  disabled={busy}
                  onClick={() => setTargetDurationSec(preset.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    targetDurationSec === preset.value
                      ? 'bg-violet-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <label className="block text-xs text-zinc-400">
              Custom ({MIN_DURATION_SEC}–{MAX_DURATION_SEC} sec)
              <input
                type="range"
                min={MIN_DURATION_SEC}
                max={MAX_DURATION_SEC}
                step={1}
                disabled={busy}
                value={targetDurationSec}
                onChange={(e) => setTargetDurationSec(Number(e.target.value))}
                className="mt-2 w-full accent-violet-500"
              />
              <span className="mt-1 block text-sm text-white">{formatDurationClock(targetDurationSec)}</span>
            </label>
          </div>

          {ready && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300">
              <p>
                Source <span className="text-white">{formatDurationClock(sourceDurationSec!)}</span>
                {' → '}
                Output <span className="text-white">{formatDurationClock(targetDurationSec)}</span>
              </p>
              {loopCount != null && (
                <p className="mt-1 text-xs text-zinc-500">
                  About {loopCount}× repeat{loopCount > 1 ? 's' : ''} of your clip
                </p>
              )}
            </div>
          )}
          {durationError && <p className="text-sm text-amber-400">{durationError}</p>}

          {(sourceUrl || canvasTimingPreview) && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-zinc-200">Quick timing check</h2>
              <p className="text-xs text-zinc-500">
                {canvasTimingPreview
                  ? 'Live motion preview on your image — try styles above, then build source when it looks right.'
                  : 'Plays your source on repeat for the target length — not the final encode.'}
              </p>
              {canvasTimingPreview ? (
                <canvas
                  ref={timingCanvasRef}
                  className="aspect-video w-full rounded-xl border border-zinc-800 bg-black"
                />
              ) : (
                <video
                  ref={sourceVideoRef}
                  src={sourceUrl ?? undefined}
                  loop
                  playsInline
                  className="w-full rounded-xl border border-zinc-800 bg-black"
                />
              )}
              {canvasTimingPreview && (
                <LoopMotionPicker
                  value={motionStyles}
                  onChange={setMotionStyles}
                  disabled={busy}
                  segmentDurationSec={motionSegmentSec}
                  onApplyMixPreset={() => setTargetDurationSec(60)}
                />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!timingPreviewReady || busy}
                  onClick={playTimingPreview}
                  className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
                >
                  Play {formatDurationClock(targetDurationSec)}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={stopTimingPreview}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-900"
                >
                  Stop
                </button>
              </div>
            </div>
          )}

          {previewUrl && (
            <div className="space-y-2 rounded-xl border border-violet-900/50 bg-violet-950/20 p-4">
              <h2 className="text-sm font-semibold text-violet-200">Review before download</h2>
              <p className="text-xs text-zinc-500">This is the encoded MP4. Download only when it looks right.</p>
              <video
                ref={previewVideoRef}
                src={previewUrl}
                controls
                playsInline
                className="w-full rounded-xl border border-zinc-800 bg-black"
              />
            </div>
          )}
        </div>

        <aside className="h-fit space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 lg:sticky lg:top-6">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Export</h2>
            <label className="mt-2 block text-xs text-zinc-500">
              File name
              <input
                type="text"
                value={exportFileName}
                disabled={busy}
                onChange={(e) => setExportFileName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
              />
            </label>
            {canIncludeAudio && (
              <label className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={includeAudio}
                  disabled={busy}
                  onChange={(e) => setIncludeAudio(e.target.checked)}
                />
                Include audio from source (loops with video)
              </label>
            )}
            <label className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={fastDraft}
                disabled={busy}
                onChange={(e) => setFastDraft(e.target.checked)}
              />
              Fast draft (smaller file, quicker encode)
            </label>
          </div>

          {generating && (
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

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="button"
            disabled={!ready || busy}
            onClick={() => void generatePreview()}
            className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? 'Generating preview…' : previewBlob ? 'Regenerate preview' : 'Generate preview'}
          </button>

          <button
            type="button"
            disabled={!previewBlob || busy}
            onClick={downloadPreview}
            className="w-full rounded-xl border border-violet-500/60 py-3 text-sm font-semibold text-violet-200 hover:bg-violet-950/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download MP4
          </button>

          <p className="text-xs text-zinc-600">
            Build a source first, then generate a preview. Online images need a fetchable URL; use Pexels search or paste a direct link.
          </p>
        </aside>
      </div>
    </div>
  )
}
