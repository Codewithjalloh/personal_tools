import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import type { IdeaStatus } from '../../../shared/youtubeIdeas/types'
import { SavedIdeaTextPanel } from '../../components/youtubeIdeas/SavedIdeaTextPanel'
import { SavedIdeaWorldLibrarySection } from '../../components/youtubeIdeas/SavedIdeaWorldLibrarySection'
import { deleteIdea, getSavedIdeaById, updateIdeaStatus } from '../../lib/youtubeIdeas/store'

const STATUSES: IdeaStatus[] = ['Idea', 'Researching', 'Script Ready', 'Recorded', 'Published']

export function SavedIdeaDetailView() {
  const { ideaId } = useParams<{ ideaId: string }>()
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)

  const idea = useMemo(() => {
    void refresh
    return ideaId ? getSavedIdeaById(ideaId) : undefined
  }, [ideaId, refresh])

  if (!ideaId || !idea) {
    return <Navigate to="/tools/youtube-ideas/saved" replace />
  }

  const remove = () => {
    if (!confirm(`Delete "${idea.title}"? This cannot be undone.`)) return
    deleteIdea(idea.id)
    navigate('/tools/youtube-ideas/saved', { replace: true })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <Link
        to="/tools/youtube-ideas/saved"
        className="inline-flex text-sm text-zinc-500 transition hover:text-amber-400/90"
      >
        ← Back to My Saved Ideas
      </Link>

      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500/90">Part {idea.partNumber}</p>
        <h2 className="mt-2 text-2xl font-semibold leading-snug text-white">{idea.title}</h2>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={idea.status}
          onChange={(e) => {
            updateIdeaStatus(idea.id, e.target.value as IdeaStatus)
            setRefresh((n) => n + 1)
          }}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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

      <SavedIdeaTextPanel idea={idea} />

      <SavedIdeaWorldLibrarySection idea={idea} />
    </div>
  )
}
