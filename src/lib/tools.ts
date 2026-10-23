import { EXCELLENT117_BRAND, RESEARCH_STUDIO_TITLE } from '../../shared/youtubeIdeas/constants'

export type ToolDefinition = {
  id: string
  title: string
  description: string
  path: string
  icon: string
  available: boolean
  tags: string[]
}

export const TOOLS: ToolDefinition[] = [
  {
    id: 'youtube-ideas',
    title: `${EXCELLENT117_BRAND} ${RESEARCH_STUDIO_TITLE}`,
    description:
      'Podcast research hub — episode ideas, World Library, terminology, scripts, and YouTube pack (OpenAI + Pexels).',
    path: '/tools/youtube-ideas',
    icon: '🎙️',
    available: true,
    tags: ['youtube', 'podcast', 'openai', 'excellent117', 'ideas'],
  },
  {
    id: 'slideshow-video',
    title: 'Image Slideshow → Video',
    description: 'Turn photos into a timed MP4/WebM with intro, outro, music, and effects.',
    path: '/tools/slideshow-video',
    icon: '🎬',
    available: true,
    tags: ['video', 'photos', 'slideshow', 'export'],
  },
  {
    id: 'loop-audio',
    title: 'Loop video + audio',
    description: 'Repeat a short video loop under a voice track — export MP4 at the length of your audio.',
    path: '/tools/loop-audio',
    icon: '🔁',
    available: true,
    tags: ['video', 'audio', 'loop', 'youtube', 'podcast', 'export'],
  },
  {
    id: 'image-compress',
    title: 'Image Compress',
    description: 'Reduce file size and dimensions for JPG/PNG — download as ZIP.',
    path: '/tools/image-compress',
    icon: '🗜️',
    available: true,
    tags: ['image', 'compress', 'zip', 'optimize'],
  },
]
