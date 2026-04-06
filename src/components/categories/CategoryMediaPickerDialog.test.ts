// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import CategoryMediaPickerDialog from '@/components/categories/CategoryMediaPickerDialog.vue'
import { createEmptyFilterState } from '@/lib/filter-state'
import type { AniListSearchResponse, AniListSearchResult, Category } from '@/types'

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

vi.mock('reka-ui', () => ({
  DialogClose: {
    template: '<div><slot /></div>',
  },
  DialogContent: {
    template: '<div><slot /></div>',
  },
  DialogDescription: {
    template: '<div><slot /></div>',
  },
  DialogOverlay: {
    template: '<div><slot /></div>',
  },
  DialogPortal: {
    template: '<div><slot /></div>',
  },
  DialogRoot: {
    template: '<div><slot /></div>',
  },
  DialogTitle: {
    template: '<div><slot /></div>',
  },
  DialogTrigger: {
    template: '<div><slot /></div>',
  },
}))

const category: Category = {
  id: 'category-1',
  name: 'Best Opening',
  description: '',
  filter: createEmptyFilterState(),
}

const createResult = (): AniListSearchResult => ({
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
  season: 'FALL',
  seasonYear: 2002,
  format: 'TV',
  source: null,
  genres: [],
  tags: [],
  popularity: null,
  averageScore: null,
  countryOfOrigin: null,
  siteUrl: 'https://anilist.co/anime/42',
})

describe('CategoryMediaPickerDialog', () => {
  it('shows unselect for the selected result and clears it', async () => {
    const response: AniListSearchResponse = {
      pageInfo: {
        currentPage: 1,
        hasNextPage: false,
        lastPage: 1,
        perPage: 15,
        total: 1,
      },
      results: [createResult()],
    }

    mocks.searchAnimeMedia.mockResolvedValue(response)

    const wrapper = mount(CategoryMediaPickerDialog, {
      props: {
        category,
        globalFilter: createEmptyFilterState(),
        selectedMediaId: 42,
        titleLanguage: 'english',
      },
    });

    (wrapper.vm as { open: boolean }).open = true
    await nextTick()
    await nextTick()

    const unselectButton = wrapper.findAll('button').find((button) => button.text() === 'Unselect')

    expect(unselectButton).toBeDefined()

    await unselectButton!.trigger('click')

    expect(wrapper.emitted('clear')).toEqual([[]])
  })
})
