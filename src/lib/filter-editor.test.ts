import { describe, expect, it } from 'vitest'

import {
  countAdvancedFilterFields,
  countConfiguredFilterFields,
  getCategoryFilterDisabledReasons,
} from '@/lib/filter-editor'
import { createEmptyFilterState } from '@/lib/filter-state'
import type { FilterState } from '@/types'

describe('filter editor helpers', () => {
  it('counts minimum tag rank only when tags are selected', () => {
    const filterWithoutTags: FilterState = {
      ...createEmptyFilterState(),
      minimumTagRank: 50,
    }

    const filterWithTags: FilterState = {
      ...createEmptyFilterState(),
      tags: ['Action'],
      excludedTags: [],
      minimumTagRank: 50,
    }

    expect(countConfiguredFilterFields(filterWithoutTags)).toBe(0)
    expect(countConfiguredFilterFields(filterWithTags)).toBe(2)
  })

  it('still counts minimum tag rank in the total filter count when tags exist', () => {
    const filter: FilterState = {
      ...createEmptyFilterState(),
      tags: ['Action'],
      excludedTags: [],
      minimumTagRank: 60,
    }

    expect(countConfiguredFilterFields(filter)).toBe(2)
  })

  it('counts advanced ranges as configured fields', () => {
    const filter: FilterState = {
      ...createEmptyFilterState(),
      episodes: { minimum: 1, maximum: 12 },
      duration: { maximum: 30 },
      popularity: { minimum: 100 },
    }

    expect(countConfiguredFilterFields(filter)).toBe(3)
  })

  it('counts only advanced filter fields in the advanced section', () => {
    const filter: FilterState = {
      ...createEmptyFilterState(),
      sort: { field: 'POPULARITY', direction: 'desc' },
      countryOfOrigin: 'JP',
      popularity: { minimum: 100 },
      tags: ['Action'],
      excludedTags: [],
      excludedGenres: [],
      minimumTagRank: 50,
      episodes: { minimum: 1 },
      duration: { maximum: 24 },
    }

    expect(countAdvancedFilterFields(filter)).toBe(6)
  })

  it('does not count the default minimum tag rank value', () => {
    const filter: FilterState = {
      ...createEmptyFilterState(),
      minimumTagRank: 60,
    }

    expect(countAdvancedFilterFields(filter)).toBe(0)
  })

  it('disables minimum tag rank when tags are inherited', () => {
    const globalFilter: FilterState = {
      ...createEmptyFilterState(),
      tags: ['Action'],
      excludedTags: [],
      minimumTagRank: 40,
    }

    expect(getCategoryFilterDisabledReasons(globalFilter).minimumTagRank).toBe(
      'This field is controlled by the template-wide filter.',
    )
  })

  it('disables episode and duration ranges when inherited', () => {
    const globalFilter: FilterState = {
      ...createEmptyFilterState(),
      episodes: { minimum: 1 },
      duration: { maximum: 10 },
    }

    const disabledReasons = getCategoryFilterDisabledReasons(globalFilter)

    expect(disabledReasons.episodes).toBe('This field is controlled by the template-wide filter.')
    expect(disabledReasons.duration).toBe('This field is controlled by the template-wide filter.')
  })
})
