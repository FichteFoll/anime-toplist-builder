import type { AnimeFormat, AnimeSeason } from './filters'

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
  mediaId: number
  title: AnimeTitle
  coverImage: AnimeCoverImage
  season?: AnimeSeason | null
  seasonYear?: number | null
  format?: AnimeFormat | null
}

export type CategorySelectionMap = Record<string, AnimeSelection | null>

export type TemplateSelectionsMap = Record<string, CategorySelectionMap>
