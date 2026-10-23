import { useState, type ReactNode } from 'react'
import type { GeneratedEpisode } from '../../../shared/youtubeIdeas/types'
import { apiGenerateContent, type ContentKind } from '../../lib/youtubeIdeas/api'
import { formatIdeaMarkdown } from './IdeaCard'
import type { EpisodeWithImages } from '../../lib/youtubeIdeas/api'

type Props = {
  episode: GeneratedEpisode | EpisodeWithImages
  images?: EpisodeWithImages['images']
  thumbnailDataUrl?: string
  extraActions?: ReactNode
}

export function IdeaResearchTools({ episode, images, thumbnailDataUrl, extraActions }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [auxContent, setAuxContent] = useState<string | null>(null)
  const [auxTitle, setAuxTitle] = useState('')

  const snapshot = (): EpisodeWithImages => ({
    ...episode,
    images: images ?? ('images' in episode ? episode.images : []),
    thumbnailDataUrl: thumbnailDataUrl ?? ('thumbnailDataUrl' in episode ? episode.thumbnailDataUrl : undefined),
  })

  const runAux = async (kind: ContentKind, title: string) => {
    setBusy(kind)
    setAuxTitle(title)
    try {
      const content = await apiGenerateContent(kind, episode)
      setAuxContent(content)
    } catch (e) {
      setAuxContent(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(null)
    }
  }

  const copyTags = async () => {
    await navigator.clipboard.writeText(episode.tags.join(', '))
  }

  const copyAll = async () => {
    await navigator.clipboard.writeText(formatIdeaMarkdown(snapshot()))
  }

  return (
    <div className="space-y-4">
      <footer className="flex flex-wrap gap-2 border-t border-zinc-800 bg-zinc-950/80 px-4 py-4">
        {extraActions}
        <ActionBtn onClick={() => runAux('expand-topic', 'Expanded research')} label="Expand Topic" disabled={!!busy} />
        <ActionBtn onClick={() => runAux('script', 'Full script')} label="Full Script" disabled={!!busy} />
        <ActionBtn onClick={() => runAux('youtube-description', 'YouTube description')} label="YT Description" disabled={!!busy} />
        <ActionBtn onClick={() => runAux('youtube-tags', 'YouTube tags')} label="YT Tags" disabled={!!busy} />
        <ActionBtn onClick={() => runAux('facebook-post', 'Facebook post')} label="Facebook Post" disabled={!!busy} />
        <ActionBtn onClick={() => void copyTags()} label="Copy Tags" />
        <ActionBtn onClick={() => void copyAll()} label="Copy All" />
        <ActionBtn onClick={() => window.print()} label="Export PDF" />
      </footer>

      {(busy || auxContent) && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-6 py-4">
          {busy && <p className="text-sm text-amber-300/80">Working on {busy}…</p>}
          {auxContent && (
            <div className="mt-2">
              <p className="text-xs uppercase tracking-widest text-zinc-500">{auxTitle}</p>
              <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-black/40 p-4 text-xs text-zinc-300">
                {auxContent}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ActionBtn({
  label,
  onClick,
  disabled,
  primary,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        primary
          ? 'rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-50'
          : 'rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:border-amber-500/40 disabled:opacity-50'
      }
    >
      {label}
    </button>
  )
}
