import { formatAnimeFormatLabel } from '@/lib/format-label'
import { defaultMinimumTagRank } from '@/lib/filter-state'
import type { FilterState, NumericRange } from '@/types'

const toTitleLabel = (value: string) =>
  value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const formatRangeLabel = (label: string, range?: NumericRange) => {
  if (!range) {
    return null
  }

  if (range.minimum !== undefined && range.maximum !== undefined) {
    return `${label}: ${range.minimum}-${range.maximum}`
  }

  if (range.minimum !== undefined) {
    return `${label}: ${range.minimum}+`
  }

  if (range.maximum !== undefined) {
    return `${label}: up to ${range.maximum}`
  }

  return null
}

type FilterSummaryEntry = string | null

const filterSummaryFormatters = {
  yearRange: (range: FilterState['yearRange']) => formatRangeLabel('Year', range),
  episodes: (range: FilterState['episodes']) => formatRangeLabel('Episodes', range),
  duration: (range: FilterState['duration']) => formatRangeLabel('Duration', range),
  seasons: (seasons: FilterState['seasons']) =>
    seasons.length > 0 ? `Season: ${seasons.map(toTitleLabel).join(', ')}` : null,
  countryOfOrigin: (countryOfOrigin: FilterState['countryOfOrigin']) =>
    countryOfOrigin ? `Country: ${countryOfOrigin}` : null,
  genres: (genres: FilterState['genres']) => (genres.length > 0 ? `Genres: ${genres.join(', ')}` : null),
  excludedGenres: (excludedGenres: FilterState['excludedGenres']) =>
    excludedGenres.length > 0 ? `Excluded genres: ${excludedGenres.join(', ')}` : null,
  formats: (formats: FilterState['formats']) =>
    formats.length > 0 ? `Formats: ${formats.map(formatAnimeFormatLabel).join(', ')}` : null,
  popularity: (popularity: FilterState['popularity']) => formatRangeLabel('Popularity', popularity),
  source: (source: FilterState['source']) => (source.length > 0 ? `Source: ${source.map(toTitleLabel).join(', ')}` : null),
  tags: (tags: FilterState['tags']) => (tags.length > 0 ? `Tags: ${tags.join(', ')}` : null),
  excludedTags: (excludedTags: FilterState['excludedTags']) =>
    excludedTags.length > 0 ? `Excluded tags: ${excludedTags.join(', ')}` : null,
  minimumTagRank: (minimumTagRank: FilterState['minimumTagRank']) =>
    minimumTagRank !== undefined && minimumTagRank !== defaultMinimumTagRank
      ? `Tag rank: ${minimumTagRank}+`
      : null,
  sort: (_sort: FilterState['sort']) => null,
} satisfies { [Key in keyof FilterState]: (value: FilterState[Key]) => FilterSummaryEntry }

export const buildActiveFilterSummary = (filter: FilterState) => {
  return [
    filterSummaryFormatters.yearRange(filter.yearRange),
    filterSummaryFormatters.episodes(filter.episodes),
    filterSummaryFormatters.duration(filter.duration),
    filterSummaryFormatters.seasons(filter.seasons),
    filterSummaryFormatters.countryOfOrigin(filter.countryOfOrigin),
    filterSummaryFormatters.genres(filter.genres),
    filterSummaryFormatters.excludedGenres(filter.excludedGenres),
    filterSummaryFormatters.formats(filter.formats),
    filterSummaryFormatters.popularity(filter.popularity),
    filterSummaryFormatters.source(filter.source),
    filterSummaryFormatters.tags(filter.tags),
    filterSummaryFormatters.excludedTags(filter.excludedTags),
    filterSummaryFormatters.minimumTagRank(filter.minimumTagRank),
    filterSummaryFormatters.sort(filter.sort),
  ]
    .filter((value): value is string => value !== null)
}
