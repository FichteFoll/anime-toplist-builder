import type {
  AnimeFormat,
  AnimeSeason,
  AnimeSource,
  FilterState,
  NumericRange,
} from '@/types'

export interface MergeFilterStateResult {
  filter: FilterState
  hasConflicts: boolean
}

export const createEmptyFilterState = (): FilterState => ({
  seasons: [],
  tags: [],
  excludedTags: [],
  genres: [],
  excludedGenres: [],
  formats: [],
  source: [],
})

const sortStrings = <T extends string>(values: T[]) =>
  [...values].sort((left, right) => left.localeCompare(right))

const normalizeStringArray = <T extends string>(values: T[]) => sortStrings(Array.from(new Set(values)))

const mergeRange = (
  globalRange: NumericRange | undefined,
  categoryRange: NumericRange | undefined,
): { range?: NumericRange; hasConflict: boolean } => {
  if (!globalRange && !categoryRange) {
    return {
      hasConflict: false,
    }
  }

  const minimum = Math.max(globalRange?.minimum ?? Number.NEGATIVE_INFINITY, categoryRange?.minimum ?? Number.NEGATIVE_INFINITY)
  const maximum = Math.min(globalRange?.maximum ?? Number.POSITIVE_INFINITY, categoryRange?.maximum ?? Number.POSITIVE_INFINITY)

  const normalizedMinimum = Number.isFinite(minimum) ? minimum : undefined
  const normalizedMaximum = Number.isFinite(maximum) ? maximum : undefined

  return {
    range:
      normalizedMinimum === undefined && normalizedMaximum === undefined
        ? undefined
        : {
            minimum: normalizedMinimum,
            maximum: normalizedMaximum,
          },
    hasConflict:
      normalizedMinimum !== undefined &&
      normalizedMaximum !== undefined &&
      normalizedMinimum > normalizedMaximum,
  }
}

const mergeSingleValue = <T extends string>(
  globalValue: T | undefined,
  categoryValue: T | undefined,
): { value?: T; hasConflict: boolean } => {
  if (globalValue === undefined) {
    return { value: categoryValue, hasConflict: false }
  }

  if (categoryValue === undefined) {
    return { value: globalValue, hasConflict: false }
  }

  return {
    value: globalValue === categoryValue ? globalValue : undefined,
    hasConflict: globalValue !== categoryValue,
  }
}

const mergeStringArray = <T extends string>(
  globalValues: T[],
  categoryValues: T[],
): { values: T[]; hasConflict: boolean } => {
  const normalizedGlobalValues = normalizeStringArray(globalValues)
  const normalizedCategoryValues = normalizeStringArray(categoryValues)

  if (normalizedGlobalValues.length === 0) {
    return {
      values: normalizedCategoryValues,
      hasConflict: false,
    }
  }

  if (normalizedCategoryValues.length === 0) {
    return {
      values: normalizedGlobalValues,
      hasConflict: false,
    }
  }

  const categorySet = new Set(normalizedCategoryValues)
  const intersection = normalizedGlobalValues.filter((value) => categorySet.has(value))

  return {
    values: intersection,
    hasConflict: intersection.length === 0,
  }
}

const normalizeSelection = (values: string[]) =>
  normalizeStringArray(values.map((value) => value.trim()).filter((value) => value.length > 0))

const mergeSelectionFilters = (
  globalIncluded: string[],
  globalExcluded: string[],
  categoryIncluded: string[],
  categoryExcluded: string[],
): { included: string[]; excluded: string[]; hasConflict: boolean } => {
  const normalizedGlobalIncluded = normalizeSelection(globalIncluded)
  const normalizedGlobalExcluded = normalizeSelection(globalExcluded)
  const normalizedCategoryIncluded = normalizeSelection(categoryIncluded)
  const normalizedCategoryExcluded = normalizeSelection(categoryExcluded)

  const excluded = normalizeStringArray([...normalizedGlobalExcluded, ...normalizedCategoryExcluded])
  const categoryIncludedAfterExclude = normalizedCategoryIncluded.filter((value) => !excluded.includes(value))

  if (normalizedGlobalIncluded.length === 0) {
    return {
      included: categoryIncludedAfterExclude,
      excluded,
      hasConflict: normalizedCategoryIncluded.some((value) => excluded.includes(value)),
    }
  }

  if (normalizedCategoryIncluded.length === 0) {
    return {
      included: normalizedGlobalIncluded.filter((value) => !excluded.includes(value)),
      excluded,
      hasConflict: normalizedGlobalIncluded.some((value) => excluded.includes(value)),
    }
  }

  const included = normalizedGlobalIncluded.filter((value) => categoryIncludedAfterExclude.includes(value))
  const hasConflict =
    included.length === 0 ||
    normalizedGlobalIncluded.some((value) => excluded.includes(value)) ||
    normalizedCategoryIncluded.some((value) => normalizedGlobalExcluded.includes(value))

  return {
    included,
    excluded,
    hasConflict,
  }
}

export const mergeFilterStates = (
  globalFilter: FilterState,
  categoryFilter: FilterState,
): MergeFilterStateResult => {
  const yearRange = mergeRange(globalFilter.yearRange, categoryFilter.yearRange)
  const episodes = mergeRange(globalFilter.episodes, categoryFilter.episodes)
  const duration = mergeRange(globalFilter.duration, categoryFilter.duration)
  const popularity = mergeRange(globalFilter.popularity, categoryFilter.popularity)
  const seasons = mergeStringArray<AnimeSeason>(globalFilter.seasons, categoryFilter.seasons)
  const countryOfOrigin = mergeSingleValue(globalFilter.countryOfOrigin, categoryFilter.countryOfOrigin)
  const genres = mergeSelectionFilters(
    globalFilter.genres,
    globalFilter.excludedGenres,
    categoryFilter.genres,
    categoryFilter.excludedGenres,
  )
  const formats = mergeStringArray<AnimeFormat>(globalFilter.formats, categoryFilter.formats)
  const source = mergeStringArray<AnimeSource>(globalFilter.source, categoryFilter.source)
  const tags = mergeSelectionFilters(
    globalFilter.tags,
    globalFilter.excludedTags,
    categoryFilter.tags,
    categoryFilter.excludedTags,
  )

  return {
    filter: {
      yearRange: yearRange.range,
      episodes: episodes.range,
      duration: duration.range,
      seasons: seasons.values,
      countryOfOrigin: countryOfOrigin.value,
      tags: tags.included,
      excludedTags: tags.excluded,
      genres: genres.included,
      excludedGenres: genres.excluded,
      formats: formats.values,
      popularity: popularity.range,
      source: source.values,
      minimumTagRank: Math.max(globalFilter.minimumTagRank ?? 0, categoryFilter.minimumTagRank ?? 0) || undefined,
      sort: categoryFilter.sort ?? globalFilter.sort,
    },
    hasConflicts:
      yearRange.hasConflict ||
      episodes.hasConflict ||
      duration.hasConflict ||
      popularity.hasConflict ||
      seasons.hasConflict ||
      countryOfOrigin.hasConflict ||
      tags.hasConflict ||
      genres.hasConflict ||
      formats.hasConflict ||
      source.hasConflict,
  }
}
