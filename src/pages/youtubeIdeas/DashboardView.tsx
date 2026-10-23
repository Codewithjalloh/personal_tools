import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IDEA_STATUSES } from '../../../shared/youtubeIdeas/types'
import { apiConfigStatus } from '../../lib/youtubeIdeas/api'
import { dashboardStats, getSavedIdeaById } from '../../lib/youtubeIdeas/store'
import { getLastOpenedIdeaId } from '../../lib/youtubeIdeas/lastOpenedIdea'

export function DashboardView() {
  const stats = dashboardStats()
  const [configOk, setConfigOk] = useState<boolean | null>(null)
  const lastId = getLastOpenedIdeaId()
  const lastIdea = lastId ? getSavedIdeaById(lastId) : undefined

  useEffect(() => {
    void apiConfigStatus().then((s) => setConfigOk(s.openai))
  }, [])

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold text-white">Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-500">Excellent117 research at a glance</p>
      </header>

      {configOk === false && (
        <p className="rounded-xl border border-amber-900/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/90">
          OpenAI is not configured. Add your key in{' '}
          <Link to="/tools/youtube-ideas/settings" className="font-medium text-amber-300 underline">
            Settings
          </Link>{' '}
          or <code className="text-amber-200/80">.env.local</code> before generating ideas.
        </p>
      )}

      {lastIdea && (
        <Link
          to={`/tools/youtube-ideas/saved/${lastIdea.id}`}
          className="block rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-amber-500/40"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/90">Continue researching</p>
          <p className="mt-2 text-sm text-white">
            Part {lastIdea.partNumber} — {lastIdea.title}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Status: {lastIdea.status}</p>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saved ideas" value={stats.totalIdeas} />
        <StatCard label="In pipeline" value={stats.upcoming} />
        <StatCard label="Published" value={stats.published} />
        <StatCard label="Top themes" value={stats.topThemes.length} />
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="text-sm font-semibold text-amber-400/90">Production pipeline</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {IDEA_STATUSES.map((status) => (
            <Link
              key={status}
              to={`/tools/youtube-ideas/saved?status=${encodeURIComponent(status)}`}
              className="flex min-w-[120px] flex-1 flex-col rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-3 transition hover:border-amber-500/30"
            >
              <span className="text-[10px] uppercase tracking-wide text-zinc-500">{status}</span>
              <span className="mt-1 text-2xl font-semibold text-white">{stats.byStatus[status] ?? 0}</span>
            </Link>
          ))}
        </div>
      </section>

      <Link
        to="/tools/youtube-ideas/generate"
        className="inline-flex rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-950/30 hover:bg-amber-400"
      >
        Generate New Ideas
      </Link>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="text-sm font-semibold text-amber-400/90">Recently updated</h3>
          {stats.recent.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No ideas saved yet. Generate your first batch.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {stats.recent.map((idea) => (
                <li key={idea.id}>
                  <Link
                    to={`/tools/youtube-ideas/saved/${idea.id}`}
                    className="text-sm text-zinc-300 hover:text-amber-200"
                  >
                    Part {idea.partNumber} — {idea.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="text-sm font-semibold text-amber-400/90">Favourite themes</h3>
          {stats.topThemes.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">Categories appear as you save ideas.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {stats.topThemes.map((t) => (
                <li key={t.name} className="flex justify-between text-sm text-zinc-300">
                  <span>{t.name}</span>
                  <span className="text-zinc-600">{t.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
      <p className="text-xs uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  )
}
