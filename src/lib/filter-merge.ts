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
  genres: [],
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

const mergeTags = (
  globalTags: string[],
  categoryTags: string[],
): { tags: string[]; hasConflict: boolean } => {
  const normalizedGlobalTags = normalizeStringArray(globalTags.map((tag) => tag.trim()).filter((tag) => tag.length > 0))
  const normalizedCategoryTags = normalizeStringArray(
    categoryTags.map((tag) => tag.trim()).filter((tag) => tag.length > 0),
  )

  if (normalizedGlobalTags.length === 0) {
    return {
      tags: normalizedCategoryTags,
      hasConflict: false,
    }
  }

  if (normalizedCategoryTags.length === 0) {
    return {
      tags: normalizedGlobalTags,
      hasConflict: false,
    }
  }

  const categoryTagSet = new Set(normalizedCategoryTags)
  const intersection = normalizedGlobalTags.filter((tag) => categoryTagSet.has(tag))

  return {
    tags: intersection,
    hasConflict: intersection.length === 0,
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
  const genres = mergeStringArray(globalFilter.genres, categoryFilter.genres)
  const formats = mergeStringArray<AnimeFormat>(globalFilter.formats, categoryFilter.formats)
  const source = mergeStringArray<AnimeSource>(globalFilter.source, categoryFilter.source)
  const tags = mergeTags(globalFilter.tags, categoryFilter.tags)

  return {
    filter: {
      yearRange: yearRange.range,
      episodes: episodes.range,
      duration: duration.range,
      seasons: seasons.values,
      countryOfOrigin: countryOfOrigin.value,
      tags: tags.tags,
      genres: genres.values,
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
