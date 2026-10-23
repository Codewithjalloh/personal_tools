type Props = {
  file: File | null
  onFile: (file: File | null) => void
  disabled?: boolean
}

export function MusicUpload({ file, onFile, disabled }: Props) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-200">Background music</h2>
      <p className="text-xs text-zinc-500">Optional MP3/WAV — trimmed to video length on export.</p>
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
    </div>
  )
}
