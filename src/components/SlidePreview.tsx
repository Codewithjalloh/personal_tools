import { useEffect, useMemo, useState } from 'react'
import type { FitMode, SlideItem, TitleCardSettings } from '../types'
import { computeSlideDurations, getFrameAtTime } from '../lib/timeline'

type Props = {
  slides: SlideItem[]
  totalDurationSec: number
  fit: FitMode
  autoplay: boolean
  intro: TitleCardSettings
  outro: TitleCardSettings
}

function overlayPositionClass(position: TitleCardSettings['position']) {
  if (position === 'top') return 'items-start pt-[10%]'
  if (position === 'bottom') return 'items-end pb-[10%]'
  return 'items-center'
}

function TitleOverlay({ card }: { card: TitleCardSettings }) {
  const text = card.text.trim()
  if (!text) return null
  const fontSize = `clamp(1rem, ${3.5 * card.fontScale}vw, ${2.5 * card.fontScale}rem)`

  return (
    <div
      className={`pointer-events-none absolute inset-0 flex justify-center px-[8%] text-center ${overlayPositionClass(card.position)}`}
    >
      <p
        className={`max-w-full font-semibold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] ${
          card.showBar ? 'rounded-lg bg-black/45 px-4 py-3 backdrop-blur-sm' : ''
        }`}
        style={{
          color: card.color,
          fontSize,
          WebkitTextStroke: '1px rgba(0,0,0,0.35)',
        }}
      >
        {text}
      </p>
    </div>
  )
}

export function SlidePreview({
  slides,
  totalDurationSec,
  fit,
  autoplay,
  intro,
  outro,
}: Props) {
  const [playbackT, setPlaybackT] = useState(0)
  const [manualIndex, setManualIndex] = useState(0)
  const [manualMode, setManualMode] = useState(false)

  useEffect(() => {
    setPlaybackT(0)
    setManualIndex(0)
    setManualMode(false)
  }, [slides.length, totalDurationSec, intro.text, outro.text])

  const avgSlide = useMemo(() => {
    if (slides.length === 0) return 0
    const durs = computeSlideDurations(slides, totalDurationSec, intro, outro)
    return durs.reduce((a, b) => a + b, 0) / durs.length
  }, [slides, totalDurationSec, intro, outro])

  const frame = useMemo(() => {
    if (manualMode) {
      const last = slides.length - 1
      let overlay: 'intro' | 'outro' | null = null
      if (manualIndex === 0 && intro.text.trim()) overlay = 'intro'
      if (manualIndex === last && outro.text.trim()) overlay = 'outro'
      return { slideIndex: manualIndex, overlay }
    }
    return getFrameAtTime(playbackT, slides, totalDurationSec, intro, outro)
  }, [manualMode, manualIndex, playbackT, slides, totalDurationSec, intro, outro])

  useEffect(() => {
    if (!autoplay || slides.length === 0 || manualMode) return
    const id = window.setInterval(() => {
      setPlaybackT((t) => t + 0.25)
    }, 250)
    return () => clearInterval(id)
  }, [autoplay, slides.length, manualMode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (slides.length === 0) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'ArrowLeft') {
        setManualMode(true)
        setManualIndex((i) => (i - 1 + slides.length) % slides.length)
      }
      if (e.key === 'ArrowRight') {
        setManualMode(true)
        setManualIndex((i) => (i + 1) % slides.length)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length])

  if (slides.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 text-zinc-500">
        Upload images to preview your slideshow
      </div>
    )
  }

  const current = slides[frame.slideIndex]
  const objectFit = fit === 'cover' ? 'object-cover' : 'object-contain'
  const overlayCard =
    frame.overlay === 'intro' ? intro : frame.overlay === 'outro' ? outro : null

  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/40 ring-1 ring-zinc-800">
        <img
          key={current.id}
          src={current.url}
          alt={current.name}
          className={`h-full w-full ${objectFit}`}
        />
        {overlayCard && <TitleOverlay card={overlayCard} />}
        <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs text-zinc-200 backdrop-blur">
          {frame.slideIndex + 1} / {slides.length}
          {frame.overlay === 'intro' && ` · intro ${intro.durationSec}s`}
          {frame.overlay === 'outro' && ` · outro ${outro.durationSec}s`}
          {!frame.overlay && ` · ~${avgSlide.toFixed(1)}s`}
        </div>
      </div>
      <p className="text-center text-xs text-zinc-500">Tip: ← → keys to step slides</p>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700 disabled:opacity-40"
          disabled={slides.length <= 1}
          onClick={() => {
            setManualMode(true)
            setManualIndex((i) => (i - 1 + slides.length) % slides.length)
          }}
        >
          Previous
        </button>
        <button
          type="button"
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
          onClick={() => {
            setManualMode(false)
            setPlaybackT(0)
          }}
        >
          Restart preview
        </button>
        <button
          type="button"
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700 disabled:opacity-40"
          disabled={slides.length <= 1}
          onClick={() => {
            setManualMode(true)
            setManualIndex((i) => (i + 1) % slides.length)
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}
