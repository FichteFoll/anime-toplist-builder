export interface GraphQlResponse<TData> {
  data?: TData
  errors?: Array<{
    message: string
  }>
}

export interface AnimeThemesArtistResponse {
  name?: string | null
}

export interface AnimeThemesPerformanceResponse {
  artist?: AnimeThemesArtistResponse | null
  as?: string | null
}

export interface AnimeThemesAudioResponse {
  path?: string | null
}

export interface AnimeThemesVideoNodeResponse {
  link?: string | null
  audio?: AnimeThemesAudioResponse | null
}

export interface AnimeThemesVideoConnectionResponse {
  nodes?: AnimeThemesVideoNodeResponse[] | null
}

export interface AnimeThemesEntryResponse {
  episodes?: string | null
  videos?: AnimeThemesVideoConnectionResponse | null
}

export interface AnimeThemesSongResponse {
  performances?: AnimeThemesPerformanceResponse[] | null
  title?: string | null
  titleNative?: string | null
}

export interface AnimeThemeResponse {
  type?: string | null
  slug?: string | null
  animethemeentries?: AnimeThemesEntryResponse[] | null
  song?: AnimeThemesSongResponse | null
}

export interface AnimeThemesAnimeResponse {
  name?: string | null
  animethemes?: AnimeThemeResponse[] | null
}

export interface AnimeThemesQueryData {
  findAnimeByExternalSite?: AnimeThemesAnimeResponse[] | null
}
