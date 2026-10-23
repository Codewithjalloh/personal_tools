import { Link } from 'react-router-dom'

type Props = {
  title: string
  description: string
}

export function ToolPageHeader({ title, description }: Props) {
  return (
    <header className="mb-10">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-violet-300"
      >
        ← All tools
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-zinc-400">{description}</p>
    </header>
  )
}
