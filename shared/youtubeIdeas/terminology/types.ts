export type TermCategory =
  | 'democracy'
  | 'ideology'
  | 'economics'
  | 'banking'
  | 'entrepreneurship'
  | 'rights'
  | 'power'
  | 'international'
  | 'rhetoric'

export type TermEntry = {
  id: string
  term: string
  category: TermCategory
  definition: string
  /** Short podcast hook — how to use or question the term. */
  explore: string
}

export const TERM_CATEGORIES: { id: TermCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'democracy', label: 'Democracy & governance' },
  { id: 'ideology', label: 'Ideologies' },
  { id: 'economics', label: 'Economics & class' },
  { id: 'banking', label: 'Banking & finance' },
  { id: 'entrepreneurship', label: 'Entrepreneurship & business' },
  { id: 'rights', label: 'Rights & justice' },
  { id: 'power', label: 'Power & elites' },
  { id: 'international', label: 'Global & national' },
  { id: 'rhetoric', label: 'Pro / anti & rhetoric' },
]
