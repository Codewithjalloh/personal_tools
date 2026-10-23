import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ALL_WORLD_FIGURES,
  countActiveFilters,
  FIGURE_CATEGORIES,
  filterWorldFigures,
  listFigureRegions,
  type FigureCategory,
} from '../../../shared/youtubeIdeas/worldFigures'

const CATEGORY_LABEL: Record<FigureCategory, string> = {
  philosopher: 'Philosopher',
  president: 'President / leader',
  writer: 'Writer',
  scientist: 'Scientist',
  artist: 'Artist',
  activist: 'Activist',
  billionaire: 'Billionaire',
  'ancient ruler': 'Ancient ruler',
}

export function PhilosophersView() {
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('All regions')
  const [category, setCategory] = useState<FigureCategory | 'all'>('all')
  const [era, setEra] = useState<'all' | 'ancient' | 'historical' | 'contemporary'>('all')
  const regions = useMemo(() => listFigureRegions(), [])

  const filtered = useMemo(
    () => filterWorldFigures(ALL_WORLD_FIGURES, { query, region, category, era }),
    [query, region, category, era],
  )

  const activeFilterCount = useMemo(
    () => countActiveFilters({ query, region, category, era }),
    [query, region, category, era],
  )

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">World Library</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Philosophers, writers, scientists, artists, activists, leaders, rulers, and more — short bios and themes for
          Excellent117 research. ({ALL_WORLD_FIGURES.length} profiles)
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FIGURE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id as FigureCategory | 'all')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              category === c.id
                ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search name, theme, role…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        >
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={era}
          onChange={(e) => setEra(e.target.value as typeof era)}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        >
          <option value="all">All eras</option>
          <option value="ancient">Ancient</option>
          <option value="historical">Historical</option>
          <option value="contemporary">Alive / contemporary</option>
        </select>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setRegion('All regions')
              setCategory('all')
              setEra('all')
            }}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
          >
            Clear filters
          </button>
        )}
      </div>

      <p className="text-xs text-zinc-500">
        Showing {filtered.length} of {ALL_WORLD_FIGURES.length} profiles
        {activeFilterCount > 0 ? ' (filtered)' : ''}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {filtered.map((p) => (
          <li key={p.id}>
            <Link
              to={`/tools/youtube-ideas/philosophers/${p.id}`}
              className="group block h-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-amber-500/40 hover:bg-zinc-900"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-500/90">
                  {CATEGORY_LABEL[p.category]}
                </span>
                {p.era === 'contemporary' && (
                  <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[10px] text-emerald-400/90">Living</span>
                )}
              </div>
              <div className="mt-2 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white group-hover:text-amber-100">{p.name}</h3>
                <span className="shrink-0 text-[10px] text-zinc-600">{p.lifespan}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{p.tradition}</p>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{p.bio}</p>
              <p className="mt-3 text-xs font-medium text-amber-500/80">Read profile →</p>
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && <p className="text-sm text-zinc-500">No profiles match your filters.</p>}
    </div>
  )
}
