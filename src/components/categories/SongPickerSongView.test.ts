// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'

import SongPickerSongView from '@/components/categories/SongPickerSongView.vue'
import { createSongSelection } from '@/lib/song-selection'
import { AnimeFormat, ThemeType, type AniListSearchResult } from '@/types'

vi.mock('@/components/categories/SongPickerSongList.vue', () => ({
  default: {
    template: '<div>Song list</div>',
  },
}))

describe('SongPickerSongView', () => {
  it('formats the anime release format label in the summary panel', () => {
    setActivePinia(createPinia())

    const detailAnime: AniListSearchResult = {
      id: 1,
      title: {
        userPreferred: 'Example',
        romaji: 'Example',
        english: null,
        native: null,
      },
      coverImage: {
        large: 'https://example.com/cover.jpg',
        medium: null,
        extraLarge: null,
        color: null,
      },
      description: null,
      seasonYear: 2024,
      format: AnimeFormat.TvShort,
      siteUrl: 'https://anilist.co/anime/1',
    }

    const wrapper = mount(SongPickerSongView, {
      props: {
        detailAnime,
        songs: [],
        selectedSong: createSongSelection({
          animeId: 1,
          animeTitle: detailAnime.title,
          animeCoverImage: detailAnime.coverImage,
          song: {
            id: 1,
            type: ThemeType.OP,
            slug: 'opening-1',
            artist: 'Artist',
          },
        }),
        songFilterTypes: [ThemeType.OP],
        songErrorMessage: null,
        songStatus: 'ready',
      },
    })

    expect(wrapper.text()).toContain('TV Short')
    expect(wrapper.text()).toContain('Clear song')
  })
})
