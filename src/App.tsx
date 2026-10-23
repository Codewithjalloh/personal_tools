import { useCallback, useMemo, useState } from 'react'
import { MusicUpload } from './components/MusicUpload'
import { SlidePreview } from './components/SlidePreview'
import { SlideStrip } from './components/SlideStrip'
import { TitleCardControls } from './components/TitleCardControls'
import { UploadZone } from './components/UploadZone'
import { useProjectPersistence } from './hooks/useProjectPersistence'
import { saveMusicToProject, type StoredProject } from './lib/projectStore'
import { useSlides } from './hooks/useSlides'
import { errorMessage } from './lib/errorMessage'
import { exportSlideshowMp4 } from './lib/exportMp4'
import { exportSlideshowWebm } from './lib/exportWebm'
import { mergeTitleCard, TEMPLATES, type TemplateId } from './lib/templates'
import {
  bookendDurationSec,
  computeSlideDurations,
  titleDurationSec,
  validateTimeline,
} from './lib/timeline'
import type { ExportPhase, ExportSettings, FitMode, TitleCardSettings } from './types'
import { DEFAULT_TITLE_CARD } from './types'

const DURATION_PRESETS = [
  { label: '15 sec', value: 15 },
  { label: '30 sec', value: 30 },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
]

const RESOLUTION_PRESETS = [
  { label: '720p (1280×720)', width: 1280, height: 720 },
  { label: '1080p (1920×1080)', width: 1920, height: 1080 },
  { label: 'Vertical 1080×1920', width: 1080, height: 1920 },
]

const PHASE_LABEL: Record<ExportPhase, string> = {
  'loading-encoder': 'Loading encoder…',
  preparing: 'Preparing images…',
  encoding: 'Encoding video…',
}

function App() {
  const {
    slides,
    adding,
    addFiles,
    removeSlide,
    moveSlide,
    setSlideDuration,
    clearAll,
    replaceSlides,
  } = useSlides()

  const [totalDurationSec, setTotalDurationSec] = useState(60)
  const [customDuration, setCustomDuration] = useState('')
  const [resolutionIndex, setResolutionIndex] = useState(1)
  const [fit, setFit] = useState<FitMode>('contain')
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4')
  const [autoplay, setAutoplay] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportPhase, setExportPhase] = useState<ExportPhase>('preparing')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [intro, setIntro] = useState<TitleCardSettings>({ ...DEFAULT_TITLE_CARD })
  const [outro, setOutro] = useState<TitleCardSettings>({ ...DEFAULT_TITLE_CARD })
  const [crossfadeSec, setCrossfadeSec] = useState(0.4)
  const [kenBurns, setKenBurns] = useState(false)
  const [fastDraft, setFastDraft] = useState(false)
  const [exportFileName, setExportFileName] = useState('slideshow')
  const [musicFile, setMusicFile] = useState<File | null>(null)
  const [templateId, setTemplateId] = useState<TemplateId>('custom')

  const handleRestore = useCallback(
    ({
      slides: restoredSlides,
      musicFile: restoredMusic,
      meta,
    }: {
      slides: typeof slides
      musicFile: File | null
      meta: StoredProject
    }) => {
      replaceSlides(restoredSlides)
      setTotalDurationSec(meta.totalDurationSec)
      setResolutionIndex(meta.resolutionIndex)
      setFit(meta.fit)
      setFormat(meta.format)
      setIntro(meta.intro)
      setOutro(meta.outro)
      setCrossfadeSec(meta.crossfadeSec)
      setKenBurns(meta.kenBurns)
      setExportFileName(meta.exportFileName)
      setTemplateId(meta.templateId as TemplateId)
      setMusicFile(restoredMusic)
    },
    [replaceSlides],
  )

  useProjectPersistence({
    slides,
    musicFile,
    totalDurationSec,
    resolutionIndex,
    fit,
    format,
    intro,
    outro,
    crossfadeSec,
    kenBurns,
    exportFileName,
    templateId,
    onRestore: handleRestore,
  })

  const settings: ExportSettings = useMemo(() => {
    const res = RESOLUTION_PRESETS[resolutionIndex]
    return {
      totalDurationSec,
      width: res.width,
      height: res.height,
      fit,
      format,
      intro,
      outro,
      crossfadeSec,
      kenBurns,
      fastDraft,
      exportFileName,
      musicFile,
    }
  }, [
    totalDurationSec,
    resolutionIndex,
    fit,
    format,
    intro,
    outro,
    crossfadeSec,
    kenBurns,
    fastDraft,
    exportFileName,
    musicFile,
  ])

  const timelineValidation = useMemo(
    () => validateTimeline(slides, totalDurationSec, intro, outro),
    [slides, totalDurationSec, intro, outro],
  )

  const slideDurations = useMemo(
    () => computeSlideDurations(slides, totalDurationSec, intro, outro),
    [slides, totalDurationSec, intro, outro],
  )

  const applyTemplate = (id: TemplateId) => {
    const t = TEMPLATES.find((x) => x.id === id)
    if (!t) return
    setTemplateId(id)
    if (id === 'custom') return
    setTotalDurationSec(t.totalDurationSec)
    setResolutionIndex(t.resolutionIndex)
    setFit(t.fit)
    setIntro(mergeTitleCard(t.intro))
    setOutro(mergeTitleCard(t.outro))
    setCrossfadeSec(t.crossfadeSec)
    setKenBurns(t.kenBurns)
    setCustomDuration('')
  }

  const applyFastDraft = () => {
    setResolutionIndex(0)
    setFormat('mp4')
    setFastDraft(true)
    setTotalDurationSec((d) => Math.min(d, 30))
  }

  const handleMusic = async (file: File | null) => {
    setMusicFile(file)
    await saveMusicToProject(file)
  }

  const handleExport = useCallback(async () => {
    if (!timelineValidation.ok) {
      setError(timelineValidation.message)
      return
    }
    setError(null)
    setExporting(true)
    setProgress(0)
    setExportPhase('loading-encoder')

    const onProgress = ({ phase, progress: p }: { phase: ExportPhase; progress: number }) => {
      setExportPhase(phase)
      setProgress(p)
    }

    try {
      const blob =
        format === 'mp4'
          ? await exportSlideshowMp4(slides, settings, onProgress)
          : await exportSlideshowWebm(slides, settings, onProgress)

      const safeName = exportFileName.trim().replace(/[^\w\-]+/g, '-') || 'slideshow'
      const ext = format === 'mp4' ? 'mp4' : 'webm'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${safeName}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      setFastDraft(false)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setExporting(false)
    }
  }, [slides, settings, format, exportFileName, timelineValidation])

  const bookends = bookendDurationSec(intro, outro)

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Image Slideshow → Video
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Upload photos, add intro/outro titles, optional music, then export — all in your browser.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <UploadZone onFiles={(f) => void addFiles(f)} disabled={exporting || adding} />
          {adding && <p className="text-sm text-zinc-500">Optimizing images…</p>}
          <SlideStrip
            slides={slides}
            onRemove={removeSlide}
            onMove={moveSlide}
            onDuration={setSlideDuration}
          />
          <SlidePreview
            slides={slides}
            totalDurationSec={totalDurationSec}
            fit={fit}
            autoplay={autoplay}
            intro={intro}
            outro={outro}
          />
        </div>

        <aside className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 h-fit lg:sticky lg:top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Template</h2>
            <select
              value={templateId}
              onChange={(e) => applyTemplate(e.target.value as TemplateId)}
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <TitleCardControls label="Intro" card={intro} onChange={setIntro} disabled={exporting} />
          <TitleCardControls label="Outro" card={outro} onChange={setOutro} disabled={exporting} />

          <MusicUpload file={musicFile} onFile={(f) => void handleMusic(f)} disabled={exporting} />

          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Video length</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {DURATION_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setTotalDurationSec(p.value)
                    setCustomDuration('')
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    totalDurationSec === p.value && !customDuration
                      ? 'bg-violet-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <label className="mt-3 block text-xs text-zinc-500">
              Custom (seconds)
              <input
                type="number"
                min={5}
                max={600}
                value={customDuration}
                placeholder={String(totalDurationSec)}
                onChange={(e) => {
                  setCustomDuration(e.target.value)
                  const n = Number(e.target.value)
                  if (n >= 5 && n <= 600) setTotalDurationSec(n)
                }}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
              />
            </label>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Resolution</h2>
            <select
              value={resolutionIndex}
              onChange={(e) => setResolutionIndex(Number(e.target.value))}
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            >
              {RESOLUTION_PRESETS.map((r, i) => (
                <option key={r.label} value={i}>
                  {r.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyFastDraft}
              className="mt-2 w-full rounded-lg border border-amber-700/50 bg-amber-950/30 py-2 text-xs text-amber-200 hover:bg-amber-950/50"
            >
              Fast draft — 720p · 30s max · quick MP4
            </button>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Effects</h2>
            <label className="mt-2 block text-xs text-zinc-500">
              Crossfade ({crossfadeSec.toFixed(1)}s)
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={crossfadeSec}
                onChange={(e) => setCrossfadeSec(Number(e.target.value))}
                className="mt-1 w-full"
              />
            </label>
            <label className="mt-2 flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={kenBurns}
                onChange={(e) => setKenBurns(e.target.checked)}
              />
              Ken Burns (slow zoom)
            </label>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Fit & format</h2>
            <div className="mt-2 flex gap-2">
              {(['contain', 'cover'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFit(m)}
                  className={`flex-1 rounded-lg py-2 text-sm capitalize ${
                    fit === m ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              {(['mp4', 'webm'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`flex-1 rounded-lg py-2 text-sm uppercase ${
                    format === f ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-xs text-zinc-500">
            Download filename
            <input
              value={exportFileName}
              onChange={(e) => setExportFileName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(e) => setAutoplay(e.target.checked)}
            />
            Autoplay preview
          </label>

          {slides.length > 0 && (
            <div className="space-y-2 rounded-lg bg-zinc-950 px-3 py-2 text-sm text-zinc-400">
              {bookends > 0 && (
                <p>
                  Bookends:{' '}
                  {titleDurationSec(intro) > 0 && `${intro.durationSec}s intro`}
                  {titleDurationSec(intro) > 0 && titleDurationSec(outro) > 0 && ' + '}
                  {titleDurationSec(outro) > 0 && `${outro.durationSec}s outro`}
                </p>
              )}
              <p>
                Slides:{' '}
                {slideDurations.map((d, i) => `${i + 1}:${d.toFixed(1)}s`).join(' · ')}
              </p>
              {!timelineValidation.ok && (
                <p className="text-amber-300">{timelineValidation.message}</p>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          {exporting && (
            <div>
              <p className="text-xs text-violet-300">{PHASE_LABEL[exportPhase]}</p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-violet-500 transition-all duration-300"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-zinc-500">{Math.round(progress * 100)}%</p>
            </div>
          )}

          <button
            type="button"
            disabled={exporting || slides.length === 0 || !timelineValidation.ok}
            onClick={() => void handleExport()}
            className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {exporting ? 'Working…' : 'Download video'}
          </button>

          {slides.length > 0 && (
            <button
              type="button"
              disabled={exporting}
              onClick={clearAll}
              className="w-full text-sm text-zinc-500 hover:text-zinc-300"
            >
              Clear all images
            </button>
          )}
        </aside>
      </div>
    </div>
  )
}

export default App
