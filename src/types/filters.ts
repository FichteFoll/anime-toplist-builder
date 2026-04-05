export const animeSeasons = ['WINTER', 'SPRING', 'SUMMER', 'FALL'] as const

export type AnimeSeason = (typeof animeSeasons)[number]

export const animeFormats = [
  'TV',
  'TV_SHORT',
  'MOVIE',
  'SPECIAL',
  'OVA',
  'ONA',
  'MUSIC',
] as const

export type AnimeFormat = (typeof animeFormats)[number]

export const animeSources = [
  'ORIGINAL',
  'MANGA',
  'LIGHT_NOVEL',
  'VISUAL_NOVEL',
  'VIDEO_GAME',
  'OTHER',
  'NOVEL',
  'DOUJINSHI',
  'ANIME',
  'WEB_NOVEL',
  'LIVE_ACTION',
] as const

export type AnimeSource = (typeof animeSources)[number]

export const filterSortFields = [
  'POPULARITY',
  'SCORE',
  'TRENDING',
  'START_DATE',
  'TITLE',
  'UPDATED_AT',
] as const

export type FilterSortField = (typeof filterSortFields)[number]

export const filterSortDirections = ['asc', 'desc'] as const

export type FilterSortDirection = (typeof filterSortDirections)[number]

export interface NumericRange {
  minimum?: number
  maximum?: number
}

export interface FilterState {
  yearRange?: NumericRange
  episodes?: NumericRange
  duration?: NumericRange
  seasons: AnimeSeason[]
  countryOfOrigin?: string
  tags: string[]
  genres: string[]
  formats: AnimeFormat[]
  popularity?: NumericRange
  source: AnimeSource[]
  minimumTagRank?: number
  sort?: FilterSort
}

export interface FilterSort {
  field: FilterSortField
  direction: FilterSortDirection
}
