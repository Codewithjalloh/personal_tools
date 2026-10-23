import { useState } from 'react'
import {
  getStoredOpenAiKey,
  getStoredPexelsKey,
  setStoredOpenAiKey,
  setStoredPexelsKey,
} from '../../lib/youtubeIdeas/secretsStorage'

export function SettingsView() {
  const [openAiKey, setOpenAiKey] = useState(() => getStoredOpenAiKey())
  const [pexelsKey, setPexelsKey] = useState(() => getStoredPexelsKey())
  const [saved, setSaved] = useState(false)

  const save = () => {
    setStoredOpenAiKey(openAiKey)
    setStoredPexelsKey(pexelsKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-xl space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">Settings</h2>
        <p className="mt-1 text-sm text-zinc-500">Keys stay in your browser and are sent only to this app&apos;s API routes.</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">OpenAI API key (required)</span>
          <input
            type="password"
            autoComplete="off"
            placeholder="sk-proj-…"
            value={openAiKey}
            onChange={(e) => setOpenAiKey(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Pexels API key (optional)</span>
          <input
            type="password"
            autoComplete="off"
            placeholder="For licensed episode images"
            value={pexelsKey}
            onChange={(e) => setPexelsKey(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
          />
        </label>
        <button
          type="button"
          onClick={save}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
        >
          {saved ? 'Saved' : 'Save keys'}
        </button>
        <p className="text-xs leading-relaxed text-zinc-500">
          Fastest setup: paste your OpenAI key above and click Save — no restart needed. Alternatively, set{' '}
          <code className="text-zinc-400">OPENAI_API_KEY</code> in <code className="text-zinc-400">.env.local</code>{' '}
          and restart <code className="text-zinc-400">npm run dev</code>. On Vercel, use Project → Environment
          Variables (Settings keys are for local dev only).
        </p>
      </section>
    </div>
  )
}
