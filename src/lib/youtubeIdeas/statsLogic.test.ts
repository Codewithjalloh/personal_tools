import { describe, expect, it } from 'vitest'
import type { SavedIdea } from '../../../shared/youtubeIdeas/types'
import { computeDashboardStats } from './statsLogic'

function idea(partial: Partial<SavedIdea> & Pick<SavedIdea, 'id' | 'title' | 'updatedAt'>): SavedIdea {
  return {
    partNumber: 1,
    inspiration: { name: 'Test', explanation: 'x' },
    openingQuestion: 'Q?',
    africanConnection: ['a'],
    discussionQuestions: ['q'],
    closingQuestion: 'C?',
    images: [],
    category: 'Philosophy',
    status: 'Idea',
    createdAt: partial.updatedAt,
    ...partial,
  }
}

describe('computeDashboardStats', () => {
  it('sorts recent by updatedAt descending', () => {
    const stats = computeDashboardStats([
      idea({ id: '1', title: 'Old', updatedAt: '2025-01-01T00:00:00.000Z' }),
      idea({ id: '2', title: 'New', updatedAt: '2025-06-01T00:00:00.000Z' }),
    ])
    expect(stats.recent[0]?.title).toBe('New')
  })

  it('counts pipeline and published', () => {
    const stats = computeDashboardStats([
      idea({ id: '1', title: 'A', updatedAt: '2025-01-01', status: 'Researching' }),
      idea({ id: '2', title: 'B', updatedAt: '2025-01-02', status: 'Published' }),
    ])
    expect(stats.upcoming).toBe(1)
    expect(stats.published).toBe(1)
    expect(stats.byStatus.Published).toBe(1)
  })
})
