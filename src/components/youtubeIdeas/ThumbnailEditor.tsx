import { useCallback, useEffect, useRef, useState } from 'react'
import type { ImageAsset, ThumbnailFontId, ThumbnailPrefs, ThumbnailTextAlign } from '../../../shared/youtubeIdeas/types'
import {
  THUMBNAIL_ALIGN_OPTIONS,
  THUMBNAIL_DEFAULT_COLORS,
  THUMBNAIL_FONT_OPTIONS,
  buildCanvasThumbnail,
  defaultPartLabel,
  defaultThumbnailPrefs,
  downloadDataUrl,
  normalizeThumbnailPrefs,
} from '../../lib/youtubeIdeas/thumbnail'

type Props = {
  partNumber: number
  defaultHeadline: string
  images: ImageAsset[]
  thumbnailDataUrl?: string
  thumbnailPrefs?: ThumbnailPrefs
  onChange: (dataUrl: string | undefined, prefs: ThumbnailPrefs) => void
  onAiGenerate?: () => Promise<string>
  disabled?: boolean
}

function AlignPicker({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string
  value: ThumbnailTextAlign
  disabled: boolean
  onChange: (align: ThumbnailTextAlign) => void
}) {
  return (
    <div>
      <span className="text-[10px] text-zinc-500">{label}</span>
      <div className="mt-1 flex gap-1" role="group" aria-label={label}>
        {THUMBNAIL_ALIGN_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition ${
              value === opt.id
                ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ColorInput({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string
  value: string
  disabled: boolean
  onChange: (hex: string) => void
}) {
  return (
    <label className="block">
      <span className="text-[10px] text-zinc-500">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value.startsWith('#') && value.length >= 7 ? value.slice(0, 7) : '#d4af37'}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 cursor-pointer rounded border border-zinc-700 bg-zinc-950"
        />
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs"
        />
      </div>
    </label>
  )
}

export function ThumbnailEditor({
  partNumber,
  defaultHeadline,
  images,
  thumbnailDataUrl,
  thumbnailPrefs,
  onChange,
  onAiGenerate,
  disabled = false,
}: Props) {
  const initialBg = thumbnailPrefs?.backgroundUrl ?? images[0]?.url
  const [prefs, setPrefs] = useState<ThumbnailPrefs>(() =>
    thumbnailPrefs
      ? normalizeThumbnailPrefs(thumbnailPrefs, partNumber, defaultHeadline)
      : defaultThumbnailPrefs(partNumber, defaultHeadline, initialBg),
  )
  const [preview, setPreview] = useState<string | undefined>(thumbnailDataUrl)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(!thumbnailDataUrl)
  const buildGen = useRef(0)

  const patchPrefs = (patch: Partial<ThumbnailPrefs>) => {
    setDirty(true)
    setPrefs((p) => ({ ...p, ...patch }))
  }

  const rebuild = useCallback(async () => {
    const gen = ++buildGen.current
    setBuilding(true)
    setError(null)
    try {
      const dataUrl = await buildCanvasThumbnail(prefs)
      if (gen !== buildGen.current) return
      setPreview(dataUrl)
      onChange(dataUrl, prefs)
    } catch (e) {
      if (gen !== buildGen.current) return
      setError(e instanceof Error ? e.message : 'Could not build thumbnail')
    } finally {
      if (gen === buildGen.current) setBuilding(false)
    }
  }, [onChange, prefs])

  useEffect(() => {
    if (!dirty) return
    if (!images.length && !prefs.backgroundUrl) return
    const t = window.setTimeout(() => void rebuild(), 400)
    return () => window.clearTimeout(t)
  }, [dirty, prefs, partNumber, rebuild, images.length])

  useEffect(() => {
    if (thumbnailDataUrl && !preview) setPreview(thumbnailDataUrl)
  }, [thumbnailDataUrl, preview])

  useEffect(() => {
    if (prefs.backgroundUrl || !images[0]?.url) return
    patchPrefs({ backgroundUrl: images[0].url })
  }, [images])

  const selectImage = (url: string) => {
    patchPrefs({ backgroundUrl: url })
  }

  const resetHeadline = () => {
    patchPrefs({ headline: defaultHeadline })
  }

  const resetPartLabel = () => {
    patchPrefs({ partLabel: defaultPartLabel(partNumber) })
  }

  const resetColors = () => {
    patchPrefs({
      brandColor: THUMBNAIL_DEFAULT_COLORS.brand,
      partLabelColor: THUMBNAIL_DEFAULT_COLORS.partLabel,
      headlineColor: THUMBNAIL_DEFAULT_COLORS.headline,
      taglineColor: THUMBNAIL_DEFAULT_COLORS.tagline,
      accentColor: THUMBNAIL_DEFAULT_COLORS.accent,
    })
  }

  const alignAll = (align: ThumbnailTextAlign) => {
    patchPrefs({
      brandAlign: align,
      partAlign: align,
      headlineAlign: align,
      taglineAlign: align,
    })
  }

  const allAlignSame =
    prefs.brandAlign === prefs.partAlign &&
    prefs.partAlign === prefs.headlineAlign &&
    prefs.headlineAlign === prefs.taglineAlign
      ? prefs.headlineAlign
      : null

  const runAi = async () => {
    if (!onAiGenerate) return
    setBuilding(true)
    setError(null)
    try {
      const url = await onAiGenerate()
      setDirty(false)
      setPreview(url)
      onChange(url, prefs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI thumbnail failed')
    } finally {
      setBuilding(false)
    }
  }

  const busy = building || disabled

  const previewPane = (
    <div className="relative">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Live preview · 1280×720</p>
        {building ? <span className="text-[10px] text-amber-400/90">Rendering…</span> : null}
      </div>
      <div className="relative overflow-hidden rounded-lg border border-zinc-700 bg-black shadow-lg">
        {preview ? (
          <img
            src={preview}
            alt="Thumbnail preview"
            className="block max-h-[min(38vh,240px)] w-full object-contain lg:max-h-none"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center text-sm text-zinc-500">
            {building ? 'Rendering…' : 'Pick a background or edit text'}
          </div>
        )}
        {building ? (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white"
            aria-hidden
          >
            Updating…
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void rebuild()}
          className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 hover:border-amber-500/40 disabled:opacity-50"
        >
          Update preview
        </button>
        {onAiGenerate ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void runAi()}
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 hover:border-amber-500/40 disabled:opacity-50"
          >
            Generate AI
          </button>
        ) : null}
        {preview ? (
          <button
            type="button"
            onClick={() => downloadDataUrl(preview, `excellent117-part-${partNumber}-thumb.jpg`)}
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/20"
          >
            Download
          </button>
        ) : null}
      </div>
    </div>
  )

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/40">
      <p className="border-b border-zinc-800 px-4 py-2 text-xs text-zinc-500">
        Preview stays visible while you scroll the controls.
      </p>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,44%)] lg:items-start">
        {/* Preview: sticky on mobile (top) and desktop (right column) */}
        <div
          className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur-md supports-[backdrop-filter]:bg-zinc-950/80 lg:top-4 lg:col-start-2 lg:row-span-2 lg:max-h-[calc(100dvh-5.5rem)] lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-l lg:border-zinc-800"
        >
          {previewPane}
        </div>

        <div
          className="max-h-none space-y-4 p-4 lg:col-start-1 lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1"
        >
          <fieldset className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <legend className="px-1 text-[10px] font-semibold uppercase tracking-widest text-amber-500/90">Text</legend>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Brand</span>
              <input
                type="text"
                value={prefs.brandText}
                disabled={busy}
                onChange={(e) => patchPrefs({ brandText: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Part label</span>
              <input
                type="text"
                value={prefs.partLabel}
                disabled={busy}
                onChange={(e) => patchPrefs({ partLabel: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={busy}
                onClick={resetPartLabel}
                className="mt-1 text-[11px] text-amber-500/80 hover:text-amber-400"
              >
                Reset to {defaultPartLabel(partNumber)}
              </button>
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Headline</span>
              <textarea
                value={prefs.headline}
                disabled={busy}
                rows={3}
                onChange={(e) => patchPrefs({ headline: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm leading-snug"
              />
              <button
                type="button"
                disabled={busy}
                onClick={resetHeadline}
                className="mt-1 text-[11px] text-amber-500/80 hover:text-amber-400"
              >
                Reset to YouTube title
              </button>
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Tagline</span>
              <input
                type="text"
                value={prefs.tagline}
                disabled={busy}
                onChange={(e) => patchPrefs({ tagline: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>

            <div className="space-y-3 border-t border-zinc-800 pt-3">
              <AlignPicker
                label="Align all text"
                value={allAlignSame ?? prefs.headlineAlign}
                disabled={busy}
                onChange={alignAll}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <AlignPicker
                  label="Brand"
                  value={prefs.brandAlign}
                  disabled={busy}
                  onChange={(a) => patchPrefs({ brandAlign: a })}
                />
                <AlignPicker
                  label="Part label"
                  value={prefs.partAlign}
                  disabled={busy}
                  onChange={(a) => patchPrefs({ partAlign: a })}
                />
                <AlignPicker
                  label="Headline"
                  value={prefs.headlineAlign}
                  disabled={busy}
                  onChange={(a) => patchPrefs({ headlineAlign: a })}
                />
                <AlignPicker
                  label="Tagline"
                  value={prefs.taglineAlign}
                  disabled={busy}
                  onChange={(a) => patchPrefs({ taglineAlign: a })}
                />
              </div>
            </div>
          </fieldset>

          <details className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4" open>
            <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-widest text-amber-500/90">
              Fonts
            </summary>
            <div className="mt-3 space-y-3">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Headline font</span>
              <select
                value={prefs.headlineFont}
                disabled={busy}
                onChange={(e) => patchPrefs({ headlineFont: e.target.value as ThumbnailFontId })}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              >
                {THUMBNAIL_FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Brand, part & tagline font
              </span>
              <select
                value={prefs.detailFont}
                disabled={busy}
                onChange={(e) => patchPrefs({ detailFont: e.target.value as ThumbnailFontId })}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              >
                {THUMBNAIL_FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </label>
            </div>
          </details>

          <details className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-widest text-amber-500/90">
              <span>Colours</span>
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault()
                  resetColors()
                }}
                className="text-[10px] font-normal normal-case tracking-normal text-zinc-500 hover:text-amber-400"
              >
                Reset defaults
              </button>
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ColorInput
                label="Brand"
                value={prefs.brandColor}
                disabled={busy}
                onChange={(v) => patchPrefs({ brandColor: v })}
              />
              <ColorInput
                label="Part label"
                value={prefs.partLabelColor}
                disabled={busy}
                onChange={(v) => patchPrefs({ partLabelColor: v })}
              />
              <ColorInput
                label="Headline"
                value={prefs.headlineColor}
                disabled={busy}
                onChange={(v) => patchPrefs({ headlineColor: v })}
              />
              <ColorInput
                label="Tagline"
                value={prefs.taglineColor}
                disabled={busy}
                onChange={(v) => patchPrefs({ taglineColor: v })}
              />
              <ColorInput
                label="Bottom accent bar"
                value={prefs.accentColor}
                disabled={busy}
                onChange={(v) => patchPrefs({ accentColor: v })}
              />
            </div>
          </details>

          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Background crop (vertical)
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(prefs.focalY * 100)}
              disabled={busy || !prefs.backgroundUrl}
              onChange={(e) => patchPrefs({ focalY: Number(e.target.value) / 100 })}
              className="mt-2 w-full accent-amber-500"
            />
          </label>

          {images.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Background image</p>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((img, i) => {
                  const selected = prefs.backgroundUrl === img.url
                  return (
                    <button
                      key={`${img.url}-${i}`}
                      type="button"
                      disabled={busy}
                      onClick={() => selectImage(img.url)}
                      className={`overflow-hidden rounded-lg border-2 transition ${
                        selected ? 'border-amber-500 ring-1 ring-amber-500/40' : 'border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <img src={img.url} alt="" className="aspect-video w-full object-cover" />
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Load reference images to pick a photo background.</p>
          )}
        </div>
      </div>

      {error ? <p className="border-t border-zinc-800 px-4 py-2 text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
