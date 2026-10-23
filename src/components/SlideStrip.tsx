import type { SlideItem } from '../types'

type Props = {
  slides: SlideItem[]
  onRemove: (id: string) => void
  onMove: (from: number, to: number) => void
  onDuration: (id: string, durationSec: number | null) => void
}

export function SlideStrip({ slides, onRemove, onMove, onDuration }: Props) {
  if (slides.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Order · drag thumbnails · set custom seconds (optional)
      </p>
      <ul className="flex gap-2 overflow-x-auto pb-2">
        {slides.map((slide, i) => (
          <li
            key={slide.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', String(i))
              e.dataTransfer.effectAllowed = 'move'
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const from = Number(e.dataTransfer.getData('text/plain'))
              if (!Number.isNaN(from)) onMove(from, i)
            }}
            className="group relative shrink-0 cursor-grab active:cursor-grabbing"
          >
            <img
              src={slide.url}
              alt=""
              className="h-24 w-24 rounded-lg object-cover ring-2 ring-zinc-800 group-hover:ring-violet-500"
            />
            <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 text-[10px]">
              {i + 1}
            </span>
            <input
              type="number"
              min={0.5}
              step={0.5}
              placeholder="auto"
              title="Seconds for this slide"
              value={slide.durationSec ?? ''}
              onChange={(e) => {
                const v = e.target.value
                if (v === '') onDuration(slide.id, null)
                else {
                  const n = Number(v)
                  if (n > 0) onDuration(slide.id, n)
                }
              }}
              className="absolute bottom-1 left-1 w-14 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white"
            />
            <div className="absolute right-1 top-1 flex flex-col gap-0.5 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                className="rounded bg-black/80 px-1 text-[10px] hover:bg-zinc-700"
                onClick={() => onMove(i, i - 1)}
                disabled={i === 0}
              >
                ↑
              </button>
              <button
                type="button"
                className="rounded bg-black/80 px-1 text-[10px] hover:bg-red-900"
                onClick={() => onRemove(slide.id)}
              >
                ✕
              </button>
              <button
                type="button"
                className="rounded bg-black/80 px-1 text-[10px] hover:bg-zinc-700"
                onClick={() => onMove(i, i + 1)}
                disabled={i === slides.length - 1}
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
