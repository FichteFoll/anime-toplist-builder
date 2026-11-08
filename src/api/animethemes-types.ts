export interface GraphQlResponse<TData> {
  data?: TData
  errors?: Array<{
    message: string
  }>
}

export interface AnimeThemesArtistNameResponse {
  main?: string | null
  native?: string | null
}

export interface AnimeThemesArtistResponse {
  name?: AnimeThemesArtistNameResponse | null
}

export interface AnimeThemesSongStaffResponse {
  role?: string | null
  as?: string | null
  artist?: AnimeThemesArtistResponse | null
}

export interface AnimeThemesAudioResponse {
  path?: string | null
}

export interface AnimeThemesVideoNodeResponse {
  link?: string | null
  resolution?: number | null
  audio?: AnimeThemesAudioResponse | null
}

export interface AnimeThemesVideoConnectionResponse {
  nodes?: Array<AnimeThemesVideoNodeResponse> | null
}

export interface AnimeThemesEntryResponse {
  episodes?: string | null
  videos?: AnimeThemesVideoConnectionResponse | null
}

export interface AnimeThemesSongTitleResponse {
  romaji?: string | null
  native?: string | null
}

export interface AnimeThemesSongResponse {
  staff?: Array<AnimeThemesSongStaffResponse> | null
  title?: AnimeThemesSongTitleResponse | null
}

export interface AnimeThemeResponse {
  id?: number | null
  type?: string | null
  slug?: string | null
  entries?: Array<AnimeThemesEntryResponse> | null
  song?: AnimeThemesSongResponse | null
}

export interface AnimeThemesAnimeTitleResponse {
  romaji?: string | null
  english?: string | null
  native?: string | null
}

export interface AnimeThemesAnimeResponse {
  title?: AnimeThemesAnimeTitleResponse | null
  themes?: Array<AnimeThemeResponse> | null
}

export interface AnimeThemesQueryData {
  filterAnimeByExternalSite?: Array<AnimeThemesAnimeResponse> | null
}
