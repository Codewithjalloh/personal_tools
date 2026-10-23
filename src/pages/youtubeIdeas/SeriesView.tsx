import { useMemo, useState } from 'react'
import { DEFAULT_SERIES_TITLE } from '../../../shared/youtubeIdeas/constants'
import { deleteSeries, listSavedIdeas, listSeries, upsertSeries } from '../../lib/youtubeIdeas/store'

export function SeriesView() {
  const [name, setName] = useState(DEFAULT_SERIES_TITLE)
  const [refresh, setRefresh] = useState(0)
  const ideas = useMemo(() => listSavedIdeas(), [refresh])
  const seriesList = useMemo(() => listSeries(), [refresh])

  const createSeries = () => {
    if (!name.trim()) return
    upsertSeries({
      id: crypto.randomUUID(),
      name: name.trim(),
      ideaIds: [],
      nextPartNumber: Math.max(...ideas.map((i) => i.partNumber), 0) + 1,
    })
    setRefresh((n) => n + 1)
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">Episode Series</h2>
        <p className="mt-1 text-sm text-zinc-500">Group parts into a coherent Excellent117 arc</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-[240px] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          placeholder="Series name"
        />
        <button
          type="button"
          onClick={createSeries}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black"
        >
          Create series
        </button>
      </div>

      {seriesList.length === 0 ? (
        <p className="text-sm text-zinc-500">No series yet. Create one to track sequential numbering.</p>
      ) : (
        <ul className="space-y-4">
          {seriesList.map((s) => {
            const eps = ideas.filter((i) => s.ideaIds.includes(i.id))
            return (
              <li key={s.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium text-white">{s.name}</h3>
                  <button
                    type="button"
                    className="text-xs text-red-400"
                    onClick={() => {
                      if (confirm(`Delete series "${s.name}"?`)) {
                        deleteSeries(s.id)
                        setRefresh((n) => n + 1)
                      }
                    }}
                  >
                    Delete series
                  </button>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Next suggested part: {s.nextPartNumber ?? '—'} · {eps.length} linked episodes
                </p>
                <ul className="mt-3 space-y-1 text-sm text-zinc-400">
                  {eps.length === 0 ? (
                    <li>Link episodes by saving ideas with matching series (coming: drag-assign).</li>
                  ) : (
                    eps
                      .sort((a, b) => a.partNumber - b.partNumber)
                      .map((e) => (
                        <li key={e.id}>
                          Part {e.partNumber} — {e.title}
                        </li>
                      ))
                  )}
                </ul>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
