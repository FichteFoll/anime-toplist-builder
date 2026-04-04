import { describe, expect, it } from 'vitest'

import { createEmptyFilterState } from '@/lib/filter-state'

import { buildAniListMediaSearchVariables } from './anilist-query-builder'

describe('buildAniListMediaSearchVariables', () => {
  it('maps AniList-supported filter arguments', () => {
    const result = buildAniListMediaSearchVariables({
      globalFilter: {
        ...createEmptyFilterState(),
        seasons: ['WINTER', 'SPRING'],
        countryOfOrigin: ['JP', 'CN'],
        tags: [{ name: 'Action' }],
        minimumTagRank: 40,
        genres: ['Action', 'Drama'],
        formats: ['TV', 'MOVIE'],
        source: ['ORIGINAL', 'MANGA'],
        yearRange: { minimum: 2020, maximum: 2024 },
        popularity: { minimum: 100 },
      },
      categoryFilter: createEmptyFilterState(),
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
      minimumTagRank: 40,
      genreIn: ['Action', 'Drama'],
      formatIn: ['MOVIE', 'TV'],
      source: 'MANGA',
      startDateGreater: 20200000,
      startDateLesser: 20250000,
      popularityGreater: 99,
      popularityLesser: undefined,
      search: undefined,
      sort: undefined,
    })
  })
})
