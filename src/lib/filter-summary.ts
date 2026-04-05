import { formatAnimeFormatLabel } from '@/lib/format-label'
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

export const buildActiveFilterSummary = (filter: FilterState) => {
  const summary: string[] = []

  const rangeLabels = [
    formatRangeLabel('Year', filter.yearRange),
    formatRangeLabel('Popularity', filter.popularity),
    formatRangeLabel('Episodes', filter.episodes),
    formatRangeLabel('Duration', filter.duration),
  ].filter((value): value is string => Boolean(value))

  summary.push(...rangeLabels)

  if (filter.seasons.length > 0) {
    summary.push(`Season: ${filter.seasons.map(toTitleLabel).join(', ')}`)
  }

  if (filter.countryOfOrigin) {
    summary.push(`Country: ${filter.countryOfOrigin}`)
  }

  if (filter.genres.length > 0) {
    summary.push(`Genres: ${filter.genres.join(', ')}`)
  }

  if (filter.excludedGenres.length > 0) {
    summary.push(`Excluded genres: ${filter.excludedGenres.join(', ')}`)
  }

  if (filter.formats.length > 0) {
    summary.push(`Formats: ${filter.formats.map(formatAnimeFormatLabel).join(', ')}`)
  }

  if (filter.source.length > 0) {
    summary.push(`Source: ${filter.source.map(toTitleLabel).join(', ')}`)
  }

  if (filter.tags.length > 0) {
    summary.push(`Tags: ${filter.tags.join(', ')}`)
  }

  if (filter.excludedTags.length > 0) {
    summary.push(`Excluded tags: ${filter.excludedTags.join(', ')}`)
  }

  if (filter.minimumTagRank !== undefined) {
    summary.push(`Tag rank: ${filter.minimumTagRank}+`)
  }

  return summary
}
