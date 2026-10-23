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
