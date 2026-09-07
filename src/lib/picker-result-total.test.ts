import { describe, expect, it } from 'vitest'

import { resolvePickerLastPage, resolvePickerResultTotal } from '@/lib/picker-result-total'

import type { AniListPageInfo } from '@/types'

const createPageInfo = (overrides: Partial<AniListPageInfo> = {}): AniListPageInfo => ({
  currentPage: 1,
  hasNextPage: false,
  lastPage: 1,
  perPage: 15,
  total: 0,
  ...overrides,
})

describe('resolvePickerResultTotal', () => {
  it('reports the AniList total as exact without a search term', () => {
    const total = resolvePickerResultTotal({
      pageInfo: createPageInfo({ total: 46, lastPage: 4, hasNextPage: true }),
      resultCount: 15,
      perPage: 15,
      hasSearchTerm: false,
    })

    expect(total).toEqual({ count: 46, isExact: true })
  })

  it('reports no total without a search term when AniList omits it', () => {
    const total = resolvePickerResultTotal({
      pageInfo: createPageInfo({ total: null }),
      resultCount: 15,
      perPage: 15,
      hasSearchTerm: false,
    })

    expect(total).toBeNull()
  })

  it('reports a lower bound for a search while more pages follow', () => {
    const total = resolvePickerResultTotal({
      pageInfo: createPageInfo({ currentPage: 3, hasNextPage: true, lastPage: 334, total: 5000 }),
      resultCount: 15,
      perPage: 15,
      hasSearchTerm: true,
    })

    expect(total).toEqual({ count: 45, isExact: false })
  })

  it('reports the counted results for a search on the final page', () => {
    const total = resolvePickerResultTotal({
      pageInfo: createPageInfo({ currentPage: 4, hasNextPage: false, lastPage: 334, total: 5000 }),
      resultCount: 1,
      perPage: 15,
      hasSearchTerm: true,
    })

    expect(total).toEqual({ count: 46, isExact: true })
  })
})

describe('resolvePickerLastPage', () => {
  it('keeps the reported last page without a search term', () => {
    expect(resolvePickerLastPage(createPageInfo({ lastPage: 4 }), false)).toBe(4)
  })

  it('discards the reported last page for a search', () => {
    expect(resolvePickerLastPage(createPageInfo({ lastPage: 334 }), true)).toBeNull()
  })
})
