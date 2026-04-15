import { describe, expect, it } from 'vitest'

import { createEmptyFilterState, mergeFilterStates } from '@/lib/filter-merge'
import { AnimeFormat, FilterSortDirection, FilterSortField } from '@/types'
import type { FilterState } from '@/types'

describe('mergeFilterStates', () => {
  it('keeps global constraints when the category filter is empty', () => {
    const globalFilter: FilterState = {
      ...createEmptyFilterState(),
      genres: ['Action', 'Drama'],
      excludedGenres: [],
      sort: {
        field: FilterSortField.Popularity,
        direction: FilterSortDirection.Desc,
      },
    }

    const result = mergeFilterStates(globalFilter, createEmptyFilterState())

    expect(result.hasConflicts).toBe(false)
    expect(result.filter.genres).toEqual(['Action', 'Drama'])
    expect(result.filter.sort).toEqual({
      field: FilterSortField.Popularity,
      direction: FilterSortDirection.Desc,
    })
  })

  it('intersects array filters and tightens numeric ranges', () => {
    const globalFilter: FilterState = {
      ...createEmptyFilterState(),
      genres: ['Action', 'Drama'],
      excludedGenres: [],
      formats: [AnimeFormat.Movie, AnimeFormat.Tv],
      yearRange: {
        minimum: 2000,
        maximum: 2024,
      },
      episodes: {
        minimum: 12,
      },
      duration: {
        maximum: 90,
      },
      popularity: {
        minimum: 100,
      },
      tags: ['Cyberpunk'],
      excludedTags: [],
      minimumTagRank: 20,
    }

    const categoryFilter: FilterState = {
      ...createEmptyFilterState(),
      genres: ['Action', 'Mystery'],
      excludedGenres: [],
      formats: [AnimeFormat.Tv],
      yearRange: {
        minimum: 2010,
      },
      episodes: {
        maximum: 24,
      },
      duration: {
        minimum: 20,
      },
      popularity: {
        maximum: 500,
      },
      tags: ['Cyberpunk'],
      excludedTags: [],
      minimumTagRank: 50,
    }

    const result = mergeFilterStates(globalFilter, categoryFilter)

    expect(result.hasConflicts).toBe(false)
    expect(result.filter.genres).toEqual(['Action'])
    expect(result.filter.formats).toEqual(['TV'])
    expect(result.filter.yearRange).toEqual({
      minimum: 2010,
      maximum: 2024,
    })
    expect(result.filter.episodes).toEqual({
      minimum: 12,
      maximum: 24,
    })
    expect(result.filter.duration).toEqual({
      minimum: 20,
      maximum: 90,
    })
    expect(result.filter.popularity).toEqual({
      minimum: 100,
      maximum: 500,
    })
    expect(result.filter.tags).toEqual(['Cyberpunk'])
    expect(result.filter.minimumTagRank).toBe(50)
  })

  it('keeps category sort while merging filters', () => {
    const globalFilter: FilterState = {
      ...createEmptyFilterState(),
      sort: {
        field: FilterSortField.Popularity,
        direction: FilterSortDirection.Desc,
      },
    }

    const categoryFilter: FilterState = {
      ...createEmptyFilterState(),
      sort: {
        field: FilterSortField.Title,
        direction: FilterSortDirection.Asc,
      },
    }

    const result = mergeFilterStates(globalFilter, categoryFilter)

    expect(result.filter.sort).toEqual({
      field: FilterSortField.Title,
      direction: FilterSortDirection.Asc,
    })
  })

  it('flags impossible merged filters', () => {
    const globalFilter: FilterState = {
      ...createEmptyFilterState(),
      genres: ['Action'],
      excludedGenres: [],
      yearRange: {
        minimum: 2020,
      },
      episodes: {
        minimum: 12,
      },
    }

    const categoryFilter: FilterState = {
      ...createEmptyFilterState(),
      genres: ['Comedy'],
      excludedGenres: [],
      yearRange: {
        maximum: 2010,
      },
      episodes: {
        maximum: 6,
      },
    }

    const result = mergeFilterStates(globalFilter, categoryFilter)

    expect(result.hasConflicts).toBe(true)
    expect(result.filter.genres).toEqual([])
    expect(result.filter.yearRange).toEqual({
      minimum: 2020,
      maximum: 2010,
    })
    expect(result.filter.episodes).toEqual({
      minimum: 12,
      maximum: 6,
    })
  })

  it('deduplicates tags and keeps the strongest minimum tag rank', () => {
    const globalFilter: FilterState = {
      ...createEmptyFilterState(),
      tags: [' Time Travel ', 'Time Travel'],
      excludedTags: [],
      minimumTagRank: 35,
    }

    const categoryFilter: FilterState = {
      ...createEmptyFilterState(),
      tags: ['Time Travel', 'Iyashikei'],
      excludedTags: [],
      minimumTagRank: 10,
    }

    const result = mergeFilterStates(globalFilter, categoryFilter)

    expect(result.hasConflicts).toBe(false)
    expect(result.filter.tags).toEqual(['Time Travel'])
    expect(result.filter.minimumTagRank).toBe(35)
  })
})
