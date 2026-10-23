import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DEFAULT_SERIES_TITLE } from '../../../shared/youtubeIdeas/constants'
import {
  deleteSeries,
  linkIdeaToSeries,
  listSavedIdeas,
  listSeries,
  unlinkIdeaFromSeries,
  upsertSeries,
} from '../../lib/youtubeIdeas/store'

export function SeriesView() {
  const [name, setName] = useState(DEFAULT_SERIES_TITLE)
  const [refresh, setRefresh] = useState(0)
  const ideas = useMemo(() => {
    void refresh
    return listSavedIdeas()
  }, [refresh])
  const seriesList = useMemo(() => {
    void refresh
    return listSeries()
  }, [refresh])

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
        <p className="mt-1 text-sm text-zinc-500">
          Group parts into a coherent Excellent117 arc. Link ideas here or when generating.
        </p>
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
            const unlinked = ideas.filter((i) => !i.seriesId || i.seriesId === s.id)
            return (
              <li key={s.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium text-white">{s.name}</h3>
                  <div className="flex gap-2">
                    <Link
                      to={`/tools/youtube-ideas/generate`}
                      onClick={() => {
                        const prefs = {
                          count: 1 as const,
                          category: ideas[0]?.category ?? 'Mixed Topics',
                          philosophicalInspiration: ideas[0]?.philosophicalInspiration ?? 'Mixed Inspirations',
                          region: ideas[0]?.region ?? 'Africa generally',
                          startPartNumber: s.nextPartNumber ?? 1,
                          seriesTitle: s.name,
                          seriesId: s.id,
                        }
                        localStorage.setItem('excellent117.generateForm.v1', JSON.stringify(prefs))
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300"
                    >
                      Generate next part →
                    </Link>
                    <button
                      type="button"
                      className="text-xs text-red-400"
                      onClick={() => {
                        if (confirm(`Delete series "${s.name}"? Ideas stay saved but unlink from this series.`)) {
                          deleteSeries(s.id)
                          setRefresh((n) => n + 1)
                        }
                      }}
                    >
                      Delete series
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Next suggested part: {s.nextPartNumber ?? '—'} · {eps.length} linked episodes
                </p>

                <label className="mt-4 block text-xs text-zinc-500">
                  Add episode to this series
                  <select
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                    defaultValue=""
                    onChange={(e) => {
                      const id = e.target.value
                      if (!id) return
                      linkIdeaToSeries(s.id, id)
                      e.target.value = ''
                      setRefresh((n) => n + 1)
                    }}
                  >
                    <option value="">Choose a saved idea…</option>
                    {unlinked
                      .filter((i) => !s.ideaIds.includes(i.id))
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          Part {i.partNumber} — {i.title}
                        </option>
                      ))}
                  </select>
                </label>

                <ul className="mt-3 space-y-1 text-sm text-zinc-400">
                  {eps.length === 0 ? (
                    <li>No episodes linked yet.</li>
                  ) : (
                    eps
                      .sort((a, b) => a.partNumber - b.partNumber)
                      .map((e) => (
                        <li key={e.id} className="flex flex-wrap items-center justify-between gap-2">
                          <Link to={`/tools/youtube-ideas/saved/${e.id}`} className="hover:text-amber-200">
                            Part {e.partNumber} — {e.title}
                          </Link>
                          <button
                            type="button"
                            className="text-[10px] text-zinc-600 hover:text-red-400"
                            onClick={() => {
                              unlinkIdeaFromSeries(e.id)
                              setRefresh((n) => n + 1)
                            }}
                          >
                            Unlink
                          </button>
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
