import type { FilterState } from './filters'

export const templateSchemaVersion = 1 as const

export type TemplateVersion = typeof templateSchemaVersion

export type TemplateId = string

export type CategoryId = string

export enum CategoryEntityKind {
  Anime = 'anime',
  Song = 'song',
  Character = 'character',
  VoiceActor = 'voice-actor',
}

export const categoryEntityKinds = [
  CategoryEntityKind.Anime,
  CategoryEntityKind.Song,
  CategoryEntityKind.Character,
  CategoryEntityKind.VoiceActor,
] as const

export enum ThemeType {
  OP = 'OP',
  IN = 'IN',
  ED = 'ED',
}

export const themeTypes = [ThemeType.OP, ThemeType.IN, ThemeType.ED] as const

export interface SongFilterState {
  types: Array<ThemeType>
}

export enum CharacterRole {
  Main = 'MAIN',
  Supporting = 'SUPPORTING',
  Background = 'BACKGROUND',
}

export const characterRoles = [
  CharacterRole.Main,
  CharacterRole.Supporting,
  CharacterRole.Background,
] as const

export interface CharacterFilterState {
  roles: Array<CharacterRole>
}

export interface VoiceActorFilterState {
  languages: Array<string>
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
  characterFilter: CharacterFilterState
  voiceActorFilter: VoiceActorFilterState
}

export interface Template {
  id: TemplateId
  name: string
  description: string
  categories: Array<Category>
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
    types?: Array<ThemeType>
  }
  characterFilter?: {
    roles?: Array<CharacterRole>
  }
  voiceActorFilter?: {
    languages?: Array<string>
  }
}

export interface TemplateImportPayloadV1 {
  version: TemplateVersion
  id?: TemplateId
  name: string
  description?: string
  categories: Array<TemplateImportCategoryPayloadV1>
  globalFilter?: Partial<FilterState>
}

export interface TemplateExportCategoryPayloadV1 {
  id: CategoryId
  name: string
  description: string
  filter: TemplateExportFilterStateV1
  entityKind: CategoryEntityKind
  songFilter: SongFilterState
  characterFilter: CharacterFilterState
  voiceActorFilter: VoiceActorFilterState
}

export interface TemplateExportFilterStateV1
  extends Omit<FilterState, 'seasons' | 'countriesOfOrigin' | 'tags' | 'excludedTags' | 'genres' | 'excludedGenres' | 'formats' | 'source'> {
  seasons?: FilterState['seasons']
  countriesOfOrigin?: FilterState['countriesOfOrigin']
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
  categories: Array<TemplateExportCategoryPayloadV1>
  globalFilter: TemplateExportFilterStateV1
}
