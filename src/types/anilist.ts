import type { AnimeFormat, AnimeSeason, AnimeSource } from './filters'
import type { AnimeCoverImage, AnimeTitle } from './selections'

export type AniListErrorKind = 'network' | 'http' | 'graphql' | 'parse' | 'unknown'

export interface AniListError {
  kind: AniListErrorKind
  message: string
  details: string[]
  retryable: boolean
  status?: number
}

export interface AniListTag {
  id: number
  name: string
  description?: string | null
  rank?: number | null
  isAdult?: boolean
}

export interface AniListMetadata {
  genres: string[]
  tags: AniListTag[]
}

export interface AniListSearchResult {
  id: number
  title: AnimeTitle
  coverImage: AnimeCoverImage
  description?: string | null
  season?: AnimeSeason | null
  seasonYear?: number | null
  format?: AnimeFormat | null
  source?: AnimeSource | null
  genres: string[]
  tags: AniListTag[]
  popularity?: number | null
  averageScore?: number | null
  countryOfOrigin?: string | null
  siteUrl: string
}

export interface AniListPageInfo {
  currentPage: number
  hasNextPage: boolean
  lastPage?: number | null
  perPage: number
  total?: number | null
}

export interface AniListSearchResponse {
  pageInfo: AniListPageInfo
  results: AniListSearchResult[]
}
