import { useState } from 'react'
import type { SavedIdea, ThumbnailPrefs } from '../../../shared/youtubeIdeas/types'
import { downloadEpisodeImagesZip } from '../../lib/youtubeIdeas/downloadImagesZip'
import { saveIdea } from '../../lib/youtubeIdeas/store'
import { ThumbnailEditor } from './ThumbnailEditor'

type Props = {
  idea: SavedIdea
  onUpdated?: () => void
}

export function SavedIdeaProductionPanel({ idea, onUpdated }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const youtubeTitle = idea.youtubeTitle?.trim() || idea.title
  const description =
    idea.youtubeDescription?.trim() ||
    'No YouTube description was saved with this idea. Generate a new episode and save again, or copy from your notes.'
  const tags = idea.tags ?? []
  const playlist = idea.playlistCategory?.trim() || idea.category || '—'
  const images = idea.images ?? []
  const thumbnail = idea.thumbnailDataUrl

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setError(null)
    } catch {
      setError(`Could not copy ${label}`)
    }
  }

  const downloadZip = async () => {
    setBusy(true)
    setError(null)
    try {
      await downloadEpisodeImagesZip(idea.partNumber, idea.title, images, thumbnail)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ZIP download failed')
    } finally {
      setBusy(false)
    }
  }

  const persistThumbnail = (dataUrl: string | undefined, prefs: ThumbnailPrefs) => {
    saveIdea({
      ...idea,
      thumbnailDataUrl: dataUrl,
      thumbnailPrefs: prefs,
    })
    onUpdated?.()
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-xl shadow-black/40">
      <header className="border-b border-amber-500/20 bg-gradient-to-r from-zinc-950 to-zinc-900 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Episode idea</p>
        <h3 className="mt-2 text-xl font-semibold leading-snug text-white">{idea.title}</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Category: <span className="text-zinc-200">{idea.category}</span>
          {idea.region ? (
            <>
              {' '}
              · Region: <span className="text-zinc-200">{idea.region}</span>
            </>
          ) : null}
        </p>
      </header>

      <section className="border-b border-zinc-800 bg-zinc-950/60 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-400">YouTube pack</h4>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copy(youtubeTitle, 'title')}
              className="rounded border border-zinc-600 px-2 py-1 text-[11px] text-zinc-300 hover:border-amber-500/40"
            >
              Copy title
            </button>
            <button
              type="button"
              onClick={() => void copy(description, 'description')}
              className="rounded border border-zinc-600 px-2 py-1 text-[11px] text-zinc-300 hover:border-amber-500/40"
            >
              Copy description
            </button>
            {tags.length > 0 && (
              <button
                type="button"
                onClick={() => void copy(tags.join(', '), 'tags')}
                className="rounded border border-zinc-600 px-2 py-1 text-[11px] text-zinc-300 hover:border-amber-500/40"
              >
                Copy tags
              </button>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-500">YouTube title</p>
        <p className="mt-1 text-sm font-medium text-white">{youtubeTitle}</p>
        <p className="mt-3 text-xs text-zinc-500">
          Playlist category: <span className="text-zinc-300">{playlist}</span>
        </p>
        <p className="mt-3 text-xs text-zinc-500">Description</p>
        <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-xs leading-relaxed text-zinc-400">
          {description}
        </pre>
        <p className="mt-3 text-xs text-zinc-500">Tags</p>
        {tags.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-zinc-600">No tags saved.</p>
        )}
      </section>

      <section className="border-b border-zinc-800 px-6 py-5">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-400">Thumbnail (1280×720)</h4>
        <div className="mt-4">
          <ThumbnailEditor
            partNumber={idea.partNumber}
            defaultHeadline={youtubeTitle}
            images={images}
            thumbnailDataUrl={thumbnail}
            thumbnailPrefs={idea.thumbnailPrefs}
            onChange={persistThumbnail}
          />
        </div>
        <p className="mt-3 text-[10px] text-zinc-600">Changes save automatically to this idea.</p>
      </section>

      <section className="px-4 py-5 sm:px-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Reference images ({images.length}/7)
          </h4>
          {(images.length > 0 || thumbnail) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void downloadZip()}
              className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 hover:border-amber-500/40 disabled:opacity-50"
            >
              {busy ? 'Building ZIP…' : 'Download images (ZIP)'}
            </button>
          )}
        </div>
        {images.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-6 text-center text-sm text-zinc-500">
            No reference images saved. Save again from Generate after Pexels loads images.
          </p>
        ) : (
          <p className="text-xs text-zinc-500">Pick a background in the thumbnail editor above.</p>
        )}
      </section>

      {error ? <p className="border-t border-zinc-800 px-6 py-2 text-xs text-red-400">{error}</p> : null}
    </article>
  )
}
