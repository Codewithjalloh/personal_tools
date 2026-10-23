import type { MusicSettings } from '../types'

type Props = {
  file: File | null
  settings: MusicSettings
  onFile: (file: File | null) => void
  onSettings: (settings: MusicSettings) => void
  disabled?: boolean
}

export function MusicUpload({ file, settings, onFile, onSettings, disabled }: Props) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-200">Background music</h2>
      <p className="text-xs text-zinc-500">Optional — trimmed to video length with fade in/out.</p>
      <div className="flex gap-2">
        <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-zinc-700 bg-zinc-950 px-3 py-2 text-center text-xs text-zinc-400 hover:border-zinc-500">
          {file ? file.name : 'Choose audio file'}
          <input
            type="file"
            accept="audio/*"
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
      {file && (
        <div className="space-y-2 text-xs text-zinc-500">
          <label>
            Volume ({Math.round(settings.volume * 100)}%)
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              disabled={disabled}
              value={settings.volume}
              onChange={(e) => onSettings({ ...settings, volume: Number(e.target.value) })}
              className="mt-1 w-full"
            />
          </label>
          <label>
            Fade in ({settings.fadeInSec.toFixed(1)}s)
            <input
              type="range"
              min={0}
              max={4}
              step={0.5}
              disabled={disabled}
              value={settings.fadeInSec}
              onChange={(e) => onSettings({ ...settings, fadeInSec: Number(e.target.value) })}
              className="mt-1 w-full"
            />
          </label>
          <label>
            Fade out ({settings.fadeOutSec.toFixed(1)}s)
            <input
              type="range"
              min={0}
              max={6}
              step={0.5}
              disabled={disabled}
              value={settings.fadeOutSec}
              onChange={(e) => onSettings({ ...settings, fadeOutSec: Number(e.target.value) })}
              className="mt-1 w-full"
            />
          </label>
        </div>
      )}
    </div>
  )
}
