import { useCallback, useState } from 'react'
import type { SavedIdea } from '../../../shared/youtubeIdeas/types'
import { formatSavedIdeaAsText } from '../../lib/youtubeIdeas/savedIdeaText'
import type { ReaderPrefs } from '../../lib/youtubeIdeas/readerPrefs'
import { loadReaderPrefs, saveReaderPrefs } from '../../lib/youtubeIdeas/readerPrefs'
import { ReadingToolbar } from './ReadingToolbar'

type Props = {
  idea: SavedIdea
}

export function SavedIdeaTextPanel({ idea }: Props) {
  const [prefs, setPrefs] = useState<ReaderPrefs>(() => loadReaderPrefs())
  const [highlighted, setHighlighted] = useState<Set<string>>(() => new Set())

  const updatePrefs = useCallback((next: ReaderPrefs) => {
    setPrefs(next)
    saveReaderPrefs(next)
  }, [])

  const toggleHighlight = (id: string) => {
    if (!prefs.highlightMode) return
    setHighlighted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyAll = () => void navigator.clipboard.writeText(formatSavedIdeaAsText(idea))

  const blockClass = (id: string) =>
    [
      'rounded-lg px-3 py-2 -mx-3 transition',
      prefs.highlightMode ? 'cursor-pointer hover:bg-amber-500/10' : '',
      highlighted.has(id) ? 'bg-amber-400/20 ring-1 ring-amber-500/35' : '',
    ].join(' ')

  return (
    <article
      className={`flex flex-col rounded-2xl border shadow-xl ${
        prefs.recordingMode
          ? 'border-amber-500/30 bg-zinc-950 shadow-amber-950/20'
          : 'border-amber-500/25 bg-zinc-900/80 shadow-black/40'
      }`}
    >
      <div className="space-y-3 border-b border-zinc-800 px-4 py-4">
        <ReadingToolbar
          prefs={prefs}
          onChange={updatePrefs}
          onClearHighlights={() => setHighlighted(new Set())}
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={copyAll}
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 hover:border-amber-500/40"
          >
            Copy text
          </button>
        </div>
      </div>

      <div
        className="px-6 py-6 text-zinc-300"
        style={{
          fontSize: `${prefs.fontSize}px`,
          lineHeight: prefs.lineHeight,
        }}
      >
        <TextSection title="Inspired by">
          <div
            role={prefs.highlightMode ? 'button' : undefined}
            tabIndex={prefs.highlightMode ? 0 : undefined}
            className={blockClass('insp-name')}
            onClick={() => toggleHighlight('insp-name')}
            onKeyDown={(e) => e.key === 'Enter' && toggleHighlight('insp-name')}
          >
            <p className="font-medium text-amber-100/95">{idea.inspiration.name}</p>
          </div>
          <div
            role={prefs.highlightMode ? 'button' : undefined}
            tabIndex={prefs.highlightMode ? 0 : undefined}
            className={`mt-3 ${blockClass('insp-body')}`}
            onClick={() => toggleHighlight('insp-body')}
            onKeyDown={(e) => e.key === 'Enter' && toggleHighlight('insp-body')}
          >
            <p>{idea.inspiration.explanation}</p>
          </div>
        </TextSection>

        <TextSection title="Opening question">
          <div
            role={prefs.highlightMode ? 'button' : undefined}
            tabIndex={prefs.highlightMode ? 0 : undefined}
            className={blockClass('opening')}
            onClick={() => toggleHighlight('opening')}
            onKeyDown={(e) => e.key === 'Enter' && toggleHighlight('opening')}
          >
            <p className="font-medium text-white">{idea.openingQuestion}</p>
          </div>
        </TextSection>

        <TextSection title="The African connection">
          <div className="space-y-4">
            {idea.africanConnection.map((p, i) => {
              const id = `african-${i}`
              return (
                <div
                  key={id}
                  role={prefs.highlightMode ? 'button' : undefined}
                  tabIndex={prefs.highlightMode ? 0 : undefined}
                  className={blockClass(id)}
                  onClick={() => toggleHighlight(id)}
                  onKeyDown={(e) => e.key === 'Enter' && toggleHighlight(id)}
                >
                  <p>{p}</p>
                </div>
              )
            })}
          </div>
        </TextSection>

        <TextSection title="Questions to explore">
          <ol className="list-decimal space-y-3 pl-5 marker:font-semibold marker:text-amber-500">
            {idea.discussionQuestions.map((q, i) => {
              const id = `q-${i}`
              return (
                <li key={id} className="pl-1">
                  <div
                    role={prefs.highlightMode ? 'button' : undefined}
                    tabIndex={prefs.highlightMode ? 0 : undefined}
                    className={blockClass(id)}
                    onClick={() => toggleHighlight(id)}
                    onKeyDown={(e) => e.key === 'Enter' && toggleHighlight(id)}
                  >
                    {q}
                  </div>
                </li>
              )
            })}
          </ol>
        </TextSection>

        <TextSection title="Closing question">
          <div
            role={prefs.highlightMode ? 'button' : undefined}
            tabIndex={prefs.highlightMode ? 0 : undefined}
            className={blockClass('closing')}
            onClick={() => toggleHighlight('closing')}
            onKeyDown={(e) => e.key === 'Enter' && toggleHighlight('closing')}
          >
            <p className="font-semibold text-amber-50">{idea.closingQuestion}</p>
          </div>
        </TextSection>
      </div>

      {prefs.highlightMode && (
        <p className="border-t border-zinc-800 px-6 py-3 text-center text-[11px] text-zinc-600">
          Tap any paragraph to highlight it while you read or record.
        </p>
      )}
    </article>
  )
}

function TextSection({ title, children }: { title: string; children: import('react').ReactNode }) {
  return (
    <section className="mb-10 last:mb-0">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-400">{title}</h4>
      <div className="mt-3">{children}</div>
    </section>
  )
}
