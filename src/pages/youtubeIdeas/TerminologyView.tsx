import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TERMINOLOGY } from '../../../shared/youtubeIdeas/terminology/catalog'
import { TERM_CATEGORIES, type TermCategory } from '../../../shared/youtubeIdeas/terminology/types'
import { normalizeSearchText } from '../../../shared/youtubeIdeas/worldFigures/filterFigures'

const CATEGORY_LABEL = Object.fromEntries(
  TERM_CATEGORIES.filter((c) => c.id !== 'all').map((c) => [c.id, c.label]),
) as Record<TermCategory, string>

export function TerminologyView() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const [category, setCategory] = useState<TermCategory | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(() => searchParams.get('term') ?? null)

  useEffect(() => {
    const q = searchParams.get('q')
    const term = searchParams.get('term')
    if (q != null) setQuery(q)
    if (term != null) setExpandedId(term)
  }, [searchParams])

  const filtered = useMemo(() => {
    let list = [...TERMINOLOGY].sort((a, b) => a.term.localeCompare(b.term))
    if (category !== 'all') list = list.filter((t) => t.category === category)
    const q = normalizeSearchText(query.trim())
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean)
      list = list.filter((t) => {
        const hay = normalizeSearchText(`${t.term} ${t.definition} ${t.explore} ${CATEGORY_LABEL[t.category]}`)
        return tokens.every((token) => hay.includes(token))
      })
    }
    return list
  }, [query, category])

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">Terminology</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Political, economic, and business vocabulary for Excellent117 — governance, banking, entrepreneurship,
          rights, rhetoric, and more. ({TERMINOLOGY.length} terms)
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TERM_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id as TermCategory | 'all')}
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

      <input
        type="search"
        placeholder="Search term or definition…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-xl rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
      />

      <p className="text-xs text-zinc-500">
        Showing {filtered.length} of {TERMINOLOGY.length} terms · tap a row to expand
      </p>

      <ul className="space-y-2">
        {filtered.map((entry) => {
          const open = expandedId === entry.id
          return (
            <li key={entry.id} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setExpandedId(open ? null : entry.id)}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-900"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white">{entry.term}</span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                      {CATEGORY_LABEL[entry.category]}
                    </span>
                  </div>
                  {!open && <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{entry.definition}</p>}
                </div>
                <span className={`shrink-0 text-zinc-500 ${open ? 'rotate-180' : ''}`} aria-hidden>
                  ▾
                </span>
              </button>
              {open ? (
                <div className="border-t border-zinc-800 px-4 py-4 text-sm">
                  <p className="leading-relaxed text-zinc-200">{entry.definition}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-amber-500/90">
                    For your podcast
                  </p>
                  <p className="mt-2 leading-relaxed text-zinc-400">{entry.explore}</p>
                  <button
                    type="button"
                    onClick={() =>
                      void navigator.clipboard.writeText(
                        `${entry.term}\n${entry.definition}\n\nPodcast angle: ${entry.explore}`,
                      )
                    }
                    className="mt-4 rounded border border-zinc-600 px-2 py-1 text-[11px] text-zinc-300 hover:border-amber-500/40"
                  >
                    Copy term
                  </button>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      {filtered.length === 0 && <p className="text-sm text-zinc-500">No terms match your search.</p>}
    </div>
  )
}
