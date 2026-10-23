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
  region?: string
  philosophicalInspiration?: string
  status: IdeaStatus
  seriesId?: string
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
}
