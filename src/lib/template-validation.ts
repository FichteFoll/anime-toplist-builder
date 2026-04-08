import {
  categoryEntityKinds,
  animeFormats,
  animeSeasons,
  animeSources,
  filterSortDirections,
  filterSortFields,
  templateSchemaVersion,
  themeTypes,
  type AnimeFormat,
  type AnimeSeason,
  type AnimeSource,
  type CategoryEntityKind,
  type FilterSortDirection,
  type FilterSortField,
  type FilterState,
  type NumericRange,
  type SongFilterState,
  type Template,
  type TemplateExportFilterStateV1,
  type TemplateExportPayloadV1,
  type TemplateImportCategoryPayloadV1,
  type TemplateImportPayloadV1,
  type TemplateOrigin,
  type TemplateVersion,
} from '@/types'
import {
  createCategoryId,
  createTemplateId,
  isCategoryId,
  isTemplateId,
} from '@/lib/ids'
import { createEmptySongFilterState } from '@/lib/song-selection'
import { createEmptyFilterState } from '@/lib/filter-state'

type JsonRecord = Record<string, unknown>

const hasOwn = (value: JsonRecord, key: string) => Object.hasOwn(value, key)

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const sortStrings = (values: string[]) => [...values].sort((left, right) => left.localeCompare(right))

const uniqueStrings = (values: string[]) => Array.from(new Set(values))

const asTrimmedString = (value: unknown, path: string) => {
  if (typeof value !== 'string') {
    throw new TemplateValidationError(`Expected ${path} to be a string.`)
  }

  const normalizedValue = value.trim()

  if (normalizedValue.length === 0) {
    throw new TemplateValidationError(`Expected ${path} to be a non-empty string.`)
  }

  return normalizedValue
}

const asTrimmedSearchString = (value: unknown, path: string) => {
  if (typeof value !== 'string') {
    throw new TemplateValidationError(`Expected ${path} to be a string.`)
  }

  return value.trim()
}

const asOptionalStringArray = (value: unknown, path: string) => {
  if (value === undefined) {
    return []
  }

  if (!Array.isArray(value)) {
    throw new TemplateValidationError(`Expected ${path} to be an array.`)
  }

  const items = value.map((item, index) => asTrimmedString(item, `${path}[${index}]`))

  return sortStrings(uniqueStrings(items))
}

const asOptionalSingleString = (value: unknown, path: string) => {
  if (value === undefined) {
    return undefined
  }

  if (Array.isArray(value)) {
    const items = asOptionalStringArray(value, path)

    return items[0]
  }

  return asTrimmedString(value, path)
}

const asEnumArray = <T extends string>(
  value: unknown,
  path: string,
  allowedValues: readonly T[],
) => {
  const items = asOptionalStringArray(value, path)

  for (const item of items) {
    if (!allowedValues.includes(item as T)) {
      throw new TemplateValidationError(
        `Expected ${path} to contain only supported values. Invalid value: ${item}.`,
      )
    }
  }

  return items as T[]
}

const asOptionalInteger = (
  value: unknown,
  path: string,
  {
    minimum,
    maximum,
  }: {
    minimum?: number
    maximum?: number
  } = {},
): number | undefined => {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new TemplateValidationError(`Expected ${path} to be an integer.`)
  }

  if (minimum !== undefined && value < minimum) {
    throw new TemplateValidationError(`Expected ${path} to be at least ${minimum}.`)
  }

  if (maximum !== undefined && value > maximum) {
    throw new TemplateValidationError(`Expected ${path} to be at most ${maximum}.`)
  }

  return value
}

const asOptionalRange = (value: unknown, path: string): NumericRange | undefined => {
  if (value === undefined) {
    return undefined
  }

  if (!isRecord(value)) {
    throw new TemplateValidationError(`Expected ${path} to be an object.`)
  }

  const minimum = asOptionalInteger(value.minimum, `${path}.minimum`, { minimum: 0 })
  const maximum = asOptionalInteger(value.maximum, `${path}.maximum`, { minimum: 0 })

  if (minimum === undefined && maximum === undefined) {
    return undefined
  }

  if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
    throw new TemplateValidationError(`Expected ${path}.minimum to be less than or equal to ${path}.maximum.`)
  }

  return { minimum, maximum }
}

const asOptionalCountRange = (value: unknown, path: string): NumericRange | undefined => {
  const range = asOptionalRange(value, path)

  return range
}

const asTagFilters = (value: unknown, path: string): string[] => {
  if (value === undefined) {
    return []
  }

  if (!Array.isArray(value)) {
    throw new TemplateValidationError(`Expected ${path} to be an array.`)
  }

  const tags = value.map((entry, index) => asTrimmedString(entry, `${path}[${index}]`))

  return sortStrings(uniqueStrings(tags))
}

const asOptionalSort = (
  value: unknown,
  path: string,
):
  | {
      field: FilterSortField
      direction: FilterSortDirection
    }
  | undefined => {
  if (value === undefined) {
    return undefined
  }

  if (!isRecord(value)) {
    throw new TemplateValidationError(`Expected ${path} to be an object.`)
  }

  const field = asTrimmedString(value.field, `${path}.field`)
  const direction = asTrimmedString(value.direction, `${path}.direction`)

  if (!filterSortFields.includes(field as FilterSortField)) {
    throw new TemplateValidationError(`Unsupported sort field at ${path}.field: ${field}.`)
  }

  if (!filterSortDirections.includes(direction as FilterSortDirection)) {
    throw new TemplateValidationError(
      `Unsupported sort direction at ${path}.direction: ${direction}.`,
    )
  }

  return {
    field: field as FilterSortField,
    direction: direction as FilterSortDirection,
  }
}

const parseCategoryEntityKind = (value: unknown, path: string): CategoryEntityKind => {
  if (value === undefined) {
    return 'anime'
  }

  const entityKind = asTrimmedString(value, path)

  if (!categoryEntityKinds.includes(entityKind as CategoryEntityKind)) {
    throw new TemplateValidationError(`Unsupported category entity kind at ${path}: ${entityKind}.`)
  }

  return entityKind as CategoryEntityKind
}

const parseSongFilterState = (value: unknown, path: string): SongFilterState => {
  if (value === undefined) {
    return createEmptySongFilterState()
  }

  if (!isRecord(value)) {
    throw new TemplateValidationError(`Expected ${path} to be an object.`)
  }

  return {
    types: asEnumArray(value.types, `${path}.types`, themeTypes),
  }
}

const parseFilterState = (value: unknown, path: string): FilterState => {
  if (value === undefined) {
    return createEmptyFilterState()
  }

  if (!isRecord(value)) {
    throw new TemplateValidationError(`Expected ${path} to be an object.`)
  }

  const filterState: FilterState = {
    yearRange: asOptionalRange(value.yearRange, `${path}.yearRange`),
    episodes: asOptionalCountRange(value.episodes, `${path}.episodes`),
    duration: asOptionalCountRange(value.duration, `${path}.duration`),
    seasons: asEnumArray<AnimeSeason>(value.seasons, `${path}.seasons`, animeSeasons),
    countryOfOrigin: asOptionalSingleString(value.countryOfOrigin, `${path}.countryOfOrigin`),
    tags: asTagFilters(value.tags, `${path}.tags`),
    excludedTags: asTagFilters(value.excludedTags, `${path}.excludedTags`),
    genres: asOptionalStringArray(value.genres, `${path}.genres`),
    excludedGenres: asOptionalStringArray(value.excludedGenres, `${path}.excludedGenres`),
    formats: asEnumArray<AnimeFormat>(value.formats, `${path}.formats`, animeFormats),
    popularity: asOptionalRange(value.popularity, `${path}.popularity`),
    source: asEnumArray<AnimeSource>(value.source, `${path}.source`, animeSources),
    minimumTagRank: asOptionalInteger(value.minimumTagRank, `${path}.minimumTagRank`, {
      minimum: 0,
      maximum: 100,
    }),
    sort: asOptionalSort(value.sort, `${path}.sort`),
  }

  return filterState
}

const parseCategoryPayload = (
  value: unknown,
  path: string,
): TemplateImportCategoryPayloadV1 => {
  if (!isRecord(value)) {
    throw new TemplateValidationError(`Expected ${path} to be an object.`)
  }

  const categoryId = value.id === undefined ? undefined : asTrimmedString(value.id, `${path}.id`)

  if (categoryId !== undefined && !isCategoryId(categoryId)) {
    throw new TemplateValidationError(`Unsupported category id at ${path}.id: ${categoryId}.`)
  }

  return {
    id: categoryId,
    name: asTrimmedString(value.name, `${path}.name`),
    description: hasOwn(value, 'description') ? asTrimmedSearchString(value.description, `${path}.description`) : '',
    filter: parseFilterState(value.filter, `${path}.filter`),
    entityKind: parseCategoryEntityKind(value.entityKind, `${path}.entityKind`),
    songFilter: parseSongFilterState(value.songFilter, `${path}.songFilter`),
  }
}

const createTemplateExportFilterState = (filter: FilterState): TemplateExportFilterStateV1 => ({
  ...(filter.yearRange === undefined ? {} : { yearRange: filter.yearRange }),
  ...(filter.episodes === undefined ? {} : { episodes: filter.episodes }),
  ...(filter.duration === undefined ? {} : { duration: filter.duration }),
  ...(filter.seasons.length === 0 ? {} : { seasons: filter.seasons }),
  ...(filter.countryOfOrigin === undefined ? {} : { countryOfOrigin: filter.countryOfOrigin }),
  ...(filter.tags.length === 0 ? {} : { tags: filter.tags }),
  ...(filter.excludedTags.length === 0 ? {} : { excludedTags: filter.excludedTags }),
  ...(filter.genres.length === 0 ? {} : { genres: filter.genres }),
  ...(filter.excludedGenres.length === 0 ? {} : { excludedGenres: filter.excludedGenres }),
  ...(filter.formats.length === 0 ? {} : { formats: filter.formats }),
  ...(filter.popularity === undefined ? {} : { popularity: filter.popularity }),
  ...(filter.source.length === 0 ? {} : { source: filter.source }),
  ...(filter.minimumTagRank === undefined ? {} : { minimumTagRank: filter.minimumTagRank }),
  ...(filter.sort === undefined ? {} : { sort: filter.sort }),
})

export class TemplateValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TemplateValidationError'
  }
}

export const isSupportedTemplateVersion = (value: unknown): value is TemplateVersion =>
  value === templateSchemaVersion

export function assertSupportedTemplateVersion(
  value: unknown,
  path = 'version',
): asserts value is TemplateVersion {
  if (!isSupportedTemplateVersion(value)) {
    throw new TemplateValidationError(
      `Unsupported template ${path}: ${String(value)}. Supported version: ${templateSchemaVersion}.`,
    )
  }
}

export const parseTemplateImportPayload = (value: unknown): TemplateImportPayloadV1 => {
  if (!isRecord(value)) {
    throw new TemplateValidationError('Expected template payload to be an object.')
  }

  assertSupportedTemplateVersion(value.version)

  const templateId = value.id === undefined ? undefined : asTrimmedString(value.id, 'id')

  if (templateId !== undefined && !isTemplateId(templateId)) {
    throw new TemplateValidationError(`Unsupported template id: ${templateId}.`)
  }

  if (!Array.isArray(value.categories)) {
    throw new TemplateValidationError('Expected categories to be an array.')
  }

  const categories = value.categories.map((category, index) =>
    parseCategoryPayload(category, `categories[${index}]`),
  )

  const seenCategoryIds = new Set<string>()

  for (const category of categories) {
    if (!category.id) {
      continue
    }

    if (seenCategoryIds.has(category.id)) {
      throw new TemplateValidationError(`Duplicate category id detected: ${category.id}.`)
    }

    seenCategoryIds.add(category.id)
  }

  return {
    version: value.version,
    id: templateId,
    name: asTrimmedString(value.name, 'name'),
    description: hasOwn(value, 'description') ? asTrimmedSearchString(value.description, 'description') : '',
    categories,
    globalFilter: parseFilterState(value.globalFilter, 'globalFilter'),
  }
}

export const parseTemplateImportJson = (json: string): TemplateImportPayloadV1 => {
  let parsedJson: unknown

  try {
    parsedJson = JSON.parse(json) as unknown
  } catch {
    throw new TemplateValidationError('Template import is not valid JSON.')
  }

  return parseTemplateImportPayload(parsedJson)
}

export const normalizeImportedTemplate = (
  payload: TemplateImportPayloadV1,
  origin: TemplateOrigin,
): Template => ({
  id: payload.id ?? createTemplateId(),
  name: payload.name,
  description:
    payload.description === undefined ? '' : asTrimmedSearchString(payload.description, 'description'),
  categories: payload.categories.map((category) => ({
    id: category.id ?? createCategoryId(),
    name: category.name,
    description:
      category.description === undefined
        ? ''
        : asTrimmedSearchString(category.description, `categories.${category.name}.description`),
    filter: parseFilterState(category.filter, `categories.${category.name}.filter`),
    entityKind: parseCategoryEntityKind(category.entityKind, `categories.${category.name}.entityKind`),
    songFilter: parseSongFilterState(category.songFilter, `categories.${category.name}.songFilter`),
  })),
  globalFilter: parseFilterState(payload.globalFilter, 'globalFilter'),
  origin,
  version: templateSchemaVersion,
})

export const createTemplateExportPayload = (template: Template): TemplateExportPayloadV1 => {
  if (!isTemplateId(template.id)) {
    throw new TemplateValidationError(`Unsupported template id: ${template.id}.`)
  }

  const categories = template.categories.map((category, index) => {
    if (!isCategoryId(category.id)) {
      throw new TemplateValidationError(`Unsupported category id at categories[${index}].id: ${category.id}.`)
    }

    return {
      id: category.id,
      name: asTrimmedString(category.name, `categories[${index}].name`),
      description: asTrimmedSearchString(category.description, `categories[${index}].description`),
      filter: createTemplateExportFilterState(parseFilterState(category.filter, `categories[${index}].filter`)),
      entityKind: parseCategoryEntityKind(category.entityKind, `categories[${index}].entityKind`),
      songFilter: parseSongFilterState(category.songFilter, `categories[${index}].songFilter`),
    }
  })

  return {
    version: templateSchemaVersion,
    id: template.id,
    name: asTrimmedString(template.name, 'name'),
    description: asTrimmedSearchString(template.description, 'description'),
    categories,
    globalFilter: createTemplateExportFilterState(parseFilterState(template.globalFilter, 'globalFilter')),
  }
}

export const stringifyTemplateExportPayload = (template: Template) =>
  JSON.stringify(createTemplateExportPayload(template), null, 2)
