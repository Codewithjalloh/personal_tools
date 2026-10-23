import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  EXCELLENT117_BRAND,
  RESEARCH_STUDIO_TAGLINE,
  RESEARCH_STUDIO_TITLE,
} from '../../../shared/youtubeIdeas/constants'

const nav = [
  { to: '/tools/youtube-ideas', end: true, label: 'Dashboard' },
  { to: '/tools/youtube-ideas/generate', label: 'Generate Ideas' },
  { to: '/tools/youtube-ideas/saved', label: 'My Saved Ideas' },
  { to: '/tools/youtube-ideas/philosophers', label: 'World Library' },
  { to: '/tools/youtube-ideas/terminology', label: 'Terminology' },
  { to: '/tools/youtube-ideas/series', label: 'Episode Series' },
  { to: '/tools/youtube-ideas/settings', label: 'Settings' },
]

export function YoutubeIdeasLayout() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 print:bg-white print:text-black">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-zinc-800 lg:w-64 lg:border-b-0 lg:border-r print:hidden">
          <div className="px-5 py-6">
            <Link to="/" className="text-xs text-zinc-500 hover:text-zinc-300">
              ← Personal tools
            </Link>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-500">
              {EXCELLENT117_BRAND}
            </p>
            <h1 className="mt-2 text-lg font-bold tracking-tight text-white">{RESEARCH_STUDIO_TITLE}</h1>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">{RESEARCH_STUDIO_TAGLINE}</p>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:px-3">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? 'bg-amber-500/15 font-medium text-amber-200'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 px-4 py-8 sm:px-8 print:px-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
