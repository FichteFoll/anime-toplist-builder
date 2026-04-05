import type { FilterState } from '@/types'

export const defaultMinimumTagRank = 60

export const createEmptyFilterState = (): FilterState => ({
  seasons: [],
  countryOfOrigin: [],
  tags: [],
  genres: [],
  formats: [],
  source: [],
  minimumTagRank: defaultMinimumTagRank,
})
