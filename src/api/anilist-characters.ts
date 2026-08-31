import { CharacterRole, characterRoles, type AniListPageInfo } from '@/types'

import { requestAniList } from './anilist-client'
import { fetchAnimeCharacterCreditsQuery } from './anilist-queries'
import type {
  AniListCharacterCreditsData,
  AniListCharacterEdgeResponse,
  AniListStaffNodeResponse,
} from './anilist-types'

export interface AniListRelationImage {
  large: string
  medium: string | null
}

export interface AniListVoiceActorCredit {
  voiceActorId: number
  name: string
  nativeName: string | null
  image: AniListRelationImage
  language: string | null
}

export interface AniListCharacterCredit {
  characterId: number
  name: string
  nativeName: string | null
  image: AniListRelationImage
  role: CharacterRole | null
  voiceActors: Array<AniListVoiceActorCredit>
}

export interface AniListCharacterCreditsResponse {
  pageInfo: AniListPageInfo
  credits: Array<AniListCharacterCredit>
}

export interface FetchAnimeCharacterCreditsOptions {
  animeId: number
  page?: number
  perPage?: number
  accessToken?: string | null
}

const defaultPerPage = 25

// AniList character and staff images expose only `large` and `medium`,
// never `extraLarge`, so the fallback chain is shorter than for cover images.
const mapRelationImage = (image: { large?: string | null, medium?: string | null }): AniListRelationImage => ({
  large: image.large ?? image.medium ?? '',
  medium: image.medium ?? null,
})

const mapCharacterRole = (role: string | null | undefined): CharacterRole | null =>
  characterRoles.find((knownRole) => knownRole === role) ?? null

const mapVoiceActorCredit = (staff: AniListStaffNodeResponse): AniListVoiceActorCredit => ({
  voiceActorId: staff.id,
  name: staff.name.userPreferred,
  nativeName: staff.name.native ?? null,
  image: mapRelationImage(staff.image),
  language: staff.languageV2 ?? null,
})

const mapCharacterCredit = (edge: AniListCharacterEdgeResponse): AniListCharacterCredit => ({
  characterId: edge.node.id,
  name: edge.node.name.userPreferred,
  nativeName: edge.node.name.native ?? null,
  image: mapRelationImage(edge.node.image),
  role: mapCharacterRole(edge.role),
  voiceActors: (edge.voiceActors ?? []).map(mapVoiceActorCredit),
})

const createEmptyCreditsResponse = (page: number, perPage: number): AniListCharacterCreditsResponse => ({
  pageInfo: {
    currentPage: page,
    hasNextPage: false,
    lastPage: 1,
    perPage,
    total: 0,
  },
  credits: [],
})

export const fetchAnimeCharacterCredits = async ({
  animeId,
  page = 1,
  perPage = defaultPerPage,
  accessToken,
}: FetchAnimeCharacterCreditsOptions): Promise<AniListCharacterCreditsResponse> => {
  const data = await requestAniList<AniListCharacterCreditsData, { id: number, page: number, perPage: number }>(
    fetchAnimeCharacterCreditsQuery,
    { id: animeId, page, perPage },
    {
      accessToken,
    },
  )

  if (!data.Media) {
    return createEmptyCreditsResponse(page, perPage)
  }

  return {
    pageInfo: data.Media.characters.pageInfo,
    credits: data.Media.characters.edges.map(mapCharacterCredit),
  }
}
