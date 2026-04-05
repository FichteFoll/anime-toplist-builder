import { mergeFilterStates } from '@/lib/filter-merge'
import type { FilterSort, FilterState } from '@/types'

import type { AniListMediaSearchVariables, AniListMediaSort } from './anilist-types'

export interface BuildAniListMediaSearchVariablesOptions {
  globalFilter: FilterState
  categoryFilter: FilterState
  search?: string
  page: number
  perPage: number
}

export interface BuildAniListMediaSearchVariablesResult {
  variables: AniListMediaSearchVariables
  hasConflicts: boolean
}

const toInclusiveLowerBound = (value: number) => value - 1

const toExclusiveUpperBound = (value: number) => value + 1

const toAniListYearFloor = (year: number) => year * 10000

const toAniListYearCeiling = (year: number) => (year + 1) * 10000

const withValue = <T>(value: T | undefined) => (value === undefined ? undefined : value)

const pickSingleValue = <T>(values: T[]) => (values.length > 0 ? values[0] : undefined)

export const buildAniListMediaSort = (sort: FilterSort | undefined): AniListMediaSort[] | undefined => {
  if (!sort) {
    return undefined
  }

  const directionSuffix = sort.direction === 'desc' ? '_DESC' : ''

  switch (sort.field) {
    case 'POPULARITY':
      return [`POPULARITY${directionSuffix}` as AniListMediaSort]
    case 'SCORE':
      return [`SCORE${directionSuffix}` as AniListMediaSort]
    case 'TRENDING':
      return [`TRENDING${directionSuffix}` as AniListMediaSort]
    case 'START_DATE':
      return [`START_DATE${directionSuffix}` as AniListMediaSort]
    case 'UPDATED_AT':
      return [`UPDATED_AT${directionSuffix}` as AniListMediaSort]
    case 'TITLE':
      return [sort.direction === 'desc' ? 'TITLE_ROMAJI_DESC' : 'TITLE_ROMAJI']
  }
}

export const buildAniListMediaSearchVariables = ({
  globalFilter,
  categoryFilter,
  search,
  page,
  perPage,
}: BuildAniListMediaSearchVariablesOptions): BuildAniListMediaSearchVariablesResult => {
  const mergedFilter = mergeFilterStates(globalFilter, categoryFilter)

  return {
    variables: {
      page,
      perPage,
      search: search?.trim() || undefined,
      season: pickSingleValue(mergedFilter.filter.seasons),
      countryOfOrigin: pickSingleValue(mergedFilter.filter.countryOfOrigin),
      tagIn: mergedFilter.filter.tags.length > 0 ? mergedFilter.filter.tags : undefined,
      minimumTagRank: mergedFilter.filter.minimumTagRank,
      genreIn: mergedFilter.filter.genres.length > 0 ? mergedFilter.filter.genres : undefined,
      formatIn: mergedFilter.filter.formats.length > 0 ? mergedFilter.filter.formats : undefined,
      source: pickSingleValue(mergedFilter.filter.source),
      startDateGreater: withValue(
        mergedFilter.filter.yearRange?.minimum === undefined
          ? undefined
          : toAniListYearFloor(mergedFilter.filter.yearRange.minimum),
      ),
      startDateLesser: withValue(
        mergedFilter.filter.yearRange?.maximum === undefined
          ? undefined
          : toAniListYearCeiling(mergedFilter.filter.yearRange.maximum),
      ),
      popularityGreater: withValue(
        mergedFilter.filter.popularity?.minimum === undefined
          ? undefined
          : toInclusiveLowerBound(mergedFilter.filter.popularity.minimum),
      ),
      popularityLesser: withValue(
        mergedFilter.filter.popularity?.maximum === undefined
          ? undefined
          : toExclusiveUpperBound(mergedFilter.filter.popularity.maximum),
      ),
      sort: buildAniListMediaSort(mergedFilter.filter.sort),
    },
    hasConflicts: mergedFilter.hasConflicts,
  }
}
