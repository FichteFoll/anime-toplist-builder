import type { FilterState } from './filters'

export const templateSchemaVersion = 1 as const

export type TemplateVersion = typeof templateSchemaVersion

export type TemplateId = string

export type CategoryId = string

export enum CategoryEntityKind {
  Anime = 'anime',
  Song = 'song',
}

export const categoryEntityKinds = [CategoryEntityKind.Anime, CategoryEntityKind.Song] as const

export enum ThemeType {
  OP = 'OP',
  IN = 'IN',
  ED = 'ED',
}

export const themeTypes = [ThemeType.OP, ThemeType.IN, ThemeType.ED] as const

export interface SongFilterState {
  types: ThemeType[]
}

export enum TemplateOrigin {
  Predefined = 'predefined',
  User = 'user',
  ImportedFile = 'imported-file',
  ImportedUrl = 'imported-url',
}

export const templateOrigins = [
  TemplateOrigin.Predefined,
  TemplateOrigin.User,
  TemplateOrigin.ImportedFile,
  TemplateOrigin.ImportedUrl,
] as const

export interface Category {
  id: CategoryId
  name: string
  description: string
  filter: FilterState
  entityKind: CategoryEntityKind
  songFilter: SongFilterState
}

export interface Template {
  id: TemplateId
  name: string
  description: string
  categories: Category[]
  globalFilter: FilterState
  origin: TemplateOrigin
  version: TemplateVersion
}

export interface TemplateImportCategoryPayloadV1 {
  id?: CategoryId
  name: string
  description?: string
  filter?: Partial<FilterState>
  entityKind?: CategoryEntityKind
  songFilter?: {
    types?: ThemeType[]
  }
}

export interface TemplateImportPayloadV1 {
  version: TemplateVersion
  id?: TemplateId
  name: string
  description?: string
  categories: TemplateImportCategoryPayloadV1[]
  globalFilter?: Partial<FilterState>
}

export interface TemplateExportCategoryPayloadV1 {
  id: CategoryId
  name: string
  description: string
  filter: TemplateExportFilterStateV1
  entityKind: CategoryEntityKind
  songFilter: SongFilterState
}

export interface TemplateExportFilterStateV1
  extends Omit<FilterState, 'seasons' | 'tags' | 'excludedTags' | 'genres' | 'excludedGenres' | 'formats' | 'source'> {
  seasons?: FilterState['seasons']
  tags?: FilterState['tags']
  excludedTags?: FilterState['excludedTags']
  genres?: FilterState['genres']
  excludedGenres?: FilterState['excludedGenres']
  formats?: FilterState['formats']
  source?: FilterState['source']
}

export interface TemplateExportPayloadV1 {
  version: TemplateVersion
  id: TemplateId
  name: string
  description: string
  categories: TemplateExportCategoryPayloadV1[]
  globalFilter: TemplateExportFilterStateV1
}
