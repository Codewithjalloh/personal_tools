import { useMemo, useState } from 'react'
import type { IdeaStatus } from '../../../shared/youtubeIdeas/types'
import { deleteIdea, listSavedIdeas, updateIdeaStatus } from '../../lib/youtubeIdeas/store'

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

  const remove = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    deleteIdea(id)
    setRefresh((n) => n + 1)
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">My Saved Ideas</h2>
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
        <ul className="space-y-4">
          {ideas.map((idea) => (
            <li key={idea.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-amber-500/80">Part {idea.partNumber}</p>
                  <h3 className="text-lg font-medium text-white">{idea.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{idea.inspiration.name}</p>
                </div>
                <select
                  value={idea.status}
                  onChange={(e) => {
                    updateIdeaStatus(idea.id, e.target.value as IdeaStatus)
                    setRefresh((n) => n + 1)
                  }}
                  className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-zinc-400">{idea.openingQuestion}</p>
              <button
                type="button"
                onClick={() => remove(idea.id, idea.title)}
                className="mt-4 text-xs text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
