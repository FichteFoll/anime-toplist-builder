import type { FilterState } from './filters'

export const templateSchemaVersion = 1 as const

export type TemplateVersion = typeof templateSchemaVersion

export type TemplateId = string

export type CategoryId = string

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
}

export interface TemplateExportFilterStateV1 extends Omit<FilterState, 'seasons' | 'tags' | 'genres' | 'formats' | 'source'> {
  seasons?: FilterState['seasons']
  tags?: FilterState['tags']
  genres?: FilterState['genres']
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
