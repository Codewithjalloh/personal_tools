import type { ReaderPrefs } from '../../lib/youtubeIdeas/readerPrefs'

type Props = {
  prefs: ReaderPrefs
  onChange: (prefs: ReaderPrefs) => void
  onClearHighlights: () => void
}

export function ReadingToolbar({ prefs, onChange, onClearHighlights }: Props) {
  const set = (patch: Partial<ReaderPrefs>) => onChange({ ...prefs, ...patch })

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2">
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Reading</span>

      <ToolbarBtn
        label="A−"
        title="Decrease text size"
        onClick={() => set({ fontSize: Math.max(14, prefs.fontSize - 1) })}
      />
      <span className="min-w-[2.5rem] text-center text-xs tabular-nums text-zinc-400">{prefs.fontSize}px</span>
      <ToolbarBtn
        label="A+"
        title="Increase text size"
        onClick={() => set({ fontSize: Math.min(26, prefs.fontSize + 1) })}
      />

      <Divider />

      <ToolbarBtn
        label="Tighter"
        title="Decrease line spacing"
        onClick={() => set({ lineHeight: Math.max(1.5, Math.round((prefs.lineHeight - 0.1) * 10) / 10) })}
      />
      <ToolbarBtn
        label="Looser"
        title="Increase line spacing"
        onClick={() => set({ lineHeight: Math.min(2.2, Math.round((prefs.lineHeight + 0.1) * 10) / 10) })}
      />

      <Divider />

      <ToolbarBtn
        label={prefs.highlightMode ? 'Highlight on' : 'Highlight off'}
        title="Tap paragraphs to highlight while reading"
        active={prefs.highlightMode}
        onClick={() => set({ highlightMode: !prefs.highlightMode })}
      />
      <ToolbarBtn label="Clear marks" title="Remove all highlights" onClick={onClearHighlights} />

      <Divider />

      <ToolbarBtn
        label={prefs.recordingMode ? 'Recording ✓' : 'Recording view'}
        title="Larger text and spacing for recording"
        active={prefs.recordingMode}
        onClick={() =>
          onChange(
            prefs.recordingMode
              ? { ...prefs, recordingMode: false, fontSize: 17, lineHeight: 1.75 }
              : { ...prefs, recordingMode: true, fontSize: 21, lineHeight: 2, highlightMode: true },
          )
        }
      />
    </div>
  )
}

function ToolbarBtn({
  label,
  title,
  onClick,
  active,
}: {
  label: string
  title: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40'
          : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 hidden h-5 w-px bg-zinc-700 sm:inline-block" aria-hidden />
}
