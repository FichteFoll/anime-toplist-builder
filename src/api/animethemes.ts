import type { AnimeCoverImage, AnimeTitle, SongPerformance, ThemeType } from '@/types'

import { formatSongArtist, normalizeSongEpisodes } from '@/lib/song-selection'

import { normalizeAnimeThemesError, requestAnimeThemes } from './animethemes-client'
import type {
  AnimeThemeResponse,
  AnimeThemesAnimeTitleResponse,
  AnimeThemesQueryData,
  AnimeThemesVideoNodeResponse,
} from './animethemes-types'

const themesQuery = `
  query ThemesQuery($anilistIds: [Int!]) {
    filterAnimeByExternalSite(site: ANILIST, id: $anilistIds) {
      title {
        romaji
        english
        native
      }
      themes {
        id
        type
        slug
        entries {
          episodes
          videos {
            nodes {
              link
              resolution
              audio {
                path
              }
            }
          }
        }
        song {
          staff {
            role
            as
            artist {
              name {
                main
              }
            }
          }
          title {
            romaji
            native
          }
        }
      }
    }
  }
`

export interface AnimeThemesSong {
  id: number
  type: ThemeType
  slug: string
  title?: string | null
  titleNative?: string | null
  artist: string
  performances?: Array<SongPerformance>
  videoLink?: string | null
  videoHeight?: number | null
  episodes?: string | null
}

export interface AnimeThemesAnimeSongs {
  animeId: number
  animeTitle: AnimeTitle
  animeCoverImage: AnimeCoverImage
  songs: Array<AnimeThemesSong>
}

const isThemeType = (value: unknown): value is ThemeType =>
  value === 'OP' || value === 'IN' || value === 'ED'

const normalizeText = (value: string | null | undefined) => {
  const normalizedValue = value?.trim()

  return normalizedValue ? normalizedValue : null
}

const createFallbackAnimeTitle = (
  title: AnimeThemesAnimeTitleResponse | null | undefined,
  animeId: number,
): AnimeTitle => {
  const romaji = normalizeText(title?.romaji)

  return {
    userPreferred: romaji ?? `Anime ${animeId}`,
    romaji,
    english: normalizeText(title?.english),
    native: normalizeText(title?.native),
  }
}

const pickPreviewVideo = (videos: Array<AnimeThemesVideoNodeResponse>) => {
  const video = videos.find((item) => normalizeText(item.link))

  return {
    link: video?.link ?? null,
    height: typeof video?.resolution === 'number' && Number.isInteger(video.resolution)
      ? video.resolution
      : null,
  }
}

const normalizeTheme = (theme: AnimeThemeResponse): AnimeThemesSong | null => {
  const id = typeof theme.id === 'number' && Number.isInteger(theme.id) ? theme.id : null
  const slug = normalizeText(theme.slug)

  if (!id || !isThemeType(theme.type) || !slug) {
    return null
  }

  const performances: Array<SongPerformance> = []

  for (const staff of theme.song?.staff ?? []) {
    if (staff.role !== 'Performance') {
      continue
    }

    const artist = normalizeText(staff.artist?.name?.main)

    if (!artist) {
      continue
    }

    performances.push({
      artist,
      as: normalizeText(staff.as),
    })
  }

  const entries = theme.entries ?? []
  const videos = entries.flatMap((entry) => entry.videos?.nodes ?? [])
  const previewVideo = pickPreviewVideo(videos)
  const firstEpisodeHint = entries.map((entry) => normalizeSongEpisodes(entry.episodes)).find(Boolean) ?? null

  return {
    id,
    type: theme.type,
    slug,
    title: normalizeText(theme.song?.title?.romaji),
    titleNative: normalizeText(theme.song?.title?.native),
    artist: formatSongArtist(performances),
    performances: performances.length > 0 ? performances : undefined,
    videoLink: previewVideo.link,
    videoHeight: previewVideo.height,
    episodes: firstEpisodeHint,
  }
}

export interface FetchAnimeSongsOptions {
  animeId: number
  animeTitle?: AnimeTitle
  animeCoverImage?: AnimeCoverImage
}

export const fetchAnimeSongs = async ({
  animeId,
  animeTitle,
  animeCoverImage,
}: FetchAnimeSongsOptions): Promise<AnimeThemesAnimeSongs> => {
  try {
    const data = await requestAnimeThemes<AnimeThemesQueryData, { anilistIds: Array<number> }>(themesQuery, {
      anilistIds: [animeId],
    })

    const anime = data.filterAnimeByExternalSite?.[0]

    return {
      animeId,
      animeTitle: animeTitle ?? createFallbackAnimeTitle(anime?.title, animeId),
      animeCoverImage: animeCoverImage ?? {
        large: '',
        medium: null,
        extraLarge: null,
        color: null,
      },
      songs: (anime?.themes ?? [])
        .map(normalizeTheme)
        .filter((song): song is AnimeThemesSong => song !== null),
    }
  } catch (error) {
    throw normalizeAnimeThemesError(error)
  }
}
