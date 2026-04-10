import { describe, expect, it } from 'vitest'

import { buildActiveFilterSummary } from '@/lib/filter-summary'
import { createEmptyFilterState } from '@/lib/filter-state'
import { AnimeFormat, AnimeSeason, AnimeSource } from '@/types'
import type { FilterState } from '@/types'

describe('buildActiveFilterSummary', () => {
  it('includes all active filter fields, including missing-value cases', () => {
    const filter: FilterState = {
      ...createEmptyFilterState(),
      yearRange: { minimum: 2001 },
      episodes: { maximum: 24 },
      duration: { minimum: 20, maximum: 45 },
      seasons: [AnimeSeason.Spring],
      countryOfOrigin: 'JP',
      genres: ['Action'],
      excludedGenres: ['Horror'],
      formats: [AnimeFormat.TvShort],
      tags: ['Time Travel'],
      excludedTags: ['Ecchi'],
      source: [AnimeSource.Manga],
      minimumTagRank: 40,
    }

    expect(buildActiveFilterSummary(filter)).toEqual([
      'Year: 2001+',
      'Episodes: up to 24',
      'Duration: 20-45',
      'Season: Spring',
      'Country: JP',
      'Genres: Action',
      'Excluded genres: Horror',
      'Formats: TV Short',
      'Source: Manga',
      'Tags: Time Travel',
      'Excluded tags: Ecchi',
      'Tag rank: 40+',
    ])
  })

  it('skips the default tag rank and sort summary entries', () => {
    const filter: FilterState = {
      ...createEmptyFilterState(),
    }

    expect(buildActiveFilterSummary(filter)).toEqual([])
  })
})
