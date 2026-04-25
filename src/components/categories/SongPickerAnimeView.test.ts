// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import SongPickerAnimeView from '@/components/categories/SongPickerAnimeView.vue'
import { createEmptyFilterState } from '@/lib/filter-state'
import { CategoryEntityKind, AnimeFormat, AnimeSeason, type AniListSearchResponse, type Category } from '@/types'

const mocks = vi.hoisted(() => ({
  searchAnimeMedia: vi.fn(),
  resolveAccessTokenForRequest: vi.fn(() => 'token'),
  handleRequestAuthFailure: vi.fn(() => false),
}))

vi.mock('@/api', () => ({
  normalizeAniListError: vi.fn((error: unknown) => ({
    message: error instanceof Error ? error.message : 'Unknown error',
  })),
  searchAnimeMedia: mocks.searchAnimeMedia,
}))

vi.mock('@/stores/anilist-auth', () => ({
  useAniListAuthStore: () => ({
    handleRequestAuthFailure: mocks.handleRequestAuthFailure,
    isAuthenticated: false,
    resolveAccessTokenForRequest: mocks.resolveAccessTokenForRequest,
  }),
}))

vi.mock('@/stores/picker-filters', () => ({
  usePickerFiltersStore: () => ({
    hideOnList: false,
    listVisibility: null,
    onlyOnList: false,
    toggleListVisibility: vi.fn(),
  }),
}))

vi.mock('@/components/categories/AnimePickerResultCard.vue', () => ({
  default: {
    props: ['result', 'titleLanguage', 'isSelected', 'showClearButton'],
    emits: ['select', 'clear'],
    template: '<div class="result-card">{{ result.id }}</div>',
  },
}))

vi.mock('@/components/categories/PickerFilterSummary.vue', () => ({
  default: { template: '<div />' },
}))

vi.mock('@/components/categories/PickerResultsFrame.vue', () => ({
  default: { template: '<div><slot /></div>' },
}))

vi.mock('@/components/categories/PickerSearchToolbar.vue', () => ({
  default: { template: '<div />' },
}))

const category: Category = {
  id: 'category-1',
  name: 'Best Opening',
  description: '',
  filter: createEmptyFilterState(),
  entityKind: CategoryEntityKind.Song,
  songFilter: { types: [] },
}

describe('SongPickerAnimeView', () => {
  it('loads results with an empty search when opened', async () => {
    setActivePinia(createPinia())

    const response: AniListSearchResponse = {
      pageInfo: {
        currentPage: 1,
        hasNextPage: false,
        lastPage: 1,
        perPage: 15,
        total: 1,
      },
      results: [{
        id: 42,
        title: {
          userPreferred: 'Haibane Renmei',
          romaji: 'Haibane Renmei',
          english: null,
          native: null,
        },
        coverImage: {
          large: 'https://img.example/haibane-large.jpg',
          medium: null,
          extraLarge: null,
          color: '#475569',
        },
        description: null,
        season: AnimeSeason.Fall,
        seasonYear: 2002,
        format: AnimeFormat.Tv,
        siteUrl: 'https://anilist.co/anime/42',
      }],
    }

    mocks.searchAnimeMedia.mockResolvedValue(response)

    const wrapper = mount(SongPickerAnimeView, {
      props: {
        open: true,
        category,
        globalFilter: createEmptyFilterState(),
        focusedAnimeId: null,
      },
    })

    await Promise.resolve()
    await Promise.resolve()
    await nextTick()

    expect(mocks.searchAnimeMedia).toHaveBeenCalledWith(expect.objectContaining({ search: '' }))
    expect(wrapper.find('.result-card').exists()).toBe(true)
  })
})
