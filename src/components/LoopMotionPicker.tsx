import {
  LOOP_MOTION_MIX_IDS,
  LOOP_MOTION_OPTIONS,
  normalizeMotionSelection,
  type LoopMotionStyle,
} from '../lib/loopMotion'

type Props = {
  value: LoopMotionStyle[]
  onChange: (value: LoopMotionStyle[]) => void
  disabled?: boolean
  /** When true, user can select multiple styles (split across output). */
  allowMultiple?: boolean
  segmentDurationSec?: number
  onApplyMixPreset?: () => void
}

export function LoopMotionPicker({
  value,
  onChange,
  disabled,
  allowMultiple = true,
  segmentDurationSec,
  onApplyMixPreset,
}: Props) {
  const selected = normalizeMotionSelection(value)
  const multi = allowMultiple && selected.length > 1

  const toggle = (id: LoopMotionStyle) => {
    if (!allowMultiple) {
      onChange([id])
      return
    }
    if (selected.includes(id)) {
      const next = selected.filter((m) => m !== id)
      onChange(next.length > 0 ? next : [id])
      return
    }
    onChange([...selected, id])
  }

  const mixPreset = () => {
    onChange([...LOOP_MOTION_MIX_IDS])
    onApplyMixPreset?.()
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">
          Motion {allowMultiple ? '(tap one or many)' : ''}
        </p>
        {allowMultiple && (
          <button
            type="button"
            disabled={disabled}
            onClick={mixPreset}
            className="text-[11px] font-medium text-violet-400 hover:text-violet-300 disabled:opacity-50"
          >
            1 min mix preset
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {LOOP_MOTION_OPTIONS.map((opt) => {
          const active = selected.includes(opt.id)
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              title={opt.hint}
              onClick={() => toggle(opt.id)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                active
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      {multi && segmentDurationSec != null && segmentDurationSec > 0 && (
        <p className="text-[11px] text-zinc-600">
          {selected.length} styles · ~{segmentDurationSec.toFixed(0)}s each across your output
        </p>
      )}
      {!multi && selected.length === 1 && (
        <p className="text-[11px] text-zinc-600">
          {LOOP_MOTION_OPTIONS.find((o) => o.id === selected[0])?.hint}
        </p>
      )}
      {allowMultiple && selected.length === 1 && (
        <p className="text-[11px] text-zinc-600">
          Tip: at 1 min, select several styles for a mixed clip (or use the preset).
        </p>
      )}
    </div>
  )
}
