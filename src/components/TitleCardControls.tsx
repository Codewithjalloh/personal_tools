import { TITLE_FONTS } from '../lib/fonts'
import { TEXT_ANIMATION_OPTIONS } from '../lib/textAnimation'
import type { TitleCardSettings, TextPosition } from '../types'

const COLOR_PRESETS = ['#ffffff', '#fbbf24', '#f472b6', '#38bdf8', '#4ade80', '#000000']

type Props = {
  label: string
  card: TitleCardSettings
  onChange: (card: TitleCardSettings) => void
  disabled?: boolean
}

export function TitleCardControls({ label, card, onChange, disabled }: Props) {
  const hasText = card.text.trim().length > 0

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-200">{label}</h2>
        {hasText && (
          <span className="text-xs text-violet-300">{card.durationSec}s</span>
        )}
      </div>
      <textarea
        value={card.text}
        disabled={disabled}
        rows={2}
        placeholder={label === 'Intro' ? 'Opening title…' : 'Closing message…'}
        onChange={(e) => onChange({ ...card, text: e.target.value })}
        className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 disabled:opacity-50"
      />
      {hasText && (
        <>
          <div>
            <p className="mb-1 text-xs text-zinc-500">Text animation</p>
            <select
              disabled={disabled}
              value={card.animation}
              onChange={(e) =>
                onChange({ ...card, animation: e.target.value as TitleCardSettings['animation'] })
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            >
              {TEXT_ANIMATION_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs text-zinc-500">Font</p>
            <select
              disabled={disabled}
              value={card.fontId}
              onChange={(e) =>
                onChange({ ...card, fontId: e.target.value as TitleCardSettings['fontId'] })
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            >
              {TITLE_FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <label className="block text-xs text-zinc-500">
            Duration (seconds)
            <input
              type="range"
              min={3}
              max={15}
              step={1}
              disabled={disabled}
              value={card.durationSec}
              onChange={(e) => onChange({ ...card, durationSec: Number(e.target.value) })}
              className="mt-1 w-full"
            />
            <span className="text-zinc-400">{card.durationSec}s</span>
          </label>
          <label className="block text-xs text-zinc-500">
            Size
            <input
              type="range"
              min={0.7}
              max={1.4}
              step={0.05}
              disabled={disabled}
              value={card.fontScale}
              onChange={(e) => onChange({ ...card, fontScale: Number(e.target.value) })}
              className="mt-1 w-full"
            />
          </label>
          <div>
            <p className="mb-1 text-xs text-zinc-500">Position</p>
            <div className="flex gap-1">
              {(['top', 'center', 'bottom'] as TextPosition[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...card, position: p })}
                  className={`flex-1 rounded-lg py-1.5 text-xs capitalize ${
                    card.position === p ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={card.showBar}
              disabled={disabled}
              onChange={(e) => onChange({ ...card, showBar: e.target.checked })}
            />
            Dark bar behind text
          </label>
        </>
      )}
      <div>
        <p className="mb-2 text-xs text-zinc-500">Text colour</p>
        <div className="flex flex-wrap items-center gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={disabled}
              aria-label={`Colour ${c}`}
              onClick={() => onChange({ ...card, color: c })}
              className={`h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-zinc-900 disabled:opacity-50 ${
                card.color.toLowerCase() === c ? 'ring-violet-400' : 'ring-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            disabled={disabled}
            value={card.color}
            onChange={(e) => onChange({ ...card, color: e.target.value })}
            className="h-8 w-10 cursor-pointer rounded border border-zinc-700 bg-transparent disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  )
}
