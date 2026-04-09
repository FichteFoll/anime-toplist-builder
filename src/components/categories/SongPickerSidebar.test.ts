// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SongPickerSidebar from '@/components/categories/SongPickerSidebar.vue'
import type { AniListSearchResult } from '@/types'

describe('SongPickerSidebar', () => {
  it('formats the anime release format label in the detail panel', () => {
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
      format: 'TV_SHORT',
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
        titleLanguage: 'english',
      },
    })

    expect(wrapper.text()).toContain('TV Short')
  })
})
