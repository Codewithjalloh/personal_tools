import type { ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { EXCELLENT117_BRAND, GREAT_AFRICAN_GLOBAL_TITLE } from '../../../shared/youtubeIdeas/constants'
import { getGreatAfricanProfileById } from '../../../shared/youtubeIdeas/greatAfricanGlobal'

export function GreatAfricanGlobalDetailView() {
  const { profileId } = useParams<{ profileId: string }>()
  const profile = profileId ? getGreatAfricanProfileById(profileId) : undefined

  if (!profile) {
    return <Navigate to="/tools/youtube-ideas/great-african-global" replace />
  }

  const copyText = () => {
    const body = [
      profile.name,
      profile.lifespan,
      profile.region,
      profile.roles.join(' · '),
      '',
      'Bio',
      profile.bio,
      '',
      'Background',
      profile.background,
      '',
      'Education',
      profile.education,
      '',
      'Key ideas',
      ...profile.ideas.map((i) => `• ${i}`),
      '',
      'Philosophy',
      profile.philosophy,
      '',
      'Pros',
      ...profile.pros.map((i) => `+ ${i}`),
      '',
      'Cons / debates',
      ...profile.cons.map((i) => `− ${i}`),
      '',
      'Episode angles',
      ...profile.episodeAngles.map((i) => `? ${i}`),
    ].join('\n')
    void navigator.clipboard.writeText(body)
  }

  const generateInstructions = [
    `Build an ${EXCELLENT117_BRAND} episode inspired by ${profile.name} (${profile.region}).`,
    profile.bio,
    `Philosophy: ${profile.philosophy}`,
    `Key ideas: ${profile.ideas.join('; ')}`,
    `Debate pros: ${profile.pros.slice(0, 2).join('; ')} vs cons: ${profile.cons.slice(0, 2).join('; ')}`,
    `Suggested angles: ${profile.episodeAngles.join(' | ')}`,
  ].join(' ')

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <Link
        to="/tools/youtube-ideas/great-african-global"
        className="inline-flex text-sm text-zinc-500 transition hover:text-amber-400/90"
      >
        ← Back to {GREAT_AFRICAN_GLOBAL_TITLE}
      </Link>

      <header>
        <div className="flex flex-wrap gap-2">
          {profile.roles.map((role) => (
            <span
              key={role}
              className="rounded bg-zinc-800 px-2 py-1 text-[10px] uppercase tracking-wide text-amber-500"
            >
              {role}
            </span>
          ))}
          {profile.era === 'contemporary' && (
            <span className="rounded bg-emerald-950 px-2 py-1 text-[10px] text-emerald-400">Living</span>
          )}
        </div>
        <h2 className="mt-3 text-3xl font-semibold text-white">{profile.name}</h2>
        <p className="mt-2 text-sm text-zinc-500">{profile.lifespan}</p>
        <p className="mt-1 text-sm text-amber-500/80">{profile.region}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyText}
          className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 hover:border-amber-500/40"
        >
          Copy full profile
        </button>
        <Link
          to={`/tools/youtube-ideas/generate?instructions=${encodeURIComponent(generateInstructions)}`}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400"
        >
          Start idea from this profile
        </Link>
        {profile.worldFigureId ? (
          <Link
            to={`/tools/youtube-ideas/philosophers/${profile.worldFigureId}`}
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 hover:border-amber-500/40"
          >
            Shorter World Library entry
          </Link>
        ) : null}
      </div>

      <article className="space-y-8 rounded-2xl border border-amber-500/25 bg-zinc-900/80 px-6 py-6 text-sm leading-relaxed text-zinc-300">
        <Section title="Bio">
          <p className="text-base text-zinc-200">{profile.bio}</p>
        </Section>
        <Section title="Background & upbringing">
          <p>{profile.background}</p>
        </Section>
        <Section title="Education">
          <p>{profile.education}</p>
        </Section>
        <Section title="Key ideas">
          <ul className="list-disc space-y-2 pl-5 marker:text-amber-500/80">
            {profile.ideas.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
        <Section title="Philosophy & worldview">
          <p className="text-zinc-200">{profile.philosophy}</p>
        </Section>
        <div className="grid gap-6 sm:grid-cols-2">
          <Section title="Pros & strengths">
            <ul className="space-y-2">
              {profile.pros.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-emerald-500/90">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Cons & debates">
            <ul className="space-y-2">
              {profile.cons.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-red-400/90">−</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
        <Section title="Episode angles for Excellent117">
          <ul className="list-decimal space-y-2 pl-5 marker:text-amber-500/80">
            {profile.episodeAngles.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      </article>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-400">{title}</h4>
      <div className="mt-3">{children}</div>
    </section>
  )
}
