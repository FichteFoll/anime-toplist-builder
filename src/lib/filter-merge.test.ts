import { describe, expect, it } from 'vitest'

import { createEmptyFilterState, mergeFilterStates } from '@/lib/filter-merge'
import type { FilterState } from '@/types'

describe('mergeFilterStates', () => {
  it('keeps global constraints when the category filter is empty', () => {
    const globalFilter: FilterState = {
      ...createEmptyFilterState(),
      genres: ['Action', 'Drama'],
      sort: {
        field: 'POPULARITY' as const,
        direction: 'desc' as const,
      },
    }

    const result = mergeFilterStates(globalFilter, createEmptyFilterState())

    expect(result.hasConflicts).toBe(false)
    expect(result.filter.genres).toEqual(['Action', 'Drama'])
    expect(result.filter.sort).toEqual({
      field: 'POPULARITY',
      direction: 'desc',
    })
  })

  it('intersects array filters and tightens numeric ranges', () => {
    const globalFilter: FilterState = {
      ...createEmptyFilterState(),
      genres: ['Action', 'Drama'],
      formats: ['MOVIE', 'TV'],
      yearRange: {
        minimum: 2000,
        maximum: 2024,
      },
      popularity: {
        minimum: 100,
      },
      tags: ['Cyberpunk'],
      minimumTagRank: 20,
    }

    const categoryFilter: FilterState = {
      ...createEmptyFilterState(),
      genres: ['Action', 'Mystery'],
      formats: ['TV'],
      yearRange: {
        minimum: 2010,
      },
      popularity: {
        maximum: 500,
      },
      tags: ['Cyberpunk'],
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
        field: 'POPULARITY' as const,
        direction: 'desc' as const,
      },
    }

    const categoryFilter: FilterState = {
      ...createEmptyFilterState(),
      sort: {
        field: 'TITLE' as const,
        direction: 'asc' as const,
      },
    }

    const result = mergeFilterStates(globalFilter, categoryFilter)

    expect(result.filter.sort).toEqual({
      field: 'TITLE',
      direction: 'asc',
    })
  })

  it('flags impossible merged filters', () => {
    const globalFilter: FilterState = {
      ...createEmptyFilterState(),
      genres: ['Action'],
      yearRange: {
        minimum: 2020,
      },
    }

    const categoryFilter: FilterState = {
      ...createEmptyFilterState(),
      genres: ['Comedy'],
      yearRange: {
        maximum: 2010,
      },
    }

    const result = mergeFilterStates(globalFilter, categoryFilter)

    expect(result.hasConflicts).toBe(true)
    expect(result.filter.genres).toEqual([])
    expect(result.filter.yearRange).toEqual({
      minimum: 2020,
      maximum: 2010,
    })
  })

  it('deduplicates tags and keeps the strongest minimum tag rank', () => {
    const globalFilter: FilterState = {
      ...createEmptyFilterState(),
      tags: [' Time Travel ', 'Time Travel'],
      minimumTagRank: 35,
    }

    const categoryFilter: FilterState = {
      ...createEmptyFilterState(),
      tags: ['Time Travel', 'Iyashikei'],
      minimumTagRank: 10,
    }

    const result = mergeFilterStates(globalFilter, categoryFilter)

    expect(result.hasConflicts).toBe(false)
    expect(result.filter.tags).toEqual(['Time Travel'])
    expect(result.filter.minimumTagRank).toBe(35)
  })
})
