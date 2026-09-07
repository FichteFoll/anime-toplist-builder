import type { AniListPageInfo } from '@/types'

export interface PickerResultTotal {
  count: number
  isExact: boolean
}

interface ResolvePickerResultTotalOptions {
  pageInfo: AniListPageInfo
  resultCount: number
  perPage: number
  hasSearchTerm: boolean
}

// AniList answers queries carrying a `search` term from its search index,
// where `pageInfo.total` and `pageInfo.lastPage` report the index result window
// (5000 entries) rather than the real match count,
// until the last page of results collapses them to the truth.
// Only `hasNextPage` and the returned page contents are dependable there,
// so a search total is reported as the lower bound the client has seen itself.
export const resolvePickerResultTotal = (
  { pageInfo, resultCount, perPage, hasSearchTerm }: ResolvePickerResultTotalOptions,
): PickerResultTotal | null => {
  if (!hasSearchTerm) {
    return typeof pageInfo.total === 'number'
      ? { count: pageInfo.total, isExact: true }
      : null
  }

  return {
    count: (pageInfo.currentPage - 1) * perPage + resultCount,
    isExact: !pageInfo.hasNextPage,
  }
}

export const resolvePickerLastPage = (
  pageInfo: AniListPageInfo,
  hasSearchTerm: boolean,
): number | null => (hasSearchTerm ? null : pageInfo.lastPage ?? null)
