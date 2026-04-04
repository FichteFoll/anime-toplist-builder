import type { FilterState } from '@/types'

export const createEmptyFilterState = (): FilterState => ({
  search: '',
  seasons: [],
  countryOfOrigin: [],
  tags: [],
  genres: [],
  formats: [],
  source: [],
})
