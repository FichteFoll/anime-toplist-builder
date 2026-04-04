import type {
  AnimeFormat,
  AnimeSeason,
  AnimeSource,
  FilterState,
  NumericRange,
  TagFilter,
} from '@/types'

export interface MergeFilterStateResult {
  filter: FilterState
  hasConflicts: boolean
}

export const createEmptyFilterState = (): FilterState => ({
  search: '',
  seasons: [],
  countryOfOrigin: [],
  tags: [],
  genres: [],
  formats: [],
  source: [],
})

const sortStrings = <T extends string>(values: T[]) =>
  [...values].sort((left, right) => left.localeCompare(right))

const normalizeStringArray = <T extends string>(values: T[]) => sortStrings(Array.from(new Set(values)))

const normalizeTags = (tags: TagFilter[]): TagFilter[] => {
  const dedupedTags = new Map<string, TagFilter>()

  for (const tag of tags) {
    const normalizedName = tag.name.trim()

    if (normalizedName.length === 0) {
      continue
    }

    const existingTag = dedupedTags.get(normalizedName)

    if (!existingTag) {
      dedupedTags.set(normalizedName, {
        name: normalizedName,
      })
    }
  }

  return [...dedupedTags.values()].sort((left, right) => left.name.localeCompare(right.name))
}

const resolveSearchTerm = (searchOverride: string | undefined, categorySearch: string, globalSearch: string) => {
  const candidates = [searchOverride, categorySearch, globalSearch]

  for (const candidate of candidates) {
    const normalizedCandidate = candidate?.trim()

    if (normalizedCandidate) {
      return normalizedCandidate
    }
  }

  return ''
}

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
  globalTags: TagFilter[],
  categoryTags: TagFilter[],
): { tags: TagFilter[]; hasConflict: boolean } => {
  const normalizedGlobalTags = normalizeTags(globalTags)
  const normalizedCategoryTags = normalizeTags(categoryTags)

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

  const categoryTagsByName = new Map(normalizedCategoryTags.map((tag) => [tag.name, tag]))
  const intersection = normalizedGlobalTags.flatMap((tag) => {
    const categoryTag = categoryTagsByName.get(tag.name)

    if (!categoryTag) {
      return []
    }

    return [
      {
        name: tag.name,
      },
    ]
  })

  return {
    tags: intersection,
    hasConflict: intersection.length === 0,
  }
}

export const mergeFilterStates = (
  globalFilter: FilterState,
  categoryFilter: FilterState,
  searchOverride?: string,
): MergeFilterStateResult => {
  const yearRange = mergeRange(globalFilter.yearRange, categoryFilter.yearRange)
  const popularity = mergeRange(globalFilter.popularity, categoryFilter.popularity)
  const seasons = mergeStringArray<AnimeSeason>(globalFilter.seasons, categoryFilter.seasons)
  const countryOfOrigin = mergeStringArray(globalFilter.countryOfOrigin, categoryFilter.countryOfOrigin)
  const genres = mergeStringArray(globalFilter.genres, categoryFilter.genres)
  const formats = mergeStringArray<AnimeFormat>(globalFilter.formats, categoryFilter.formats)
  const source = mergeStringArray<AnimeSource>(globalFilter.source, categoryFilter.source)
  const tags = mergeTags(globalFilter.tags, categoryFilter.tags)

  return {
    filter: {
      search: resolveSearchTerm(searchOverride, categoryFilter.search, globalFilter.search),
      yearRange: yearRange.range,
      seasons: seasons.values,
      countryOfOrigin: countryOfOrigin.values,
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
      popularity.hasConflict ||
      seasons.hasConflict ||
      countryOfOrigin.hasConflict ||
      tags.hasConflict ||
      genres.hasConflict ||
      formats.hasConflict ||
      source.hasConflict,
  }
}
