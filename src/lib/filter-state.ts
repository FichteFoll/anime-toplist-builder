import type { FilterState } from '@/types'

export const defaultMinimumTagRank = 60

export const createEmptyFilterState = (): FilterState => ({
  seasons: [],
  countriesOfOrigin: [],
  tags: [],
  excludedTags: [],
  genres: [],
  excludedGenres: [],
  formats: [],
  source: [],
  minimumTagRank: defaultMinimumTagRank,
})
