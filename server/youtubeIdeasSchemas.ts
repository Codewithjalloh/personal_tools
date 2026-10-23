import { z } from 'zod'

export const ideaInspirationSchema = z.object({
  name: z.string().min(1),
  explanation: z.string().min(1),
})

export const generatedEpisodeSchema = z.object({
  partNumber: z.number().int().positive(),
  title: z.string().min(1),
  inspiration: ideaInspirationSchema,
  openingQuestion: z.string().min(1),
  africanConnection: z.array(z.string().min(1)).min(1),
  discussionQuestions: z.array(z.string().min(1)).min(3).max(8),
  closingQuestion: z.string().min(1),
  imageSearchQueries: z.array(z.string().min(1)).min(3).max(8),
  category: z.string().min(1),
  youtubeTitle: z.string().min(1).max(100),
  youtubeDescription: z.string().min(80).max(5000),
  playlistCategory: z.string().min(1),
  tags: z.array(z.string().min(1)).min(8).max(30),
})

export const generateIdeasResponseSchema = z.object({
  seriesTitle: z.string().min(1),
  episodes: z.array(generatedEpisodeSchema).min(1),
})

export const imageAssetSchema = z.object({
  url: z.string().url(),
  sourceWebsite: z.string().optional(),
  photographer: z.string().optional(),
  attribution: z.string().optional(),
  license: z.string().optional(),
  searchQuery: z.string(),
  alt: z.string(),
})

export const ideaStatusSchema = z.enum([
  'Idea',
  'Researching',
  'Script Ready',
  'Recorded',
  'Published',
])

export const savedIdeaSchema = z.object({
  id: z.string().uuid(),
  partNumber: z.number().int().positive(),
  title: z.string(),
  inspiration: ideaInspirationSchema,
  openingQuestion: z.string(),
  africanConnection: z.array(z.string()),
  discussionQuestions: z.array(z.string()),
  closingQuestion: z.string(),
  images: z.array(imageAssetSchema),
  category: z.string(),
  region: z.string().optional(),
  philosophicalInspiration: z.string().optional(),
  status: ideaStatusSchema,
  seriesId: z.string().uuid().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const episodeSeriesSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  ideaIds: z.array(z.string().uuid()),
  nextPartNumber: z.number().int().positive().optional(),
  createdAt: z.string(),
})

export const generateIdeasRequestSchema = z.object({
  count: z.union([z.literal(1), z.literal(3), z.literal(5), z.literal(10)]),
  category: z.string().min(1),
  philosophicalInspiration: z.string().min(1),
  region: z.string().min(1),
  startPartNumber: z.number().int().min(1).max(9999),
  additionalInstructions: z.string().max(4000).optional(),
  seriesTitle: z.string().max(200).optional(),
})
