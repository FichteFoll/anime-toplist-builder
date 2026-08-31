import type { AnimeFormat, AnimeSeason, AnimeSource } from '@/types'

export interface GraphQlErrorResponse {
  message: string
}

export interface GraphQlResponse<TData> {
  data?: TData
  errors?: Array<GraphQlErrorResponse>
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
  countryOfOriginIn?: Array<string>
  tagIn?: Array<string>
  tagNotIn?: Array<string>
  minimumTagRank?: number
  genreIn?: Array<string>
  genreNotIn?: Array<string>
  formatIn?: Array<AnimeFormat>
  source?: AnimeSource
  startDateGreater?: number
  startDateLesser?: number
  episodeGreater?: number
  episodeLesser?: number
  durationGreater?: number
  durationLesser?: number
  popularityGreater?: number
  popularityLesser?: number
  sort?: Array<AniListMediaSort>
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
    media: Array<AniListMediaResponse>
  }
}

export interface AniListMediaByIdData {
  Media: AniListMediaResponse | null
}

export interface AniListMetadataData {
  GenreCollection?: Array<string> | null
  MediaTagCollection?: Array<AniListTagResponse> | null
}

export interface AniListViewerData {
  Viewer: {
    name: string
    avatar?: {
      large?: string | null
      medium?: string | null
    } | null
  }
}

interface AniListRelationImageResponse {
  large?: string | null
  medium?: string | null
}

interface AniListRelationNameResponse {
  userPreferred: string
  native?: string | null
}

export interface AniListCharacterNodeResponse {
  id: number
  name: AniListRelationNameResponse
  image: AniListRelationImageResponse
}

export interface AniListStaffNodeResponse {
  id: number
  name: AniListRelationNameResponse
  image: AniListRelationImageResponse
  languageV2?: string | null
}

export interface AniListCharacterEdgeResponse {
  role?: string | null
  node: AniListCharacterNodeResponse
  voiceActors?: Array<AniListStaffNodeResponse> | null
}

export interface AniListCharacterCreditsData {
  Media: {
    id: number
    characters: {
      pageInfo: AniListPageInfoResponse
      edges: Array<AniListCharacterEdgeResponse>
    }
  } | null
}
