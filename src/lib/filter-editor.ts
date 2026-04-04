import type { FilterState, NumericRange } from '@/types'

export type FilterDisabledReasons = Partial<Record<keyof FilterState, string>>

const inheritedFieldReason = 'This field is controlled by the template-wide filter.'

const hasRangeValue = (range: NumericRange | undefined) =>
  range?.minimum !== undefined || range?.maximum !== undefined

export const getCategoryFilterDisabledReasons = (
  globalFilter: FilterState,
): FilterDisabledReasons => ({
  search: globalFilter.search.trim().length > 0 ? inheritedFieldReason : undefined,
  yearRange: hasRangeValue(globalFilter.yearRange) ? inheritedFieldReason : undefined,
  seasons: globalFilter.seasons.length > 0 ? inheritedFieldReason : undefined,
  countryOfOrigin:
    globalFilter.countryOfOrigin.length > 0 ? inheritedFieldReason : undefined,
  tags: globalFilter.tags.length > 0 ? inheritedFieldReason : undefined,
  genres: globalFilter.genres.length > 0 ? inheritedFieldReason : undefined,
  formats: globalFilter.formats.length > 0 ? inheritedFieldReason : undefined,
  popularity: hasRangeValue(globalFilter.popularity) ? inheritedFieldReason : undefined,
  source: globalFilter.source.length > 0 ? inheritedFieldReason : undefined,
})

export const countConfiguredFilterFields = (filter: FilterState) => {
  let count = 0

  if (filter.search.trim().length > 0) {
    count += 1
  }

  if (hasRangeValue(filter.yearRange)) {
    count += 1
  }

  if (filter.seasons.length > 0) {
    count += 1
  }

  if (filter.countryOfOrigin.length > 0) {
    count += 1
  }

  if (filter.tags.length > 0) {
    count += 1
  }

  if (filter.genres.length > 0) {
    count += 1
  }

  if (filter.formats.length > 0) {
    count += 1
  }

  if (hasRangeValue(filter.popularity)) {
    count += 1
  }

  if (filter.source.length > 0) {
    count += 1
  }

  if (filter.sort) {
    count += 1
  }

  return count
}

export const isNonBlankName = (value: string) => value.trim().length > 0
