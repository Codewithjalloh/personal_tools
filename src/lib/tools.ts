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
    title: 'New YouTube Ideas',
    description:
      'Excellent117 — AI podcast research: philosophy, African context, questions, scripts (OpenAI + Pexels).',
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
    id: 'image-compress',
    title: 'Image Compress',
    description: 'Reduce file size and dimensions for JPG/PNG — download as ZIP.',
    path: '/tools/image-compress',
    icon: '🗜️',
    available: true,
    tags: ['image', 'compress', 'zip', 'optimize'],
  },
]
