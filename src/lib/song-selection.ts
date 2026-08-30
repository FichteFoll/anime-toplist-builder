import {
  AnimeFormat,
  AnimeSeason,
  AnimeTitleLanguage,
  ThemeType,
  type AnimeCoverImage,
  type AnimeTitle,
  type CategorySelection,
  type SongPerformance,
  type SongSelection,
} from '@/types'

import { resolveAnimeTitle } from '@/lib/anime-title'
import { resolveRelationName } from '@/lib/relation-selection'

const normalizeText = (value: string | null | undefined) => {
  const normalizedValue = value?.trim()

  return normalizedValue ? normalizedValue : null
}

const joinWithFinalAmpersand = (values: Array<string>) => {
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
    performances?: Array<SongPerformance>
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

export const formatSongArtist = (performances: Array<SongPerformance>) => {
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

export const formatSongEpisodesHint = (value: string | null | undefined) => {
  const episodes = normalizeSongEpisodes(value)

  if (!episodes) {
    return null
  }

  return /^\d+$/.test(episodes) ? `ep ${episodes}` : `eps ${episodes}`
}

export const resolveSongTitle = (
  song: Pick<SongSelection['song'], 'title' | 'titleNative'>,
  titleLanguage: AnimeTitleLanguage,
) => {
  const defaultTitle = normalizeText(song.title)
  const nativeTitle = normalizeText(song.titleNative)

  if (titleLanguage === AnimeTitleLanguage.Native) {
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

// AniList character and staff images expose only `large` and `medium`,
// so `extraLarge` and `color` stay undefined for relation images.
export interface SelectionImage {
  large: string
  extraLarge?: string | null
  color?: string | null
}

export const getSelectionPrimaryImage = (selection: CategorySelection): SelectionImage => {
  switch (selection.kind) {
    case 'anime':
      return selection.coverImage
    case 'song':
      return selection.animeCoverImage
    case 'character':
      return selection.characterImage
    case 'voice-actor':
      return selection.voiceActorImage
  }
}

// Ordered top-to-bottom; every consumer draws the insets in this order.
export const getSelectionInsetImages = (selection: CategorySelection): Array<SelectionImage> => {
  switch (selection.kind) {
    case 'anime':
    case 'song':
      return []
    case 'character':
      return [selection.animeCoverImage]
    case 'voice-actor':
      return [selection.characterImage, selection.animeCoverImage]
  }
}

export const getSelectionPrimaryTitle = (
  selection: CategorySelection,
  titleLanguage: AnimeTitleLanguage,
) => {
  switch (selection.kind) {
    case 'song':
      return resolveSongTitle(selection.song, titleLanguage).primary
    case 'character':
      return resolveRelationName(
        { name: selection.characterName, nativeName: selection.characterNativeName },
        titleLanguage,
      ).primary
    case 'voice-actor':
      return resolveRelationName(
        { name: selection.voiceActorName, nativeName: selection.voiceActorNativeName },
        titleLanguage,
      ).primary
    case 'anime':
      return resolveAnimeTitle(selection.title, titleLanguage)
  }
}

export const getSelectionDisplayLabel = (
  selection: CategorySelection,
  titleLanguage: AnimeTitleLanguage,
) => {
  if (selection.kind === 'anime') {
    return resolveAnimeTitle(selection.title, titleLanguage)
  }

  const animeName = resolveAnimeTitle(selection.animeTitle, titleLanguage)

  if (selection.kind === 'song') {
    return `${resolveSongTitle(selection.song, titleLanguage).primary} from ${animeName}`
  }

  const characterName = resolveRelationName(
    { name: selection.characterName, nativeName: selection.characterNativeName },
    titleLanguage,
  ).primary

  if (selection.kind === 'character') {
    return `${characterName} from ${animeName}`
  }

  const voiceActorName = resolveRelationName(
    { name: selection.voiceActorName, nativeName: selection.voiceActorNativeName },
    titleLanguage,
  ).primary

  return `${voiceActorName} as ${characterName} from ${animeName}`
}

export const getSongContextLabel = (
  selection: SongSelection,
  titleLanguage: AnimeTitleLanguage,
) => {
  const animeName = resolveAnimeTitle(selection.animeTitle, titleLanguage)
  const episodesHint = formatSongEpisodesHint(selection.song.episodes)

  return episodesHint
    ? `from ${animeName} (${selection.song.slug}, ${episodesHint})`
    : `from ${animeName} (${selection.song.slug})`
}

export const getSongSelectionKey = (selection: SongSelection) =>
  `${selection.animeId}:${selection.song.id}`
