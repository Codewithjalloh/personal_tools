import { Link, Navigate, useParams } from 'react-router-dom'
import { getWorldFigureById } from '../../../shared/youtubeIdeas/worldFigures'

export function PhilosopherDetailView() {
  const { philosopherId } = useParams<{ philosopherId: string }>()
  const figure = philosopherId ? getWorldFigureById(philosopherId) : undefined

  if (!figure) {
    return <Navigate to="/tools/youtube-ideas/philosophers" replace />
  }

  const copyText = () => {
    const body = [
      figure.name,
      figure.lifespan,
      `${figure.region} · ${figure.tradition}`,
      '',
      'Short bio',
      figure.bio,
      '',
      'Core themes',
      ...figure.themes.map((t, i) =>
        t.explore ? `${i + 1}. ${t.title} — ${t.explore}` : `${i + 1}. ${t.title}`,
      ),
    ].join('\n')
    void navigator.clipboard.writeText(body)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <Link
        to="/tools/youtube-ideas/philosophers"
        className="inline-flex text-sm text-zinc-500 transition hover:text-amber-400/90"
      >
        ← Back to World Library
      </Link>

      <header>
        <div className="flex flex-wrap gap-2">
          <span className="rounded bg-zinc-800 px-2 py-1 text-[10px] uppercase tracking-wide text-amber-500">
            {figure.category.replace('-', ' ')}
          </span>
          {figure.era === 'contemporary' && (
            <span className="rounded bg-emerald-950 px-2 py-1 text-[10px] text-emerald-400">Living</span>
          )}
        </div>
        <h2 className="mt-3 text-3xl font-semibold text-white">{figure.name}</h2>
        <p className="mt-2 text-sm text-zinc-500">{figure.lifespan}</p>
        <p className="mt-1 text-sm text-amber-500/80">
          {figure.region} · {figure.tradition}
        </p>
      </header>

      <button
        type="button"
        onClick={copyText}
        className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 hover:border-amber-500/40"
      >
        Copy profile
      </button>

      <article className="rounded-2xl border border-amber-500/25 bg-zinc-900/80 px-6 py-6 text-sm leading-relaxed text-zinc-300">
        <section className="mb-8">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-400">Short bio</h4>
          <p className="mt-3 text-base text-zinc-200">{figure.bio}</p>
        </section>
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-400">Core themes of their ideas</h4>
          <ol className="mt-3 list-decimal space-y-3 pl-5 marker:text-amber-500/80">
            {figure.themes.map((theme) => (
              <li key={theme.title} className="pl-1">
                <span className="text-zinc-200">{theme.title}</span>
                {theme.explore ? (
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">{theme.explore}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      </article>
    </div>
  )
}
