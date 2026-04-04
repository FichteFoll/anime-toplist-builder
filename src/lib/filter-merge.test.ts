import { describe, expect, it } from 'vitest'

import { createEmptyFilterState, mergeFilterStates } from '@/lib/filter-merge'
import type { FilterState } from '@/types'

describe('mergeFilterStates', () => {
  it('keeps global constraints when the category filter is empty', () => {
    const globalFilter: FilterState = {
      ...createEmptyFilterState(),
      search: '  mecha  ',
      genres: ['Action', 'Drama'],
      sort: {
        field: 'POPULARITY' as const,
        direction: 'desc' as const,
      },
    }

    const result = mergeFilterStates(globalFilter, createEmptyFilterState())

    expect(result.hasConflicts).toBe(false)
    expect(result.filter.search).toBe('mecha')
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
      tags: [{ name: 'Cyberpunk' }],
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
      tags: [{ name: 'Cyberpunk' }],
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
    expect(result.filter.tags).toEqual([
      {
        name: 'Cyberpunk',
      },
    ])
    expect(result.filter.minimumTagRank).toBe(50)
  })

  it('prefers an explicit search override and category sort', () => {
    const globalFilter: FilterState = {
      ...createEmptyFilterState(),
      search: 'global',
      sort: {
        field: 'POPULARITY' as const,
        direction: 'desc' as const,
      },
    }

    const categoryFilter: FilterState = {
      ...createEmptyFilterState(),
      search: 'category',
      sort: {
        field: 'TITLE' as const,
        direction: 'asc' as const,
      },
    }

    const result = mergeFilterStates(globalFilter, categoryFilter, '  user search  ')

    expect(result.filter.search).toBe('user search')
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

  it('deduplicates tags and falls back to the first non-empty search term', () => {
    const globalFilter: FilterState = {
      ...createEmptyFilterState(),
      search: '  global  ',
      tags: [
        {
          name: ' Time Travel ',
        },
        {
          name: 'Time Travel',
        },
      ],
      minimumTagRank: 35,
    }

    const categoryFilter: FilterState = {
      ...createEmptyFilterState(),
      search: '  ',
      tags: [
        {
          name: 'Time Travel',
        },
        {
          name: 'Iyashikei',
        },
      ],
      minimumTagRank: 10,
    }

    const result = mergeFilterStates(globalFilter, categoryFilter, '   ')

    expect(result.hasConflicts).toBe(false)
    expect(result.filter.search).toBe('global')
    expect(result.filter.tags).toEqual([
      {
        name: 'Time Travel',
      },
    ])
    expect(result.filter.minimumTagRank).toBe(35)
  })
})
