import { Link } from 'react-router-dom'
import type { IdeaStatus, SavedIdea } from '../../../shared/youtubeIdeas/types'
import { IDEA_STATUSES } from '../../../shared/youtubeIdeas/types'
import { updateIdeaStatus } from '../../lib/youtubeIdeas/store'

type Props = {
  ideas: SavedIdea[]
  onChanged: () => void
}

export function SavedIdeasKanban({ ideas, onChanged }: Props) {
  const byStatus = IDEA_STATUSES.map((status) => ({
    status,
    items: ideas.filter((i) => i.status === status).sort((a, b) => a.partNumber - b.partNumber),
  }))

  const onDrop = (ideaId: string, status: IdeaStatus) => {
    updateIdeaStatus(ideaId, status)
    onChanged()
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {byStatus.map(({ status, items }) => (
        <div
          key={status}
          className="min-w-[220px] flex-1 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const id = e.dataTransfer.getData('text/idea-id')
            if (id) onDrop(id, status)
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{status}</p>
          <p className="text-xs text-zinc-600">{items.length}</p>
          <ul className="mt-3 space-y-2">
            {items.map((idea) => (
              <li
                key={idea.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/idea-id', idea.id)}
                className="cursor-grab rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 active:cursor-grabbing"
              >
                <Link to={`/tools/youtube-ideas/saved/${idea.id}`} className="block" draggable={false}>
                  <p className="text-[10px] text-amber-500/80">Part {idea.partNumber}</p>
                  <p className="mt-1 text-sm font-medium leading-snug text-zinc-200 hover:text-amber-100">
                    {idea.title}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
