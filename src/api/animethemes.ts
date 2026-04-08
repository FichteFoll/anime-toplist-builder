import type { AnimeCoverImage, AnimeTitle, SongPerformance, ThemeType } from '@/types'

import { formatSongArtist, normalizeSongEpisodes } from '@/lib/song-selection'

import { normalizeAnimeThemesError, requestAnimeThemes } from './animethemes-client'
import type {
  AnimeThemeResponse,
  AnimeThemesQueryData,
  AnimeThemesVideoNodeResponse,
} from './animethemes-types'

const themesQuery = `
  query ThemesQuery($anilistIds: [Int!]) {
    findAnimeByExternalSite(site: ANILIST, id: $anilistIds) {
      name
      animethemes {
        id
        type
        slug
        animethemeentries {
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
          performances {
            artist {
              name
            }
            as
          }
          title
          titleNative
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
  performances?: SongPerformance[]
  videoLink?: string | null
  videoHeight?: number | null
  episodes?: string | null
}

export interface AnimeThemesAnimeSongs {
  animeId: number
  animeTitle: AnimeTitle
  animeCoverImage: AnimeCoverImage
  songs: AnimeThemesSong[]
}

const isThemeType = (value: unknown): value is ThemeType =>
  value === 'OP' || value === 'IN' || value === 'ED'

const normalizeText = (value: string | null | undefined) => {
  const normalizedValue = value?.trim()

  return normalizedValue ? normalizedValue : null
}

const createFallbackAnimeTitle = (name: string): AnimeTitle => ({
  userPreferred: name,
  romaji: null,
  english: null,
  native: null,
})

const pickPreviewVideo = (videos: AnimeThemesVideoNodeResponse[]) => {
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

  const performances: SongPerformance[] = []

  for (const performance of theme.song?.performances ?? []) {
    const artist = normalizeText(performance.artist?.name)

    if (!artist) {
      continue
    }

    performances.push({
      artist,
      as: normalizeText(performance.as),
    })
  }

  const entries = theme.animethemeentries ?? []
  const videos = entries.flatMap((entry) => entry.videos?.nodes ?? [])
  const previewVideo = pickPreviewVideo(videos)
  const firstEpisodeHint = entries.map((entry) => normalizeSongEpisodes(entry.episodes)).find(Boolean) ?? null

  return {
    id,
    type: theme.type,
    slug,
    title: normalizeText(theme.song?.title),
    titleNative: normalizeText(theme.song?.titleNative),
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
    const data = await requestAnimeThemes<AnimeThemesQueryData, { anilistIds: number[] }>(themesQuery, {
      anilistIds: [animeId],
    })

    const anime = data.findAnimeByExternalSite?.[0]
    const fallbackName = normalizeText(anime?.name) ?? `Anime ${animeId}`

    return {
      animeId,
      animeTitle: animeTitle ?? createFallbackAnimeTitle(fallbackName),
      animeCoverImage: animeCoverImage ?? {
        large: '',
        medium: null,
        extraLarge: null,
        color: null,
      },
      songs: (anime?.animethemes ?? [])
        .map(normalizeTheme)
        .filter((song): song is AnimeThemesSong => song !== null),
    }
  } catch (error) {
    throw normalizeAnimeThemesError(error)
  }
}
