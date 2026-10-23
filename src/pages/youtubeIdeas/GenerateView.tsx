import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiConfigStatus } from '../../lib/youtubeIdeas/api'
import {
  DEFAULT_SERIES_TITLE,
  IDEA_COUNTS,
  PHILOSOPHICAL_INSPIRATIONS,
  REGIONS,
  TOPIC_CATEGORIES,
} from '../../../shared/youtubeIdeas/constants'
import type { GenerateIdeasRequest } from '../../../shared/youtubeIdeas/types'
import { apiGenerateIdeas, apiSearchImages, type EpisodeWithImages } from '../../lib/youtubeIdeas/api'
import { IdeaCard } from '../../components/youtubeIdeas/IdeaCard'
import { GenerationProgress, type GenerationPhase } from '../../components/youtubeIdeas/GenerationProgress'
import {
  loadGenerateFormPrefs,
  saveGenerateFormPrefs,
  type GenerateFormPrefs,
} from '../../lib/youtubeIdeas/generateFormPrefs'
import { rankEpisodeImages } from '../../../shared/youtubeIdeas/episodeImages'
import { mapWithConcurrency } from '../../lib/youtubeIdeas/mapWithConcurrency'
import {
  listSeries,
  priorTitlesForSeries,
  saveIdea,
  suggestNextPartNumber,
} from '../../lib/youtubeIdeas/store'

const INITIAL_PHASES: GenerationPhase[] = [
  { id: 'openai', label: 'AI research — ideas, YouTube title, description, tags', status: 'pending' },
  { id: 'images', label: 'Licensed reference images (up to 7 per idea)', status: 'pending' },
  { id: 'finish', label: 'Prepare your cards', status: 'pending' },
]

function defaultForm(): GenerateFormPrefs {
  const saved = loadGenerateFormPrefs()
  const seriesId = saved?.seriesId
  const startPartNumber = saved?.startPartNumber ?? suggestNextPartNumber(seriesId)
  return {
    count: saved?.count ?? 1,
    category: saved?.category ?? TOPIC_CATEGORIES[3],
    philosophicalInspiration: saved?.philosophicalInspiration ?? PHILOSOPHICAL_INSPIRATIONS[0],
    region: saved?.region ?? REGIONS[0],
    startPartNumber,
    additionalInstructions: saved?.additionalInstructions ?? '',
    seriesTitle: saved?.seriesTitle ?? DEFAULT_SERIES_TITLE,
    seriesId,
  }
}

export function GenerateView() {
  const [searchParams] = useSearchParams()
  const seedInstructions = searchParams.get('instructions')
  const [form, setForm] = useState(() => {
    const base = defaultForm()
    if (seedInstructions?.trim()) {
      return { ...base, additionalInstructions: seedInstructions.trim() }
    }
    return base
  })
  const seriesOptions = useMemo(() => listSeries(), [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openAiOk, setOpenAiOk] = useState(true)
  const [episodes, setEpisodes] = useState<EpisodeWithImages[]>([])
  const [seriesTitle, setSeriesTitle] = useState(form.seriesTitle ?? DEFAULT_SERIES_TITLE)
  const [phases, setPhases] = useState<GenerationPhase[]>(INITIAL_PHASES)
  const [percent, setPercent] = useState(0)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(() => new Set())
  const [configHint, setConfigHint] = useState<string | null>(null)

  useEffect(() => {
    void apiConfigStatus().then((s) => {
      setOpenAiOk(s.openai)
      if (!s.pexels) {
        setConfigHint(
          'Pexels is not configured on the server — images will be empty until you add PEXELS_API_KEY in .env.local (restart dev) or Settings, or in Vercel env vars for production.',
        )
      }
    })
  }, [])

  useEffect(() => {
    saveGenerateFormPrefs(form)
  }, [form])

  const setPhase = (id: string, patch: Partial<GenerationPhase>) => {
    setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const onSeriesChange = (seriesId: string) => {
    if (!seriesId) {
      setForm((f) => ({
        ...f,
        seriesId: undefined,
        startPartNumber: suggestNextPartNumber(),
      }))
      return
    }
    const series = seriesOptions.find((s) => s.id === seriesId)
    setForm((f) => ({
      ...f,
      seriesId,
      seriesTitle: series?.name ?? f.seriesTitle,
      startPartNumber: suggestNextPartNumber(seriesId),
    }))
  }

  const generate = async () => {
    if (!openAiOk) {
      setError('Configure OpenAI in Settings or .env.local before generating.')
      return
    }

    setLoading(true)
    setError(null)
    setEpisodes([])
    setSavedKeys(new Set())
    setPhases(INITIAL_PHASES.map((p) => ({ ...p, status: 'pending', detail: undefined })))
    setPercent(5)

    const priorEpisodeTitles = form.seriesId ? priorTitlesForSeries(form.seriesId) : undefined

    try {
      setPhase('openai', { status: 'active', detail: 'Connecting to OpenAI…' })
      setPercent(12)

      const result = await apiGenerateIdeas({
        ...form,
        additionalInstructions: form.additionalInstructions?.trim() || undefined,
        priorEpisodeTitles,
      })

      setSeriesTitle(result.seriesTitle)
      setPhase('openai', { status: 'done', detail: `${result.episodes.length} idea(s) ready` })
      setPercent(35)

      setPhase('images', { status: 'active' })
      const total = result.episodes.length
      let completed = 0

      const withImages = await mapWithConcurrency(result.episodes, 3, async (ep) => {
        let images: EpisodeWithImages['images'] = []
        let imageWarning: string | undefined
        try {
          const res = await apiSearchImages(ep.imageSearchQueries, 7)
          images = res.images
          imageWarning = res.warning
          if (!res.pexelsConfigured && res.warning) setConfigHint(res.warning)
        } catch (e) {
          imageWarning = e instanceof Error ? e.message : 'Image search failed'
          images = []
        }
        completed++
        setPhase('images', {
          detail: `Loaded images for ${completed} / ${total}…`,
        })
        setPercent(35 + (completed / total) * 50)
        const ranked = rankEpisodeImages(images, ep.youtubeTitle || ep.title)
        return { ...ep, images: ranked, imageWarning }
      })

      setPhase('images', { status: 'done', detail: 'Images loaded' })
      setPhase('finish', { status: 'active' })
      setPercent(92)

      setEpisodes(withImages)
      setPhase('finish', { status: 'done' })
      setPercent(100)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
      setPhases((prev) =>
        prev.map((p) => (p.status === 'active' ? { ...p, status: 'error' as const } : p)),
      )
    } finally {
      setLoading(false)
    }
  }

  const episodeKey = (ep: EpisodeWithImages) => `${ep.partNumber}-${ep.title}`

  const saveEpisode = (ep: EpisodeWithImages) => {
    saveIdea({
      partNumber: ep.partNumber,
      title: ep.title,
      inspiration: ep.inspiration,
      openingQuestion: ep.openingQuestion,
      africanConnection: ep.africanConnection,
      discussionQuestions: ep.discussionQuestions,
      closingQuestion: ep.closingQuestion,
      images: ep.images,
      category: ep.category,
      youtubeTitle: ep.youtubeTitle,
      youtubeDescription: ep.youtubeDescription,
      playlistCategory: ep.playlistCategory,
      tags: ep.tags,
      thumbnailDataUrl: ep.thumbnailDataUrl,
      thumbnailPrefs: ep.thumbnailPrefs,
      region: form.region,
      philosophicalInspiration: form.philosophicalInspiration,
      seriesId: form.seriesId,
      status: 'Idea',
    })
    setSavedKeys((prev) => new Set(prev).add(episodeKey(ep)))
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold text-white">Generate Ideas</h2>
        <p className="mt-1 text-sm text-zinc-500">Series: {seriesTitle}</p>
      </header>

      {!openAiOk && (
        <p className="rounded-xl border border-amber-900/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/90">
          OpenAI is not configured. Add your key in{' '}
          <Link to="/tools/youtube-ideas/settings" className="font-medium text-amber-300 underline">
            Settings
          </Link>{' '}
          before generating.
        </p>
      )}

      <form
        className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          void generate()
        }}
      >
        <Field label="Linked series (optional)">
          <select
            value={form.seriesId ?? ''}
            onChange={(e) => onSeriesChange(e.target.value)}
            className={inputClass}
          >
            <option value="">None — standalone batch</option>
            {seriesOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (next part {s.nextPartNumber ?? '—'})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Number of ideas">
          <select
            value={form.count}
            onChange={(e) => setForm({ ...form, count: Number(e.target.value) as GenerateIdeasRequest['count'] })}
            className={inputClass}
          >
            {IDEA_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Episode starting number">
          <input
            type="number"
            min={1}
            max={9999}
            value={form.startPartNumber}
            onChange={(e) => setForm({ ...form, startPartNumber: Number(e.target.value) })}
            className={inputClass}
          />
        </Field>
        <Field label="Topic category">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className={inputClass}
          >
            {TOPIC_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Philosophical inspiration">
          <select
            value={form.philosophicalInspiration}
            onChange={(e) => setForm({ ...form, philosophicalInspiration: e.target.value })}
            className={inputClass}
          >
            {PHILOSOPHICAL_INSPIRATIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Region">
          <select
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            className={inputClass}
          >
            {REGIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Series title">
          <input
            value={form.seriesTitle ?? ''}
            onChange={(e) => setForm({ ...form, seriesTitle: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Additional instructions" className="sm:col-span-2">
          <textarea
            rows={4}
            value={form.additionalInstructions ?? ''}
            onChange={(e) => setForm({ ...form, additionalInstructions: e.target.value })}
            placeholder="Describe the kinds of ideas you want for this batch…"
            className={inputClass}
          />
        </Field>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading || !openAiOk}
            className="w-full rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-black shadow-lg shadow-amber-950/25 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[220px] sm:px-10"
          >
            {loading ? 'Generating…' : 'Generate Podcast Ideas'}
          </button>
        </div>
      </form>

      {configHint && (
        <p className="rounded-xl border border-amber-900/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/90">
          {configHint}
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</p>
      )}

      {loading && <GenerationProgress phases={phases} percent={percent} />}

      {!loading && episodes.length > 0 && (
        <p className="text-sm text-zinc-500">
          Like an idea? Use <span className="text-amber-400/90">Save this idea</span> at the top of each card — find
          saved items under My Saved Ideas.
        </p>
      )}

      <div className="space-y-10 print:space-y-12">
        {episodes.map((ep) => (
          <IdeaCard
            key={episodeKey(ep)}
            episode={ep}
            saved={savedKeys.has(episodeKey(ep))}
            onSave={saveEpisode}
          />
        ))}
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600'

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}
