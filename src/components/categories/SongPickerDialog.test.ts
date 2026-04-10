// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import SongPickerDialog from '@/components/categories/SongPickerDialog.vue'
import { createEmptyFilterState } from '@/lib/filter-state'
import { createSongSelection } from '@/lib/song-selection'
import { AnimeFormat, AnimeSeason, AnimeTitleLanguage, CategoryEntityKind, ThemeType, type AniListSearchResponse, type AniListSearchResult, type Category } from '@/types'

const mocks = vi.hoisted(() => ({
  fetchAniListMediaById: vi.fn(),
  searchAnimeMedia: vi.fn(),
  fetchAnimeSongs: vi.fn(),
  resolveAccessTokenForRequest: vi.fn(() => 'token'),
  handleRequestAuthFailure: vi.fn(() => false),
}))

vi.mock('@/api', () => ({
  fetchAniListMediaById: mocks.fetchAniListMediaById,
  fetchAnimeSongs: mocks.fetchAnimeSongs,
  normalizeAnimeThemesError: vi.fn((error: unknown) => ({
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
  DialogContent: { template: '<div><slot /></div>' },
  DialogOverlay: { template: '<div><slot /></div>' },
  DialogPortal: { template: '<div><slot /></div>' },
  DialogRoot: { template: '<div><slot /></div>' },
  DialogTrigger: { template: '<div><slot /></div>' },
  TooltipArrow: { template: '<div><slot /></div>' },
  TooltipContent: { template: '<div><slot /></div>' },
  TooltipPortal: { template: '<div><slot /></div>' },
  TooltipRoot: { template: '<div><slot /></slot></div>' },
  TooltipTrigger: { template: '<div><slot /></slot></div>' },
}))

vi.mock('@/components/categories/AnimePickerResultCard.vue', () => ({
  default: {
    props: ['result', 'titleLanguage', 'isSelected', 'showClearButton'],
    emits: ['select', 'clear'],
    template: '<div><button type="button" class="select-result" @click="$emit(\'select\', result)">select</button><button v-if="showClearButton !== false && isSelected" type="button" class="clear-result" @click="$emit(\'clear\')">Unselect</button>{{ result.description ?? "" }} {{ result.seasonYear ?? "" }}</div>',
  },
}))

vi.mock('@/components/categories/PickerDialogHeader.vue', () => ({
  default: { template: '<div />' },
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

vi.mock('@/components/categories/SongPreviewDialog.vue', () => ({
  default: { template: '<div />' },
}))

vi.mock('@/components/categories/SongPickerSidebar.vue', () => ({
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

const selectedSong = createSongSelection({
  animeId: 42,
  animeTitle: {
    userPreferred: 'Haibane Renmei',
    romaji: 'Haibane Renmei',
    english: null,
    native: null,
  },
  animeCoverImage: {
    large: 'https://img.example/haibane-large.jpg',
    medium: null,
    extraLarge: null,
    color: '#475569',
  },
  song: {
    id: 7,
    type: ThemeType.OP,
    slug: 'op1',
    title: 'Blue Flow',
    titleNative: null,
    artist: 'ROUND TABLE',
  },
})

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
  description: 'A quiet synopsis.',
  season: AnimeSeason.Fall,
  seasonYear: 2002,
  format: AnimeFormat.Tv,
  siteUrl: 'https://anilist.co/anime/42',
})

describe('SongPickerDialog', () => {
  it('hydrates the selected anime metadata in the pinned result', async () => {
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
    mocks.fetchAniListMediaById.mockResolvedValue(createResult())
    mocks.fetchAnimeSongs.mockResolvedValue({
      animeId: 42,
      animeTitle: selectedSong.animeTitle,
      animeCoverImage: selectedSong.animeCoverImage,
      songs: [
        {
          id: 7,
          type: ThemeType.OP,
          slug: 'op1',
          title: 'Blue Flow',
          titleNative: null,
          artist: 'ROUND TABLE',
        },
      ],
    })

    const wrapper = mount(SongPickerDialog, {
      props: {
        category,
        globalFilter: createEmptyFilterState(),
        selectedSong,
        titleLanguage: AnimeTitleLanguage.English,
      },
    })

    ;(wrapper.vm as unknown as { open: boolean }).open = true
    await Promise.resolve()
    await Promise.resolve()
    await nextTick()
    await nextTick()

    expect(mocks.fetchAniListMediaById).toHaveBeenCalledWith(42, 'token')
    expect(wrapper.text()).toContain('A quiet synopsis.')
    expect(wrapper.text()).toContain('2002')
  })

  it('shows the clear action in the detail panel instead of the anime cards', async () => {
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
    mocks.fetchAniListMediaById.mockResolvedValue(createResult())
    mocks.fetchAnimeSongs.mockResolvedValue({
      animeId: 42,
      animeTitle: selectedSong.animeTitle,
      animeCoverImage: selectedSong.animeCoverImage,
      songs: [
        {
          id: 7,
          type: ThemeType.OP,
          slug: 'op1',
          title: 'Blue Flow',
          titleNative: null,
          artist: 'ROUND TABLE',
        },
      ],
    })

    const wrapper = mount(SongPickerDialog, {
      props: {
        category,
        globalFilter: createEmptyFilterState(),
        selectedSong,
        titleLanguage: AnimeTitleLanguage.English,
      },
    })

    ;(wrapper.vm as unknown as { open: boolean }).open = true
    await Promise.resolve()
    await Promise.resolve()
    await nextTick()
    await nextTick()

    expect(wrapper.text()).toContain('Unselect')
  })
})
