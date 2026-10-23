import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { SavedIdea } from '../../../shared/youtubeIdeas/types'
import { relateTermsToIdea } from '../../../shared/youtubeIdeas/terminology/relateToIdea'
import { TERM_CATEGORIES, type TermCategory } from '../../../shared/youtubeIdeas/terminology/types'
import { relateWorldFiguresToIdea } from '../../../shared/youtubeIdeas/worldFigures/relateToIdea'
import type { FigureCategory } from '../../../shared/youtubeIdeas/worldFigures/types'

const FIGURE_CATEGORY_LABEL: Record<FigureCategory, string> = {
  philosopher: 'Philosopher',
  president: 'President / leader',
  writer: 'Writer',
  scientist: 'Scientist',
  artist: 'Artist',
  activist: 'Activist',
  billionaire: 'Billionaire',
  'ancient ruler': 'Ancient ruler',
}

const TERM_CATEGORY_LABEL = Object.fromEntries(
  TERM_CATEGORIES.filter((c) => c.id !== 'all').map((c) => [c.id, c.label]),
) as Record<TermCategory, string>

const LIST_SCROLL_CLASS = 'max-h-[min(70vh,36rem)] overflow-y-auto overscroll-contain pr-1'

type LibraryTab = 'people' | 'terms'

type Props = {
  idea: SavedIdea
}

export function SavedIdeaWorldLibrarySection({ idea }: Props) {
  const relatedFigures = useMemo(() => relateWorldFiguresToIdea(idea, 8), [idea])
  const relatedTerms = useMemo(() => relateTermsToIdea(idea, 8), [idea])
  const [expandedFigureId, setExpandedFigureId] = useState<string | null>(null)
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<LibraryTab>('people')

  const toggleFigure = (id: string) => {
    setExpandedFigureId((current) => (current === id ? null : id))
  }

  const toggleTerm = (id: string) => {
    setExpandedTermId((current) => (current === id ? null : id))
  }

  const hasAny = relatedFigures.length > 0 || relatedTerms.length > 0

  if (!hasAny) {
    return (
      <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-400/90">
          World Library & terminology
        </h3>
        <p className="text-sm text-zinc-500">
          No strong matches yet. Browse{' '}
          <Link to="/tools/youtube-ideas/philosophers" className="text-amber-500/90 hover:text-amber-400">
            World Library
          </Link>{' '}
          or{' '}
          <Link to="/tools/youtube-ideas/terminology" className="text-amber-500/90 hover:text-amber-400">
            Terminology
          </Link>{' '}
          using names and themes from your script.
        </p>
      </section>
    )
  }

  const peoplePanel = (
    <div className="flex min-h-0 flex-col">
      <PanelHeader
        title="World Library — people to relate"
        description="Live matches from your saved idea. Tap a name to expand bio and themes."
        browseTo="/tools/youtube-ideas/philosophers"
        browseLabel="Browse all →"
      />
      {relatedFigures.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No people matched strongly — try richer tags or questions.</p>
      ) : (
        <ul className={`mt-4 space-y-2 ${LIST_SCROLL_CLASS}`}>
          {relatedFigures.map(({ figure, reason }) => {
            const open = expandedFigureId === figure.id
            return (
              <li key={figure.id} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
                <button
                  type="button"
                  onClick={() => toggleFigure(figure.id)}
                  aria-expanded={open}
                  className="flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-zinc-900"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-zinc-100">{figure.name}</span>
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-500/80">
                        {FIGURE_CATEGORY_LABEL[figure.category]}
                      </span>
                    </div>
                    <span className={`shrink-0 text-zinc-500 transition ${open ? 'rotate-180' : ''}`} aria-hidden>
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
      )}
    </div>
  )

  const termsPanel = (
    <div className="flex min-h-0 flex-col">
      <PanelHeader
        title="Terminology — words to define"
        description="Live matches from your script. Tap a term for definition and podcast angle."
        browseTo="/tools/youtube-ideas/terminology"
        browseLabel="Browse all →"
      />
      {relatedTerms.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          No glossary hits yet — add political or economic keywords to your questions.
        </p>
      ) : (
        <ul className={`mt-4 space-y-2 ${LIST_SCROLL_CLASS}`}>
          {relatedTerms.map(({ entry, reason }) => {
            const open = expandedTermId === entry.id
            return (
              <li key={entry.id} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
                <button
                  type="button"
                  onClick={() => toggleTerm(entry.id)}
                  aria-expanded={open}
                  className="flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-zinc-900"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-zinc-100">{entry.term}</span>
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                        {TERM_CATEGORY_LABEL[entry.category]}
                      </span>
                    </div>
                    <span className={`shrink-0 text-zinc-500 transition ${open ? 'rotate-180' : ''}`} aria-hidden>
                      ▾
                    </span>
                  </div>
                  {!open ? <p className="line-clamp-1 text-sm text-zinc-500">{entry.definition}</p> : null}
                  <p className="text-xs text-zinc-500">{reason}</p>
                </button>

                {open ? (
                  <div className="border-t border-zinc-800 px-4 py-4 text-sm leading-relaxed">
                    <p className="text-zinc-200">{entry.definition}</p>
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-amber-500/90">
                      For your podcast
                    </p>
                    <p className="mt-2 text-zinc-400">{entry.explore}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        to={`/tools/youtube-ideas/terminology?term=${encodeURIComponent(entry.id)}`}
                        className="text-xs text-zinc-500 hover:text-amber-400/90"
                      >
                        Open in Terminology →
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          void navigator.clipboard.writeText(
                            `${entry.term}\n${entry.definition}\n\nPodcast angle: ${entry.explore}`,
                          )
                        }
                        className="rounded border border-zinc-600 px-2 py-1 text-[11px] text-zinc-300 hover:border-amber-500/40"
                      >
                        Copy term
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-500/20 bg-zinc-900/50">
      <div className="border-b border-zinc-800 px-4 pt-4 lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/90">Research matches</p>
        <div className="mt-3 flex gap-1 rounded-lg bg-zinc-950/80 p-1" role="tablist" aria-label="Library panels">
          <TabButton
            active={mobileTab === 'people'}
            onClick={() => setMobileTab('people')}
            label="People"
            count={relatedFigures.length}
            id="library-tab-people"
          />
          <TabButton
            active={mobileTab === 'terms'}
            onClick={() => setMobileTab('terms')}
            label="Terminology"
            count={relatedTerms.length}
            id="library-tab-terms"
          />
        </div>
      </div>

      <div className="hidden min-h-0 lg:grid lg:grid-cols-2 lg:divide-x lg:divide-zinc-800">
        <div className="min-h-0 p-5">{peoplePanel}</div>
        <div className="min-h-0 p-5">{termsPanel}</div>
      </div>

      <div className="p-5 lg:hidden">
        <div
          role="tabpanel"
          id="library-panel-people"
          aria-labelledby="library-tab-people"
          hidden={mobileTab !== 'people'}
        >
          {mobileTab === 'people' ? peoplePanel : null}
        </div>
        <div
          role="tabpanel"
          id="library-panel-terms"
          aria-labelledby="library-tab-terms"
          hidden={mobileTab !== 'terms'}
        >
          {mobileTab === 'terms' ? termsPanel : null}
        </div>
      </div>
    </section>
  )
}

function PanelHeader({
  title,
  description,
  browseTo,
  browseLabel,
}: {
  title: string
  description: string
  browseTo: string
  browseLabel: string
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-400/90">{title}</h3>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
      <Link to={browseTo} className="shrink-0 text-xs font-medium text-amber-500/80 hover:text-amber-400">
        {browseLabel}
      </Link>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
  count,
  id,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  id: string
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/30'
          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
      }`}
    >
      {label}
      <span className="ml-1.5 text-xs tabular-nums text-zinc-500">({count})</span>
    </button>
  )
}
