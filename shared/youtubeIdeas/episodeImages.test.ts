import { describe, expect, it } from 'vitest'
import type { ImageAsset } from './types'
import { pickThumbnailBackground, rankEpisodeImages } from './episodeImages'

function img(searchQuery: string, alt = ''): ImageAsset {
  return {
    url: `https://example.com/${searchQuery.replace(/\s+/g, '-')}`,
    searchQuery,
    alt,
  }
}

describe('episodeImages', () => {
  it('prefers topic match over Plato stock photos', () => {
    const images = [
      img('Plato marble bust Greek philosophy', 'Plato statue'),
      img('African couple wedding celebration', 'couple at wedding'),
    ]
    const headline = 'Can Love Truly Conquer All in African Society?'
    expect(pickThumbnailBackground(headline, images)).toBe(images[1].url)
    expect(rankEpisodeImages(images, headline)[0].url).toBe(images[1].url)
  })
})
