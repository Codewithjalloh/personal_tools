import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { IDEA_STATUSES, type IdeaStatus } from '../../../shared/youtubeIdeas/types'
import { IdeaResearchTools } from '../../components/youtubeIdeas/IdeaResearchTools'
import { SavedIdeaProductionPanel } from '../../components/youtubeIdeas/SavedIdeaProductionPanel'
import { SavedIdeaTextPanel } from '../../components/youtubeIdeas/SavedIdeaTextPanel'
import { SavedIdeaWorldLibrarySection } from '../../components/youtubeIdeas/SavedIdeaWorldLibrarySection'
import { setLastOpenedIdeaId } from '../../lib/youtubeIdeas/lastOpenedIdea'
import { downloadResearchPacket } from '../../lib/youtubeIdeas/researchPacket'
import { savedIdeaToGeneratedEpisode } from '../../lib/youtubeIdeas/savedIdeaEpisode'
import { queueSlideshowImport } from '../../lib/youtubeIdeas/slideshowBridge'
import {
  deleteIdea,
  getSavedIdeaById,
  updateIdeaPublished,
  updateIdeaStatus,
} from '../../lib/youtubeIdeas/store'

export function SavedIdeaDetailView() {
  const { ideaId } = useParams<{ ideaId: string }>()
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const [packetBusy, setPacketBusy] = useState(false)

  const idea = useMemo(() => {
    void refresh
    return ideaId ? getSavedIdeaById(ideaId) : undefined
  }, [ideaId, refresh])

  useEffect(() => {
    if (ideaId) setLastOpenedIdeaId(ideaId)
  }, [ideaId])

  if (!ideaId || !idea) {
    return <Navigate to="/tools/youtube-ideas/saved" replace />
  }

  const episode = savedIdeaToGeneratedEpisode(idea)

  const remove = () => {
    if (!confirm(`Delete "${idea.title}"? This cannot be undone.`)) return
    deleteIdea(idea.id)
    navigate('/tools/youtube-ideas/saved', { replace: true })
  }

  const openInSlideshow = () => {
    const urls = (idea.images ?? []).map((i) => i.url)
    if (urls.length === 0) {
      alert('No reference images on this idea. Add images when generating or refresh images on a generate card.')
      return
    }
    queueSlideshowImport({
      introTitle: idea.youtubeTitle?.trim() || idea.title,
      imageUrls: urls,
    })
    navigate('/tools/slideshow-video')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <Link
        to="/tools/youtube-ideas/saved"
        className="inline-flex text-sm text-zinc-500 transition hover:text-amber-400/90"
      >
        ← Back to My Saved Ideas
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={idea.status}
          onChange={(e) => {
            updateIdeaStatus(idea.id, e.target.value as IdeaStatus)
            setRefresh((n) => n + 1)
          }}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        >
          {IDEA_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void openInSlideshow()}
            className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:border-amber-500/40"
          >
            Open in Slideshow → Video
          </button>
          <button
            type="button"
            disabled={packetBusy}
            onClick={() => {
              setPacketBusy(true)
              void downloadResearchPacket(idea).finally(() => setPacketBusy(false))
            }}
            className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:border-amber-500/40 disabled:opacity-50"
          >
            {packetBusy ? 'Building packet…' : 'Download research packet (ZIP)'}
          </button>
          <button
            type="button"
            onClick={() => {
              remove()
            }}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Delete idea
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="text-sm font-semibold text-amber-400/90">Publication (optional)</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-zinc-500">
              YouTube URL
              <input
                type="url"
                value={idea.publishedYoutubeUrl ?? ''}
                onChange={(e) => {
                  updateIdeaPublished(idea.id, { publishedYoutubeUrl: e.target.value })
                  setRefresh((n) => n + 1)
                }}
                placeholder="https://youtube.com/watch?v=…"
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs text-zinc-500">
              Publish date
              <input
                type="date"
                value={idea.publishedAt ?? ''}
                onChange={(e) => {
                  updateIdeaPublished(idea.id, { publishedAt: e.target.value })
                  setRefresh((n) => n + 1)
                }}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>
          </div>
        </section>

      <SavedIdeaProductionPanel idea={idea} onUpdated={() => setRefresh((n) => n + 1)} />

      <SavedIdeaTextPanel idea={idea} onHighlightsChange={() => setRefresh((n) => n + 1)} />

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h3 className="text-sm font-semibold text-amber-400/90">Research tools</h3>
          <p className="mt-1 text-xs text-zinc-500">AI scripts, social copy, and exports for this saved idea.</p>
        </div>
        <IdeaResearchTools
          episode={episode}
          images={idea.images}
          thumbnailDataUrl={idea.thumbnailDataUrl}
        />
      </section>

      <SavedIdeaWorldLibrarySection idea={idea} />
    </div>
  )
}
