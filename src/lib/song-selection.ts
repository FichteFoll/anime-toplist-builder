import type {
  AnimeFormat,
  AnimeCoverImage,
  AnimeSeason,
  AnimeTitle,
  AnimeTitleLanguage,
  CategorySelection,
  SongPerformance,
  SongSelection,
  ThemeType,
} from '@/types'

import { resolveAnimeTitle } from '@/lib/anime-title'

const normalizeText = (value: string | null | undefined) => {
  const normalizedValue = value?.trim()

  return normalizedValue ? normalizedValue : null
}

const joinWithFinalAmpersand = (values: string[]) => {
  if (values.length <= 1) {
    return values[0] ?? ''
  }

  if (values.length === 2) {
    return `${values[0]} & ${values[1]}`
  }

  return `${values.slice(0, -1).join(', ')} & ${values[values.length - 1]}`
}

export const createEmptySongFilterState = () => ({
  types: [],
})

export const createAnimeSelection = ({
  mediaId,
  title,
  coverImage,
  season,
  seasonYear,
  format,
}: {
  mediaId: number
  title: AnimeTitle
  coverImage: AnimeCoverImage
  season?: AnimeSeason | null
  seasonYear?: number | null
  format?: AnimeFormat | null
}) => ({
  kind: 'anime' as const,
  mediaId,
  title,
  coverImage,
  season: season ?? null,
  seasonYear: seasonYear ?? null,
  format: format ?? null,
})

export const createSongSelection = ({
  animeId,
  animeTitle,
  animeCoverImage,
  song,
}: {
  animeId: number
  animeTitle: AnimeTitle
  animeCoverImage: AnimeCoverImage
  song: {
    id: number
    type: ThemeType
    slug: string
    title?: string | null
    titleNative?: string | null
    artist: string
    performances?: SongPerformance[]
    videoLink?: string | null
    episodes?: string | null
  }
}): SongSelection => ({
  kind: 'song',
  animeId,
  animeTitle,
  animeCoverImage,
  song: {
    ...song,
    episodes: normalizeSongEpisodes(song.episodes),
  },
})

export const formatSongArtist = (performances: SongPerformance[]) => {
  const displayEntries = performances
    .map((performance) => {
      const artist = normalizeText(performance.artist)

      if (!artist) {
        return null
      }

      const alias = normalizeText(performance.as)

      return alias ? `${artist} (as: ${alias})` : artist
    })
    .filter((entry): entry is string => entry !== null)

  return joinWithFinalAmpersand(displayEntries)
}

export const normalizeSongEpisodes = (value: string | null | undefined) => {
  const normalizedValue = normalizeText(value)

  if (!normalizedValue || normalizedValue === '1-') {
    return null
  }

  return normalizedValue
}

export const resolveSongTitle = (
  song: Pick<SongSelection['song'], 'title' | 'titleNative'>,
  titleLanguage: AnimeTitleLanguage,
) => {
  const defaultTitle = normalizeText(song.title)
  const nativeTitle = normalizeText(song.titleNative)

  if (titleLanguage === 'native') {
    return nativeTitle
      ? {
          primary: nativeTitle,
          tooltip: defaultTitle && defaultTitle !== nativeTitle ? defaultTitle : null,
        }
      : {
          primary: defaultTitle ?? 'N/A',
          tooltip: null,
        }
  }

  return defaultTitle
    ? {
        primary: defaultTitle,
        tooltip: nativeTitle && nativeTitle !== defaultTitle ? nativeTitle : null,
      }
    : {
        primary: nativeTitle ?? 'N/A',
        tooltip: null,
      }
}

export const getSelectionCoverImage = (selection: CategorySelection) =>
  selection.kind === 'song' ? selection.animeCoverImage : selection.coverImage

export const getSelectionPrimaryTitle = (
  selection: CategorySelection,
  titleLanguage: AnimeTitleLanguage,
) =>
  selection.kind === 'song'
    ? resolveSongTitle(selection.song, titleLanguage).primary
    : resolveAnimeTitle(selection.title, titleLanguage)

export const getSelectionDisplayLabel = (
  selection: CategorySelection,
  titleLanguage: AnimeTitleLanguage,
) => {
  if (selection.kind === 'anime') {
    return resolveAnimeTitle(selection.title, titleLanguage)
  }

  const songTitle = resolveSongTitle(selection.song, titleLanguage).primary

  return `${songTitle} from ${resolveAnimeTitle(selection.animeTitle, titleLanguage)}`
}

export const getSongContextLabel = (
  selection: SongSelection,
  titleLanguage: AnimeTitleLanguage,
) => {
  const animeName = resolveAnimeTitle(selection.animeTitle, titleLanguage)
  const episodes = normalizeSongEpisodes(selection.song.episodes)

  return episodes
    ? `from ${animeName} (${selection.song.slug}, ep ${episodes})`
    : `from ${animeName} (${selection.song.slug})`
}

export const getSongSelectionKey = (selection: SongSelection) =>
  `${selection.animeId}:${selection.song.id}`
