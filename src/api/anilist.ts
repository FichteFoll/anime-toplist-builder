import type { FilterState, AniListMetadata, AniListSearchResponse, AniListSearchResult } from '@/types'

import { buildAniListMediaSearchVariables } from './anilist-query-builder'
import { requestAniList } from './anilist-client'
import { fetchAniListMetadataQuery, searchAnimeMediaQuery } from './anilist-queries'
import type {
  AniListMediaResponse,
  AniListMediaSearchData,
  AniListMetadataData,
} from './anilist-types'

export interface SearchAnimeMediaOptions {
  globalFilter: FilterState
  categoryFilter: FilterState
  search?: string
  page?: number
  perPage?: number
}

const defaultPerPage = 15

const mapAniListSearchResult = (media: AniListMediaResponse): AniListSearchResult => ({
  id: media.id,
  title: media.title,
  coverImage: {
    large: media.coverImage.large ?? media.coverImage.medium ?? media.coverImage.extraLarge ?? '',
    medium: media.coverImage.medium ?? null,
    extraLarge: media.coverImage.extraLarge ?? null,
    color: media.coverImage.color ?? null,
  },
  description: media.description ?? null,
  season: media.season ?? null,
  seasonYear: media.seasonYear ?? null,
  format: media.format ?? null,
  source: media.source ?? null,
  genres: media.genres ?? [],
  tags: (media.tags ?? []).map((tag) => ({
    id: tag.id,
    name: tag.name,
    description: tag.description ?? null,
    rank: tag.rank ?? null,
    isAdult: tag.isAdult ?? false,
  })),
  popularity: media.popularity ?? null,
  averageScore: media.averageScore ?? null,
  countryOfOrigin: media.countryOfOrigin ?? null,
  siteUrl: media.siteUrl ?? `https://anilist.co/anime/${media.id}`,
})

const createEmptySearchResponse = (page: number, perPage: number): AniListSearchResponse => ({
  pageInfo: {
    currentPage: page,
    hasNextPage: false,
    lastPage: 1,
    perPage,
    total: 0,
  },
  results: [],
})

export const searchAnimeMedia = async ({
  globalFilter,
  categoryFilter,
  search,
  page = 1,
  perPage = defaultPerPage,
}: SearchAnimeMediaOptions): Promise<AniListSearchResponse> => {
  const searchVariables = buildAniListMediaSearchVariables({
    globalFilter,
    categoryFilter,
    search,
    page,
    perPage,
  })

  if (searchVariables.hasConflicts) {
    return createEmptySearchResponse(page, perPage)
  }

  const data = await requestAniList<AniListMediaSearchData, typeof searchVariables.variables>(
    searchAnimeMediaQuery,
    searchVariables.variables,
  )

  return {
    pageInfo: data.Page.pageInfo,
    results: data.Page.media.map(mapAniListSearchResult),
  }
}

export const fetchAniListMetadata = async (): Promise<AniListMetadata> => {
  const data = await requestAniList<AniListMetadataData, Record<string, never>>(
    fetchAniListMetadataQuery,
    {},
  )

  return {
    genres: [...(data.GenreCollection ?? [])].sort((left, right) => left.localeCompare(right)),
    tags: [...(data.MediaTagCollection ?? [])]
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        description: tag.description ?? null,
        isAdult: tag.isAdult ?? false,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
  }
}
