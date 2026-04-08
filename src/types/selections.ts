import type { AnimeFormat, AnimeSeason } from './filters'
import type { ThemeType } from './templates'

export interface AnimeTitle {
  userPreferred: string
  romaji?: string | null
  english?: string | null
  native?: string | null
}

export interface AnimeCoverImage {
  large: string
  medium?: string | null
  extraLarge?: string | null
  color?: string | null
}

export interface AnimeSelection {
  kind: 'anime'
  mediaId: number
  title: AnimeTitle
  coverImage: AnimeCoverImage
  season?: AnimeSeason | null
  seasonYear?: number | null
  format?: AnimeFormat | null
}

export interface SongPerformance {
  artist: string
  as?: string | null
}

export interface SongSelection {
  kind: 'song'
  animeId: number
  animeTitle: AnimeTitle
  animeCoverImage: AnimeCoverImage
  song: {
    id: number
    type: ThemeType
    slug: string
    title?: string | null
    titleNative?: string | null
    artist: string
    performances?: SongPerformance[]
    videoLink?: string | null
    episodes?: string | null
  }
}

export type CategorySelection = AnimeSelection | SongSelection

export type CategorySelectionMap = Record<string, CategorySelection | null>

export type TemplateSelectionsMap = Record<string, CategorySelectionMap>
