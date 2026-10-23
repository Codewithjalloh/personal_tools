export type GenerationPhase = {
  id: string
  label: string
  status: 'pending' | 'active' | 'done' | 'error'
  detail?: string
}

type Props = {
  phases: GenerationPhase[]
  percent: number
}

export function GenerationProgress({ phases, percent }: Props) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-zinc-950/90 p-6 shadow-inner shadow-black/40">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-amber-200">Generating podcast ideas…</p>
        <span className="text-sm tabular-nums text-zinc-400">{Math.round(percent)}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <ul className="mt-5 space-y-3">
        {phases.map((phase) => (
          <li key={phase.id} className="flex gap-3 text-sm">
            <PhaseIcon status={phase.status} />
            <div className="min-w-0 flex-1">
              <p
                className={
                  phase.status === 'active'
                    ? 'font-medium text-white'
                    : phase.status === 'done'
                      ? 'text-zinc-300'
                      : phase.status === 'error'
                        ? 'text-red-300'
                        : 'text-zinc-500'
                }
              >
                {phase.label}
              </p>
              {phase.detail && <p className="mt-0.5 truncate text-xs text-zinc-500">{phase.detail}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PhaseIcon({ status }: { status: GenerationPhase['status'] }) {
  if (status === 'done') {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs text-amber-400">
        ✓
      </span>
    )
  }
  if (status === 'active') {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-950 text-xs text-red-400">
        !
      </span>
    )
  }
  return <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-zinc-700" />
}
