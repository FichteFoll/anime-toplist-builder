import type { FilterState, NumericRange } from '@/types'

export type FilterField =
  | 'yearRange'
  | 'seasons'
  | 'formats'
  | 'source'
  | 'genres'
  | 'tags'
  | 'sort'
  | 'countriesOfOrigin'
  | 'popularity'
  | 'minimumTagRank'
  | 'episodes'
  | 'duration'

export type FilterActiveFields = Record<FilterField, boolean>
export type FilterDisabledReasons = Partial<Record<FilterField, string>>

const inheritedFieldReason = 'This field is controlled by the template-wide filter.'

// Fields rendered inside the collapsible "Advanced filters" section.
const advancedFields: ReadonlyArray<FilterField> = [
  'sort',
  'countriesOfOrigin',
  'popularity',
  'minimumTagRank',
  'episodes',
  'duration',
]

// The sort order only reorders results, so a category may always set its own.
const inheritableFields: ReadonlyArray<FilterField> = advancedFields
  .filter((field) => field !== 'sort')
  .concat(['yearRange', 'seasons', 'formats', 'source', 'genres', 'tags'])

const hasRangeValue = (range: NumericRange | undefined) =>
  range?.minimum !== undefined || range?.maximum !== undefined

/**
 * Single source of truth for which filter fields carry a value.
 * Field counts, inheritance and the editor highlighting all derive from it.
 */
export const getActiveFilterFields = (filter: FilterState): FilterActiveFields => {
  const hasTags = filter.tags.length > 0 || filter.excludedTags.length > 0

  return {
    yearRange: hasRangeValue(filter.yearRange),
    seasons: filter.seasons.length > 0,
    formats: filter.formats.length > 0,
    source: filter.source.length > 0,
    genres: filter.genres.length > 0 || filter.excludedGenres.length > 0,
    tags: hasTags,
    sort: filter.sort !== undefined,
    countriesOfOrigin: filter.countriesOfOrigin.length > 0,
    popularity: hasRangeValue(filter.popularity),
    // The rank only narrows a tag match, so on its own it constrains nothing.
    minimumTagRank: hasTags && filter.minimumTagRank !== undefined,
    episodes: hasRangeValue(filter.episodes),
    duration: hasRangeValue(filter.duration),
  }
}

export const getCategoryFilterDisabledReasons = (
  globalFilter: FilterState,
): FilterDisabledReasons => {
  const activeFields = getActiveFilterFields(globalFilter)

  return Object.fromEntries(
    inheritableFields
      .filter((field) => activeFields[field])
      .map((field) => [field, inheritedFieldReason]),
  )
}

export const countConfiguredFilterFields = (filter: FilterState) =>
  Object.values(getActiveFilterFields(filter)).filter(Boolean).length

export const countAdvancedFilterFields = (filter: FilterState) => {
  const activeFields = getActiveFilterFields(filter)

  return advancedFields.filter((field) => activeFields[field]).length
}

export const isNonBlankName = (value: string) => value.trim().length > 0
