import type { FilterState } from '@/types'

export const createEmptyFilterState = (): FilterState => ({
  seasons: [],
  countryOfOrigin: [],
  tags: [],
  genres: [],
  formats: [],
  source: [],
  minimumTagRank: undefined,
})
