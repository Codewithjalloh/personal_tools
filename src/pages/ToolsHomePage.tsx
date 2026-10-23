import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TOOLS } from '../lib/tools'

export function ToolsHomePage() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return TOOLS
    return TOOLS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.includes(q)),
    )
  }, [query])

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-12 sm:px-6">
      <header className="mb-10 text-center sm:text-left">
        <p className="text-sm font-medium uppercase tracking-widest text-violet-400">Personal tools</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Small utilities, in your browser
        </h1>
        <p className="mt-3 text-zinc-400">
          Pick a tool below. Everything runs locally — your files stay on your device.
        </p>
        <input
          type="search"
          placeholder="Search tools…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-6 w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600"
        />
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {filtered.map((tool) => (
          <li key={tool.id}>
            {tool.available ? (
              <Link
                to={tool.path}
                className="group flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:border-violet-500/50 hover:bg-zinc-900 hover:shadow-lg hover:shadow-violet-950/30"
              >
                <span className="text-3xl" aria-hidden>
                  {tool.icon}
                </span>
                <h2 className="mt-4 text-lg font-semibold text-white group-hover:text-violet-200">
                  {tool.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">{tool.description}</p>
                <span className="mt-4 text-sm font-medium text-violet-400 group-hover:text-violet-300">
                  Open tool →
                </span>
              </Link>
            ) : (
              <div className="flex h-full flex-col rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-6 opacity-70">
                <span className="text-3xl" aria-hidden>
                  {tool.icon}
                </span>
                <h2 className="mt-4 text-lg font-semibold text-zinc-300">{tool.title}</h2>
                <p className="mt-2 flex-1 text-sm text-zinc-500">{tool.description}</p>
                <span className="mt-4 text-xs uppercase tracking-wide text-zinc-600">Coming soon</span>
              </div>
            )}
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <p className="text-center text-sm text-zinc-500">No tools match your search.</p>
      )}
    </div>
  )
}
