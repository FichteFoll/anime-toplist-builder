import { describe, expect, it } from 'vitest'

import { createEmptyFilterState } from '@/lib/filter-state'

import { buildAniListMediaSearchVariables } from './anilist-query-builder'

describe('buildAniListMediaSearchVariables', () => {
  it('maps AniList-supported filter arguments', () => {
    const result = buildAniListMediaSearchVariables({
      globalFilter: {
        ...createEmptyFilterState(),
        seasons: ['WINTER', 'SPRING'],
        countryOfOrigin: 'CN',
        tags: ['Action'],
        minimumTagRank: 40,
        genres: ['Action', 'Drama'],
        formats: ['TV', 'MOVIE'],
        source: ['ORIGINAL', 'MANGA'],
        yearRange: { minimum: 2020, maximum: 2024 },
        episodes: { minimum: 12, maximum: 24 },
        duration: { minimum: 20, maximum: 30 },
        popularity: { minimum: 100 },
      },
      categoryFilter: createEmptyFilterState(),
      search: '  mecha  ',
      page: 2,
      perPage: 20,
    })

    expect(result.hasConflicts).toBe(false)
    expect(result.variables).toEqual({
      page: 2,
      perPage: 20,
      season: 'SPRING',
      countryOfOrigin: 'CN',
      tagIn: ['Action'],
      minimumTagRank: 60,
      genreIn: ['Action', 'Drama'],
      formatIn: ['MOVIE', 'TV'],
      source: 'MANGA',
      startDateGreater: 20200000,
      startDateLesser: 20250000,
      episodeGreater: 11,
      episodeLesser: 25,
      durationGreater: 19,
      durationLesser: 31,
      popularityGreater: 99,
      popularityLesser: undefined,
      search: 'mecha',
      sort: undefined,
    })
  })
})
