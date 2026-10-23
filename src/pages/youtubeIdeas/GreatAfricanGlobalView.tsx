import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GREAT_AFRICAN_GLOBAL_TITLE } from '../../../shared/youtubeIdeas/constants'
import {
  countGreatAfricanActiveFilters,
  filterGreatAfricanProfiles,
  GAG_ERA_FILTERS,
  GAG_GENDER_FILTERS,
  GREAT_AFRICAN_GLOBAL_PROFILES,
  listGreatAfricanRegions,
  type GreatAfricanEra,
  type GreatAfricanGender,
} from '../../../shared/youtubeIdeas/greatAfricanGlobal'

export function GreatAfricanGlobalView() {
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('All regions')
  const [gender, setGender] = useState<'all' | GreatAfricanGender>('all')
  const [era, setEra] = useState<'all' | GreatAfricanEra>('all')
  const regions = useMemo(() => listGreatAfricanRegions(), [])

  const filtered = useMemo(
    () => filterGreatAfricanProfiles(GREAT_AFRICAN_GLOBAL_PROFILES, { query, region, gender, era }),
    [query, region, gender, era],
  )

  const activeFilterCount = useMemo(
    () => countGreatAfricanActiveFilters({ query, region, gender, era }),
    [query, region, gender, era],
  )

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">{GREAT_AFRICAN_GLOBAL_TITLE}</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Deep profiles of African and global African leaders and thinkers—background, education, ideas, philosophy, and
          balanced pros & cons for Excellent117 episodes. ({GREAT_AFRICAN_GLOBAL_PROFILES.length} profiles)
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {GAG_GENDER_FILTERS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGender(g.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              gender === g.id
                ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search name, ideas, region…"
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
          {GAG_ERA_FILTERS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setRegion('All regions')
              setGender('all')
              setEra('all')
            }}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
          >
            Clear filters
          </button>
        )}
      </div>

      <p className="text-xs text-zinc-500">
        Showing {filtered.length} of {GREAT_AFRICAN_GLOBAL_PROFILES.length} profiles
        {activeFilterCount > 0 ? ' (filtered)' : ''}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {filtered.map((p) => (
          <li key={p.id}>
            <Link
              to={`/tools/youtube-ideas/great-african-global/${p.id}`}
              className="group block h-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-amber-500/40 hover:bg-zinc-900"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-500/90">
                  {p.roles[0]}
                </span>
                {p.era === 'contemporary' && (
                  <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[10px] text-emerald-400/90">Living</span>
                )}
              </div>
              <div className="mt-2 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white group-hover:text-amber-100">{p.name}</h3>
                <span className="shrink-0 text-[10px] text-zinc-600">{p.lifespan}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{p.region}</p>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{p.bio}</p>
              <p className="mt-3 text-xs font-medium text-amber-500/80">Full profile →</p>
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && <p className="text-sm text-zinc-500">No profiles match your filters.</p>}
    </div>
  )
}
