export type IdeaInspiration = {
  name: string
  explanation: string
}

export type GeneratedEpisode = {
  partNumber: number
  title: string
  inspiration: IdeaInspiration
  openingQuestion: string
  africanConnection: string[]
  discussionQuestions: string[]
  closingQuestion: string
  imageSearchQueries: string[]
  category: string
  youtubeTitle: string
  youtubeDescription: string
  playlistCategory: string
  tags: string[]
}

export type GenerateIdeasResponse = {
  seriesTitle: string
  episodes: GeneratedEpisode[]
}

export type ImageAsset = {
  url: string
  sourceWebsite?: string
  photographer?: string
  attribution?: string
  license?: string
  searchQuery: string
  alt: string
}

export type ThumbnailFontId = 'system' | 'serif' | 'mono' | 'rounded' | 'condensed'

export type ThumbnailTextAlign = 'left' | 'center' | 'right'

/** Editable thumbnail layout (text + background); JPEG is stored separately on the idea. */
export type ThumbnailPrefs = {
  brandText: string
  /** e.g. "PART 6" or "EPISODE 6" — fully editable. */
  partLabel: string
  headline: string
  tagline: string
  backgroundUrl?: string
  /** Vertical crop focus when background is cover-scaled (0 = top, 1 = bottom). */
  focalY: number
  headlineFont: ThumbnailFontId
  /** Brand, part label, and tagline. */
  detailFont: ThumbnailFontId
  brandColor: string
  partLabelColor: string
  headlineColor: string
  taglineColor: string
  accentColor: string
  /** Brand line alignment */
  brandAlign: ThumbnailTextAlign
  partAlign: ThumbnailTextAlign
  headlineAlign: ThumbnailTextAlign
  taglineAlign: ThumbnailTextAlign
}

export const IDEA_STATUSES = [
  'Idea',
  'Researching',
  'Script Ready',
  'Recorded',
  'Published',
] as const

export type IdeaStatus = (typeof IDEA_STATUSES)[number]

export type SavedIdea = {
  id: string
  partNumber: number
  title: string
  inspiration: IdeaInspiration
  openingQuestion: string
  africanConnection: string[]
  discussionQuestions: string[]
  closingQuestion: string
  images: ImageAsset[]
  category: string
  youtubeTitle?: string
  youtubeDescription?: string
  playlistCategory?: string
  tags?: string[]
  thumbnailDataUrl?: string
  thumbnailPrefs?: ThumbnailPrefs
  region?: string
  philosophicalInspiration?: string
  status: IdeaStatus
  seriesId?: string
  /** Block ids highlighted in the script reader (session-persisted on the idea). */
  textHighlightIds?: string[]
  publishedYoutubeUrl?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export type EpisodeSeries = {
  id: string
  name: string
  description?: string
  ideaIds: string[]
  nextPartNumber?: number
  createdAt: string
}

export type GenerateIdeasRequest = {
  count: 1 | 3 | 5 | 10
  category: string
  philosophicalInspiration: string
  region: string
  startPartNumber: number
  additionalInstructions?: string
  seriesTitle?: string
  /** Prior episode titles in the same series — avoids repeating themes. */
  priorEpisodeTitles?: string[]
}
