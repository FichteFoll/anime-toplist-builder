import type { FilterState } from './filters'

export const templateSchemaVersion = 1 as const

export type TemplateVersion = typeof templateSchemaVersion

export type TemplateId = string

export type CategoryId = string

export const categoryEntityKinds = ['anime', 'song'] as const

export type CategoryEntityKind = (typeof categoryEntityKinds)[number]

export const themeTypes = ['OP', 'IN', 'ED'] as const

export type ThemeType = (typeof themeTypes)[number]

export interface SongFilterState {
  types: ThemeType[]
}

export const templateOrigins = [
  'predefined',
  'user',
  'imported-file',
  'imported-url',
] as const

export type TemplateOrigin = (typeof templateOrigins)[number]

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
