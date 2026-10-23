import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { SavedIdea } from '../../../shared/youtubeIdeas/types'
import { relateWorldFiguresToIdea } from '../../../shared/youtubeIdeas/worldFigures/relateToIdea'
import type { FigureCategory } from '../../../shared/youtubeIdeas/worldFigures/types'

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

type Props = {
  idea: SavedIdea
}

export function SavedIdeaWorldLibrarySection({ idea }: Props) {
  const related = useMemo(() => relateWorldFiguresToIdea(idea, 8), [idea])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = (id: string) => {
    setExpandedId((current) => (current === id ? null : id))
  }

  if (related.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-400/90">
          World Library — people to relate
        </h3>
        <p className="mt-3 text-sm text-zinc-500">
          No strong matches yet. Open{' '}
          <Link to="/tools/youtube-ideas/philosophers" className="text-amber-500/90 hover:text-amber-400">
            World Library
          </Link>{' '}
          and search by name or theme from your script.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-amber-500/20 bg-zinc-900/50 px-5 py-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-400/90">
            World Library — people to relate
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Tap a name to expand bio and themes. Use these for quotes, contrast, and research.
          </p>
        </div>
        <Link
          to="/tools/youtube-ideas/philosophers"
          className="text-xs font-medium text-amber-500/80 hover:text-amber-400"
        >
          Browse all →
        </Link>
      </div>

      <ul className="mt-4 space-y-2">
        {related.map(({ figure, reason }) => {
          const open = expandedId === figure.id
          return (
            <li key={figure.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(figure.id)}
                aria-expanded={open}
                className="flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-zinc-900"
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-zinc-100">{figure.name}</span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-500/80">
                      {CATEGORY_LABEL[figure.category]}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 text-zinc-500 transition ${open ? 'rotate-180' : ''}`}
                    aria-hidden
                  >
                    ▾
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  {figure.lifespan} · {figure.tradition}
                </p>
                <p className="text-sm text-zinc-400">{reason}</p>
              </button>

              {open ? (
                <div className="border-t border-zinc-800 px-4 py-4 text-sm leading-relaxed">
                  <p className="text-xs text-amber-500/80">
                    {figure.region} · {figure.tradition}
                  </p>
                  <h4 className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-amber-400/90">
                    Short bio
                  </h4>
                  <p className="mt-2 text-zinc-200">{figure.bio}</p>
                  <h4 className="mt-5 text-[10px] font-semibold uppercase tracking-widest text-amber-400/90">
                    Core themes of their ideas
                  </h4>
                  <ol className="mt-2 list-decimal space-y-3 pl-5 marker:text-amber-500/80">
                    {figure.themes.map((theme) => (
                      <li key={theme.title} className="pl-1">
                        <span className="text-zinc-200">{theme.title}</span>
                        {theme.explore ? (
                          <p className="mt-1 text-sm leading-relaxed text-zinc-500">{theme.explore}</p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                  <Link
                    to={`/tools/youtube-ideas/philosophers/${figure.id}`}
                    className="mt-4 inline-block text-xs text-zinc-500 hover:text-amber-400/90"
                  >
                    Open full profile in World Library →
                  </Link>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
