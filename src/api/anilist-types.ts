import type { AnimeFormat, AnimeSeason, AnimeSource } from '@/types'

export interface GraphQlErrorResponse {
  message: string
}

export interface GraphQlResponse<TData> {
  data?: TData
  errors?: GraphQlErrorResponse[]
}

export type AniListMediaSort =
  | 'POPULARITY'
  | 'POPULARITY_DESC'
  | 'SCORE'
  | 'SCORE_DESC'
  | 'TRENDING'
  | 'TRENDING_DESC'
  | 'START_DATE'
  | 'START_DATE_DESC'
  | 'UPDATED_AT'
  | 'UPDATED_AT_DESC'
  | 'TITLE_ROMAJI'
  | 'TITLE_ROMAJI_DESC'

export interface AniListMediaSearchVariables {
  page: number
  perPage: number
  search?: string
  onList?: boolean
  season?: AnimeSeason
  countryOfOrigin?: string
  tagIn?: string[]
  tagNotIn?: string[]
  minimumTagRank?: number
  genreIn?: string[]
  genreNotIn?: string[]
  formatIn?: AnimeFormat[]
  source?: AnimeSource
  startDateGreater?: number
  startDateLesser?: number
  episodeGreater?: number
  episodeLesser?: number
  durationGreater?: number
  durationLesser?: number
  popularityGreater?: number
  popularityLesser?: number
  sort?: AniListMediaSort[]
}

interface AniListPageInfoResponse {
  currentPage: number
  hasNextPage: boolean
  lastPage?: number | null
  perPage: number
  total?: number | null
}

interface AniListTitleResponse {
  userPreferred: string
  romaji?: string | null
  english?: string | null
  native?: string | null
}

interface AniListCoverImageResponse {
  large?: string | null
  medium?: string | null
  extraLarge?: string | null
  color?: string | null
}

interface AniListTagResponse {
  id: number
  name: string
  description?: string | null
  rank?: number | null
  isAdult?: boolean | null
}

export interface AniListMediaResponse {
  id: number
  title: AniListTitleResponse
  coverImage: AniListCoverImageResponse
  description?: string | null
  season?: AnimeSeason | null
  seasonYear?: number | null
  format?: AnimeFormat | null
  siteUrl?: string | null
}

export interface AniListMediaSearchData {
  Page: {
    pageInfo: AniListPageInfoResponse
    media: AniListMediaResponse[]
  }
}

export interface AniListMediaByIdData {
  Media: AniListMediaResponse | null
}

export interface AniListMetadataData {
  GenreCollection?: string[] | null
  MediaTagCollection?: AniListTagResponse[] | null
}

export interface AniListViewerData {
  Viewer: {
    name: string
  }
}
