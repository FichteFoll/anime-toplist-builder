import { describe, expect, it } from 'vitest'

import { createEmptyFilterState } from '@/lib/filter-state'
import { AniListListVisibility, AnimeFormat, AnimeSeason, AnimeSource } from '@/types'

import { buildAniListMediaSearchVariables } from './anilist-query-builder'

describe('buildAniListMediaSearchVariables', () => {
  it('maps AniList-supported filter arguments', () => {
    const result = buildAniListMediaSearchVariables({
      globalFilter: {
        ...createEmptyFilterState(),
        seasons: [AnimeSeason.Winter, AnimeSeason.Spring],
        countryOfOrigin: 'CN',
        tags: ['Action'],
        excludedTags: ['Romance'],
        minimumTagRank: 40,
        genres: ['Action', 'Drama'],
        excludedGenres: ['Comedy'],
        formats: [AnimeFormat.Tv, AnimeFormat.Movie],
        source: [AnimeSource.Original, AnimeSource.Manga],
        yearRange: { minimum: 2020, maximum: 2024 },
        episodes: { minimum: 12, maximum: 24 },
        duration: { minimum: 20, maximum: 30 },
        popularity: { minimum: 100 },
      },
      categoryFilter: createEmptyFilterState(),
      listVisibility: AniListListVisibility.Hide,
      search: '  mecha  ',
      page: 2,
      perPage: 20,
    })

    expect(result.hasConflicts).toBe(false)
    expect(result.variables).toEqual({
      page: 2,
      perPage: 20,
      onList: false,
      season: AnimeSeason.Spring,
      countryOfOrigin: 'CN',
      tagIn: ['Action'],
      tagNotIn: ['Romance'],
      minimumTagRank: 60,
      genreIn: ['Action', 'Drama'],
      genreNotIn: ['Comedy'],
      formatIn: [AnimeFormat.Movie, AnimeFormat.Tv],
      source: AnimeSource.Manga,
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
