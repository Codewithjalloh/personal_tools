import { useState } from 'react'
import type { EpisodeWithImages } from '../../lib/youtubeIdeas/api'
import { apiGenerateAiThumbnail, apiSearchImages } from '../../lib/youtubeIdeas/api'
import { IdeaResearchTools } from './IdeaResearchTools'
import { downloadEpisodeImagesZip } from '../../lib/youtubeIdeas/downloadImagesZip'
import type { ImageAsset, ThumbnailPrefs } from '../../../shared/youtubeIdeas/types'
import { ThumbnailEditor } from './ThumbnailEditor'

type Props = {
  episode: EpisodeWithImages
  onSave: (ep: EpisodeWithImages) => void
  saved?: boolean
  onRegenerate?: () => void
}

export function IdeaCard({ episode, onSave, saved = false, onRegenerate }: Props) {
  const [images, setImages] = useState<ImageAsset[]>(episode.images)
  const [thumbnail, setThumbnail] = useState<string | undefined>(episode.thumbnailDataUrl)
  const [thumbnailPrefs, setThumbnailPrefs] = useState<ThumbnailPrefs | undefined>(episode.thumbnailPrefs)
  const [busy, setBusy] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const snapshot = (): EpisodeWithImages => ({
    ...episode,
    images,
    thumbnailDataUrl: thumbnail,
    thumbnailPrefs,
  })

  const [imageWarning, setImageWarning] = useState(episode.imageWarning)

  const replaceImages = async () => {
    setBusy('images')
    try {
      const res = await apiSearchImages(episode.imageSearchQueries, 7)
      if (res.images.length) setImages(res.images)
      setImageWarning(res.warning ?? (res.images.length ? undefined : 'No images returned from Pexels.'))
    } catch (e) {
      setImageWarning(e instanceof Error ? e.message : 'Image search failed')
    } finally {
      setBusy(null)
    }
  }

  const downloadZip = async () => {
    setBusy('zip')
    try {
      await downloadEpisodeImagesZip(episode.partNumber, episode.title, images, thumbnail)
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : 'ZIP download failed')
    } finally {
      setBusy(null)
    }
  }

  const handleSave = () => onSave(snapshot())

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-zinc-900/80 shadow-xl shadow-black/40 ${
        saved ? 'border-amber-500/40 ring-1 ring-amber-500/20' : 'border-zinc-800'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 sm:px-6">
        <p className="text-xs text-zinc-500">Part {episode.partNumber}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saved}
            className={
              saved
                ? 'rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200'
                : 'rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400'
            }
          >
            {saved ? 'Saved to library ✓' : 'Save this idea'}
          </button>
          {images.length > 0 && (
            <button
              type="button"
              onClick={() => void downloadZip()}
              disabled={!!busy}
              className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:border-amber-500/40 disabled:opacity-50"
            >
              Download images (ZIP)
            </button>
          )}
        </div>
      </div>

      <header className="border-b border-amber-500/20 bg-gradient-to-r from-zinc-950 to-zinc-900 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">
          Part {episode.partNumber}
        </p>
        <h3 className="mt-2 text-xl font-semibold leading-snug text-white sm:text-2xl">{episode.title}</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Inspired by <span className="text-amber-200/90">{episode.inspiration.name}</span>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{episode.inspiration.explanation}</p>
      </header>

      <section className="border-b border-zinc-800 bg-zinc-950/60 px-6 py-5">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-400">YouTube pack</h4>
        <p className="mt-2 text-sm font-medium text-white">{episode.youtubeTitle}</p>
        <p className="mt-2 text-xs text-zinc-500">
          Playlist category: <span className="text-zinc-300">{episode.playlistCategory}</span>
        </p>
        <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-xs text-zinc-400">
          {episode.youtubeDescription}
        </pre>
        <p className="mt-3 text-xs text-zinc-500">Tags</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {episode.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300">
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="border-b border-zinc-800 px-6 py-5">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-400">Thumbnail (1280×720)</h4>
        <div className="mt-4">
          <ThumbnailEditor
            partNumber={episode.partNumber}
            defaultHeadline={episode.youtubeTitle}
            images={images}
            thumbnailDataUrl={thumbnail}
            thumbnailPrefs={thumbnailPrefs}
            disabled={!!busy}
            onChange={(dataUrl, prefs) => {
              setThumbnail(dataUrl)
              setThumbnailPrefs(prefs)
            }}
            onAiGenerate={() => apiGenerateAiThumbnail(episode)}
          />
        </div>
      </section>

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {images.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-8 text-center text-sm text-zinc-400">
            <p>No reference images loaded.</p>
            {imageWarning && <p className="mt-2 text-xs text-amber-200/80">{imageWarning}</p>}
            <button
              type="button"
              onClick={() => void replaceImages()}
              disabled={!!busy}
              className="mt-4 rounded-lg bg-amber-500/90 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
            >
              Retry image search
            </button>
          </div>
        ) : (
          images.map((img, i) => (
            <figure key={`${img.url}-${i}`} className="group relative overflow-hidden rounded-xl bg-zinc-950">
              <img src={img.url} alt={img.alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <figcaption className="space-y-1 bg-zinc-950/90 p-2 text-[10px] leading-snug text-zinc-500">
                {img.attribution ?? img.photographer}
                {img.license ? ` · ${img.license}` : ''}
              </figcaption>
              <a
                href={img.url}
                target="_blank"
                rel="noreferrer"
                className="absolute right-2 top-2 rounded bg-black/70 px-2 py-1 text-[10px] text-amber-200 opacity-0 transition group-hover:opacity-100"
              >
                View Image
              </a>
            </figure>
          ))
        )}
      </div>
      {images.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 px-4 pb-3">
          <p className="text-[11px] text-zinc-600">{images.length} / 7 reference images</p>
          <button
            type="button"
            onClick={() => void downloadZip()}
            disabled={!!busy}
            className="text-[11px] font-medium text-amber-500/90 hover:text-amber-400 disabled:opacity-50"
          >
            Download all as ZIP
          </button>
        </div>
      )}

      <div className="space-y-6 px-6 pb-6 text-sm leading-relaxed text-zinc-300">
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-400">Opening question</h4>
          <p className="mt-2 text-base text-white">{episode.openingQuestion}</p>
        </section>
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-400">The African connection</h4>
          <div className="mt-2 space-y-3">
            {episode.africanConnection.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-400">Questions to explore</h4>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            {episode.discussionQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-400">Closing question</h4>
          <p className="mt-2 text-base font-medium text-amber-50/90">{episode.closingQuestion}</p>
        </section>
      </div>

      {downloadError && (
        <p className="border-t border-zinc-800 px-6 py-2 text-xs text-red-300">{downloadError}</p>
      )}

      <IdeaResearchTools
        episode={episode}
        images={images}
        thumbnailDataUrl={thumbnail}
        extraActions={
          <>
            {!saved && (
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400"
              >
                Save
              </button>
            )}
            {onRegenerate && (
              <button
                type="button"
                disabled={!!busy}
                onClick={onRegenerate}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:border-amber-500/40 disabled:opacity-50"
              >
                Regenerate
              </button>
            )}
            <button
              type="button"
              disabled={!!busy}
              onClick={() => void replaceImages()}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:border-amber-500/40 disabled:opacity-50"
            >
              Refresh 7 Images
            </button>
          </>
        }
      />
    </article>
  )
}

export function formatIdeaMarkdown(episode: EpisodeWithImages): string {
  return `# Part ${episode.partNumber} — ${episode.title}

## YouTube title
${episode.youtubeTitle}

## Playlist category
${episode.playlistCategory}

## Tags
${episode.tags.join(', ')}

## Description
${episode.youtubeDescription}

Inspired by ${episode.inspiration.name}

${episode.images.map((i) => `- ${i.attribution ?? i.url}`).join('\n')}

## Opening question
${episode.openingQuestion}

## The African connection
${episode.africanConnection.join('\n\n')}

## Questions to explore
${episode.discussionQuestions.map((q) => `- ${q}`).join('\n')}

## Closing question
${episode.closingQuestion}
`
}
