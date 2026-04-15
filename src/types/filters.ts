export enum AnimeSeason {
  Winter = 'WINTER',
  Spring = 'SPRING',
  Summer = 'SUMMER',
  Fall = 'FALL',
}

export const animeSeasons = [AnimeSeason.Winter, AnimeSeason.Spring, AnimeSeason.Summer, AnimeSeason.Fall] as const

export enum AnimeFormat {
  Tv = 'TV',
  TvShort = 'TV_SHORT',
  Movie = 'MOVIE',
  Special = 'SPECIAL',
  Ova = 'OVA',
  Ona = 'ONA',
  Music = 'MUSIC',
}

export const animeFormats = [
  AnimeFormat.Tv,
  AnimeFormat.TvShort,
  AnimeFormat.Movie,
  AnimeFormat.Special,
  AnimeFormat.Ova,
  AnimeFormat.Ona,
  AnimeFormat.Music,
] as const

export enum AnimeSource {
  Original = 'ORIGINAL',
  Manga = 'MANGA',
  LightNovel = 'LIGHT_NOVEL',
  VisualNovel = 'VISUAL_NOVEL',
  VideoGame = 'VIDEO_GAME',
  Other = 'OTHER',
  Novel = 'NOVEL',
  Doujinshi = 'DOUJINSHI',
  Anime = 'ANIME',
  WebNovel = 'WEB_NOVEL',
  LiveAction = 'LIVE_ACTION',
}

export const animeSources = [
  AnimeSource.Original,
  AnimeSource.Manga,
  AnimeSource.LightNovel,
  AnimeSource.VisualNovel,
  AnimeSource.VideoGame,
  AnimeSource.Other,
  AnimeSource.Novel,
  AnimeSource.Doujinshi,
  AnimeSource.Anime,
  AnimeSource.WebNovel,
  AnimeSource.LiveAction,
] as const

export enum FilterSortField {
  Popularity = 'POPULARITY',
  Score = 'SCORE',
  Trending = 'TRENDING',
  StartDate = 'START_DATE',
  Title = 'TITLE',
  UpdatedAt = 'UPDATED_AT',
}

export const filterSortFields = [
  FilterSortField.Popularity,
  FilterSortField.Score,
  FilterSortField.Trending,
  FilterSortField.StartDate,
  FilterSortField.Title,
  FilterSortField.UpdatedAt,
] as const

export enum FilterSortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export const filterSortDirections = [FilterSortDirection.Asc, FilterSortDirection.Desc] as const

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
  excludedTags: string[]
  genres: string[]
  excludedGenres: string[]
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
