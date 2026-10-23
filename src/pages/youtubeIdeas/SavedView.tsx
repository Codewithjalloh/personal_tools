import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { IdeaStatus } from '../../../shared/youtubeIdeas/types'
import { listSavedIdeas, updateIdeaStatus } from '../../lib/youtubeIdeas/store'

const STATUSES: IdeaStatus[] = ['Idea', 'Researching', 'Script Ready', 'Recorded', 'Published']

export function SavedView() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'All'>('All')
  const [refresh, setRefresh] = useState(0)

  const ideas = useMemo(() => {
    void refresh
    let list = listSavedIdeas()
    if (statusFilter !== 'All') list = list.filter((i) => i.status === statusFilter)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.inspiration.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q),
      )
    }
    return list
  }, [query, statusFilter, refresh])

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">My Saved Ideas</h2>
        <p className="mt-1 text-sm text-zinc-500">Tap an idea to open the full script on its own page.</p>
      </header>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search titles, inspiration, category…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as IdeaStatus | 'All')}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        >
          <option value="All">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {ideas.length === 0 ? (
        <p className="text-sm text-zinc-500">No saved ideas match your filters.</p>
      ) : (
        <ul className="space-y-3">
          {ideas.map((idea) => (
            <li key={idea.id}>
              <Link
                to={`/tools/youtube-ideas/saved/${idea.id}`}
                className="group block rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-amber-500/40 hover:bg-zinc-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-amber-500/80">Part {idea.partNumber}</p>
                    <h3 className="mt-1 text-lg font-medium leading-snug text-white group-hover:text-amber-100">
                      {idea.title}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">{idea.inspiration.name}</p>
                    <p className="mt-3 line-clamp-2 text-sm text-zinc-400">{idea.openingQuestion}</p>
                  </div>
                  <select
                    value={idea.status}
                    onClick={(e) => e.preventDefault()}
                    onChange={(e) => {
                      e.stopPropagation()
                      updateIdeaStatus(idea.id, e.target.value as IdeaStatus)
                      setRefresh((n) => n + 1)
                    }}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="mt-4 inline-block text-xs font-medium text-amber-500/80 group-hover:text-amber-400">
                  Open script →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
