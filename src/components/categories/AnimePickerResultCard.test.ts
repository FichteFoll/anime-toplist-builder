// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'

import AnimePickerResultCard from '@/components/categories/AnimePickerResultCard.vue'
import { AnimeFormat, type AniListSearchResult } from '@/types'

describe('AnimePickerResultCard', () => {
  it('formats the anime release format label', () => {
    setActivePinia(createPinia())

    const result: AniListSearchResult = {
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

    const wrapper = mount(AnimePickerResultCard, {
      props: {
        result,
        isSelected: false,
      },
    })

    expect(wrapper.text()).toContain('TV Short')
  })
})
