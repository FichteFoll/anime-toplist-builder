// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'

import SongPickerSidebar from '@/components/categories/SongPickerSidebar.vue'
import { AnimeFormat, type AniListSearchResult } from '@/types'

describe('SongPickerSidebar', () => {
  it('formats the anime release format label in the detail panel', () => {
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

    const wrapper = mount(SongPickerSidebar, {
      props: {
        detailAnime,
        isCollapsed: false,
        songs: [],
        songFilterTypes: [],
        songErrorMessage: null,
        songStatus: 'ready',
      },
    })

    expect(wrapper.text()).toContain('TV Short')
  })
})
