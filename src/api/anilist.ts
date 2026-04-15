import {
  AniListListVisibility,
  type AniListMetadata,
  type AniListSearchResponse,
  type AniListSearchResult,
  type AniListViewer,
  type FilterState,
} from '@/types'

import { buildAniListMediaSearchVariables } from './anilist-query-builder'
import { isAniListAuthenticationFailure, requestAniList } from './anilist-client'
import {
  fetchAniListMetadataQuery,
  fetchAniListMediaByIdQuery,
  fetchAniListViewerQuery,
  searchAnimeMediaQuery,
} from './anilist-queries'
import type {
  AniListMediaByIdData,
  AniListMediaResponse,
  AniListMediaSearchData,
  AniListMetadataData,
  AniListViewerData,
} from './anilist-types'

export interface SearchAnimeMediaOptions {
  globalFilter: FilterState
  categoryFilter: FilterState
  listVisibility?: AniListListVisibility | null
  search?: string
  page?: number
  perPage?: number
  accessToken?: string | null
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
  listVisibility,
  search,
  page = 1,
  perPage = defaultPerPage,
  accessToken,
}: SearchAnimeMediaOptions): Promise<AniListSearchResponse> => {
  const searchVariables = buildAniListMediaSearchVariables({
    globalFilter,
    categoryFilter,
    listVisibility,
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
    {
      accessToken,
    },
  )

  return {
    pageInfo: data.Page.pageInfo,
    results: data.Page.media.map(mapAniListSearchResult),
  }
}

export const fetchAniListMediaById = async (id: number, accessToken?: string | null): Promise<AniListSearchResult | null> => {
  const data = await requestAniList<AniListMediaByIdData, { id: number }>(
    fetchAniListMediaByIdQuery,
    { id },
    {
      accessToken,
    },
  )

  return data.Media ? mapAniListSearchResult(data.Media) : null
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

export const fetchAuthenticatedAniListViewer = async (accessToken: string): Promise<AniListViewer> => {
  const data = await requestAniList<AniListViewerData, Record<string, never>>(
    fetchAniListViewerQuery,
    {},
    {
      accessToken,
    },
  )

  return {
    name: data.Viewer.name,
  }
}

export { isAniListAuthenticationFailure }
