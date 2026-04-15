import { describe, expect, it } from 'vitest'

import { formatSongEpisodesHint } from '@/lib/song-selection'

describe('formatSongEpisodesHint', () => {
  it('formats a single episode as ep', () => {
    expect(formatSongEpisodesHint('1')).toBe('ep 1')
  })

  it('formats episode ranges and lists as eps', () => {
    expect(formatSongEpisodesHint('1-2, 12')).toBe('eps 1-2, 12')
  })
})
