import { Link } from 'react-router-dom'
import { dashboardStats } from '../../lib/youtubeIdeas/store'

export function DashboardView() {
  const stats = dashboardStats()

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold text-white">Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-500">Excellent117 research at a glance</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saved topics" value={stats.saved} />
        <StatCard label="Upcoming episodes" value={stats.upcoming} />
        <StatCard label="Total in library" value={stats.totalGenerated} />
        <StatCard label="Themes tracked" value={stats.topThemes.length} />
      </div>

      <Link
        to="/tools/youtube-ideas/generate"
        className="inline-flex rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-950/30 hover:bg-amber-400"
      >
        Generate New Ideas
      </Link>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="text-sm font-semibold text-amber-400/90">Recently saved</h3>
          {stats.recent.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No ideas saved yet. Generate your first batch.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {stats.recent.map((idea) => (
                <li key={idea.id} className="text-sm text-zinc-300">
                  Part {idea.partNumber} — {idea.title}
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
