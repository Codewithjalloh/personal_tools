import JSZip from 'jszip'
import type { SavedIdea } from '../../../shared/youtubeIdeas/types'
import { formatSavedIdeaAsText } from './savedIdeaText'

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(',')
  const mime = meta.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg'
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function safeName(s: string): string {
  return s.replace(/[^\w\-]+/g, '-').slice(0, 48)
}

export async function downloadResearchPacket(idea: SavedIdea): Promise<void> {
  const zip = new JSZip()
  const folder = zip.folder(`part-${idea.partNumber}-${safeName(idea.title)}`) ?? zip

  folder.file('episode.md', formatSavedIdeaAsText(idea))
  folder.file(
    'youtube-title.txt',
    idea.youtubeTitle?.trim() || idea.title,
  )
  folder.file(
    'youtube-description.txt',
    idea.youtubeDescription?.trim() || '',
  )
  folder.file('youtube-tags.txt', (idea.tags ?? []).join(', '))
  folder.file('playlist-category.txt', idea.playlistCategory?.trim() || idea.category)

  const images = idea.images ?? []
  let index = 1
  for (const img of images) {
    try {
      const res = await fetch(img.url)
      if (!res.ok) continue
      const blob = await res.blob()
      const ext = blob.type.includes('png') ? 'png' : 'jpg'
      folder.file(`images/${String(index).padStart(2, '0')}.${ext}`, blob)
      index++
    } catch {
      // skip
    }
  }

  if (idea.thumbnailDataUrl) {
    folder.file('thumbnail.jpg', dataUrlToBlob(idea.thumbnailDataUrl))
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `excellent117-research-part-${idea.partNumber}.zip`
  a.click()
  URL.revokeObjectURL(a.href)
}
