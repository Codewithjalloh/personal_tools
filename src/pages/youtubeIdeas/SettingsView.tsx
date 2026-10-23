import { useEffect, useRef, useState } from 'react'
import { apiConfigStatus } from '../../lib/youtubeIdeas/api'
import {
  buildBackup,
  downloadBackupJson,
  estimateResearchStudioStorageBytes,
  formatBytes,
  parseBackupJson,
} from '../../lib/youtubeIdeas/backup'
import {
  getStoredOpenAiKey,
  getStoredPexelsKey,
  setStoredOpenAiKey,
  setStoredPexelsKey,
} from '../../lib/youtubeIdeas/secretsStorage'
import { importResearchStudioBackup, listSavedIdeas, listSeries } from '../../lib/youtubeIdeas/store'

export function SettingsView() {
  const [openAiKey, setOpenAiKey] = useState(() => getStoredOpenAiKey())
  const [pexelsKey, setPexelsKey] = useState(() => getStoredPexelsKey())
  const [saved, setSaved] = useState(false)
  const [status, setStatus] = useState<{ openai: boolean; pexels: boolean } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const storageBytes = estimateResearchStudioStorageBytes()

  useEffect(() => {
    void apiConfigStatus().then(setStatus)
  }, [saved])

  const save = () => {
    setStoredOpenAiKey(openAiKey)
    setStoredPexelsKey(pexelsKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const exportBackup = () => {
    downloadBackupJson(buildBackup(listSavedIdeas(), listSeries()))
  }

  const onImportFile = async (file: File) => {
    setImportError(null)
    try {
      const text = await file.text()
      const backup = parseBackupJson(text)
      const mode = confirm(
        'Merge with existing data? OK = merge, Cancel = replace all Research Studio data.',
      )
        ? 'merge'
        : 'replace'
      importResearchStudioBackup(backup, mode)
      alert(`Imported ${backup.ideas.length} ideas and ${backup.series.length} series.`)
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Import failed')
    }
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
        {status && (
          <p className="text-xs text-zinc-500">
            Server sees: OpenAI {status.openai ? '✓' : '✗'} · Pexels {status.pexels ? '✓' : '✗'}
            {!status.pexels && ' — add Pexels key above and click Save, or set PEXELS_API_KEY on Vercel.'}
          </p>
        )}
        <p className="text-xs leading-relaxed text-zinc-500">
          Keys in <code className="text-zinc-400">.env.local</code> or Vercel environment variables take priority over
          saved browser keys. If Pexels shows &quot;Invalid API key&quot;, clear the Pexels field here, click Save, then
          restart <code className="text-zinc-400">npm run dev</code> so <code className="text-zinc-400">PEXELS_API_KEY</code>{' '}
          from <code className="text-zinc-400">.env.local</code> is used.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="text-sm font-semibold text-amber-400/90">Data & backup</h3>
        <p className="text-xs text-zinc-500">
          Ideas and thumbnails are stored in this browser (~{formatBytes(storageBytes)}). Export regularly before clearing
          site data.
        </p>
        {storageBytes > 4 * 1024 * 1024 && (
          <p className="text-xs text-amber-200/80">
            Storage is getting large. Export a backup and consider removing unused thumbnails.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportBackup}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:border-amber-500/40"
          >
            Export JSON backup
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:border-amber-500/40"
          >
            Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onImportFile(file)
              e.target.value = ''
            }}
          />
        </div>
        {importError && <p className="text-xs text-red-300">{importError}</p>}
      </section>
    </div>
  )
}
