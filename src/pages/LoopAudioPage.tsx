import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ToolPageHeader } from '../components/layout/ToolPageHeader'
import { exportLoopWithAudio } from '../lib/exportLoopWithAudio'
import { errorMessage } from '../lib/errorMessage'
import { formatDurationClock, getMediaDurationSec } from '../lib/mediaDuration'
import type { ExportPhase } from '../types'

const PHASE_LABEL: Record<ExportPhase, string> = {
  'loading-encoder': 'Loading encoder…',
  preparing: 'Preparing files…',
  encoding: 'Encoding video…',
}

function FilePicker({
  label,
  hint,
  accept,
  file,
  disabled,
  onFile,
}: {
  label: string
  hint: string
  accept: string
  file: File | null
  disabled?: boolean
  onFile: (file: File | null) => void
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-200">{label}</h2>
      <p className="text-xs text-zinc-500">{hint}</p>
      <div className="flex gap-2">
        <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-zinc-700 bg-zinc-950 px-3 py-3 text-center text-xs text-zinc-400 hover:border-zinc-500">
          {file ? file.name : 'Choose file'}
          <input
            type="file"
            accept={accept}
            disabled={disabled}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFile(f)
              e.target.value = ''
            }}
          />
        </label>
        {file && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onFile(null)}
            className="rounded-lg bg-zinc-800 px-3 text-xs text-zinc-300 hover:bg-zinc-700"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

export function LoopAudioPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [videoDurationSec, setVideoDurationSec] = useState<number | null>(null)
  const [audioDurationSec, setAudioDurationSec] = useState<number | null>(null)
  const [durationError, setDurationError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportPhase, setExportPhase] = useState<ExportPhase>('preparing')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fastDraft, setFastDraft] = useState(false)
  const [exportFileName, setExportFileName] = useState('episode')

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (!videoFile) {
      setVideoDurationSec(null)
      setVideoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      return
    }
    const url = URL.createObjectURL(videoFile)
    setVideoUrl(url)
    void getMediaDurationSec(videoFile)
      .then(setVideoDurationSec)
      .catch(() => setDurationError('Could not read video duration'))
    return () => URL.revokeObjectURL(url)
  }, [videoFile])

  useEffect(() => {
    if (!audioFile) {
      setAudioDurationSec(null)
      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      return
    }
    const url = URL.createObjectURL(audioFile)
    setAudioUrl(url)
    void getMediaDurationSec(audioFile)
      .then(setAudioDurationSec)
      .catch(() => setDurationError('Could not read audio duration'))
    return () => URL.revokeObjectURL(url)
  }, [audioFile])

  const loopCount = useMemo(() => {
    if (videoDurationSec == null || audioDurationSec == null || videoDurationSec <= 0) return null
    return Math.max(1, Math.ceil(audioDurationSec / videoDurationSec))
  }, [videoDurationSec, audioDurationSec])

  const ready = videoFile != null && audioFile != null && videoDurationSec != null && audioDurationSec != null

  const playPreview = useCallback(() => {
    const video = videoRef.current
    const audio = audioRef.current
    if (!video || !audio) return
    video.currentTime = 0
    audio.currentTime = 0
    void video.play()
    void audio.play()
  }, [])

  const stopPreview = useCallback(() => {
    videoRef.current?.pause()
    audioRef.current?.pause()
  }, [])

  const downloadBlob = (blob: Blob) => {
    const safeName = exportFileName.trim().replace(/[^\w.-]+/g, '_') || 'episode'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${safeName}.mp4`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const runExport = async () => {
    if (!videoFile || !audioFile) return
    setExporting(true)
    setError(null)
    setProgress(0)
    stopPreview()
    try {
      const blob = await exportLoopWithAudio(
        videoFile,
        audioFile,
        (p) => {
          setExportPhase(p.phase)
          setProgress(p.progress)
        },
        { fastDraft },
      )
      downloadBlob(blob)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-6">
      <ToolPageHeader
        title="Loop video + audio"
        description="Upload a short video loop and a voice track. The loop repeats until the audio ends, then exports an MP4 for YouTube."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <FilePicker
            label="Video loop"
            hint="Your ~1 min slideshow export or any short MP4/WebM loop. Original audio is ignored."
            accept="video/*"
            file={videoFile}
            disabled={exporting}
            onFile={(f) => {
              setDurationError(null)
              setVideoFile(f)
            }}
          />
          <FilePicker
            label="Voice / audio"
            hint="Phone recording, m4a, mp3, wav — length sets the final video."
            accept="audio/*"
            file={audioFile}
            disabled={exporting}
            onFile={(f) => {
              setDurationError(null)
              setAudioFile(f)
            }}
          />

          {ready && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300">
              <p>
                Loop <span className="text-white">{formatDurationClock(videoDurationSec!)}</span>
                {' · '}
                Audio <span className="text-white">{formatDurationClock(audioDurationSec!)}</span>
              </p>
              {loopCount != null && (
                <p className="mt-1 text-xs text-zinc-500">
                  Output length ≈ {formatDurationClock(audioDurationSec!)} ({loopCount}× loop
                  {loopCount > 1 ? 's' : ''}, trimmed to audio)
                </p>
              )}
            </div>
          )}
          {durationError && <p className="text-sm text-amber-400">{durationError}</p>}

          {videoUrl && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-zinc-200">Preview</h2>
              <p className="text-xs text-zinc-500">Muted loop plus your audio — timing check only.</p>
              <video
                ref={videoRef}
                src={videoUrl}
                loop
                muted
                playsInline
                className="w-full rounded-xl border border-zinc-800 bg-black"
              />
              {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!ready || exporting}
                  onClick={playPreview}
                  className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
                >
                  Play preview
                </button>
                <button
                  type="button"
                  disabled={exporting}
                  onClick={stopPreview}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-900"
                >
                  Stop
                </button>
              </div>
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
                disabled={exporting}
                onChange={(e) => setExportFileName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={fastDraft}
                disabled={exporting}
                onChange={(e) => setFastDraft(e.target.checked)}
              />
              Fast draft (smaller file, quicker encode)
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

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="button"
            disabled={!ready || exporting}
            onClick={() => void runExport()}
            className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? 'Exporting…' : 'Export MP4'}
          </button>
          <p className="text-xs text-zinc-600">
            Encoding runs in your browser. Long audio means a longer wait — keep this tab open.
          </p>
        </aside>
      </div>
    </div>
  )
}
