// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import SongPickerDialog from '@/components/categories/SongPickerDialog.vue'
import { createEmptyFilterState } from '@/lib/filter-state'
import { createSongSelection } from '@/lib/song-selection'
import { AnimeFormat, AnimeSeason, CategoryEntityKind, ThemeType, type AniListSearchResponse, type AniListSearchResult, type Category } from '@/types'

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
  DialogClose: { template: '<div><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogOverlay: { template: '<div><slot /></div>' },
  DialogPortal: { template: '<div><slot /></div>' },
  DialogRoot: { template: '<div><slot /></div>' },
  DialogTrigger: { template: '<div><slot /></div>' },
  TooltipArrow: { template: '<div><slot /></div>' },
  TooltipContent: { template: '<div><slot /></div>' },
  TooltipPortal: { template: '<div><slot /></div>' },
  TooltipRoot: { template: '<div><slot /></div>' },
  TooltipTrigger: { template: '<div><slot /></div>' },
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

vi.mock('@/components/categories/SongPickerSongView.vue', () => ({
  default: {
    props: ['detailAnime', 'songs', 'songErrorMessage', 'songStatus', 'selectedSong', 'songFilterTypes', 'showBackButton'],
    emits: ['back', 'clear', 'previewSong', 'retrySongs', 'selectSong'],
    template: '<div class="song-view">Song view {{ detailAnime?.title?.userPreferred ?? "" }}</div>',
  },
}))

vi.mock('@/components/categories/AnimePickerBrowser.vue', () => ({
  default: {
    props: ['open', 'category', 'globalFilter', 'selectedMediaId', 'showClearButton', 'emptyMessage'],
    emits: ['selectResult', 'clear'],
    template: '<div><button type="button" class="select-result" @click="$emit(\'selectResult\', { id: 42, title: { userPreferred: \'Haibane Renmei\', romaji: \'Haibane Renmei\', english: null, native: null }, coverImage: { large: \'https://img.example/haibane-large.jpg\', medium: null, extraLarge: null, color: \'#475569\' }, description: \'A quiet synopsis.\', season: \'FALL\', seasonYear: 2002, format: \'TV\', siteUrl: \'https://anilist.co/anime/42\' })">select</button><button v-if="false" type="button" class="clear-result" @click="$emit(\'clear\')">Unselect</button><span class="anime-view-hydrated">A quiet synopsis. 2002</span></div>',
  },
}))

vi.mock('@/components/categories/SongPickerStepper.vue', () => ({
  default: {
    props: ['activeView', 'canNavigateToSongView'],
    emits: ['update:activeView'],
    template: '<div class="stepper"><button type="button" class="step-anime" @click="$emit(\'update:activeView\', \'anime\')">Anime</button><button type="button" class="step-song" :disabled="!canNavigateToSongView" @click="$emit(\'update:activeView\', \'song\')">Song</button><span class="active-view">{{ activeView }}</span></div>',
  },
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

const openDialog = async (wrapper: ReturnType<typeof mount>) => {
  ;(wrapper.vm as unknown as { open: boolean }).open = true
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
  await nextTick()
}

describe('SongPickerDialog', () => {
  it('opens on anime view and keeps the song step disabled without a selection', async () => {
    setActivePinia(createPinia())

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
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeSongs.mockResolvedValue({
      animeId: 42,
      animeTitle: selectedSong.animeTitle,
      animeCoverImage: selectedSong.animeCoverImage,
      songs: [],
    })

    const wrapper = mount(SongPickerDialog, {
      props: {
        category,
        globalFilter: createEmptyFilterState(),
      },
    })

    await openDialog(wrapper)

    expect(wrapper.find('.active-view').text()).toBe('anime')
    expect(wrapper.find('.step-song').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.song-view').exists()).toBe(false)
  })

  it('hydrates the selected anime metadata in the pinned result', async () => {
    setActivePinia(createPinia())

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
      },
    })

    await openDialog(wrapper)

    expect(mocks.fetchAniListMediaById).toHaveBeenCalledWith(42, 'token')
    expect(wrapper.text()).toContain('A quiet synopsis.')
    expect(wrapper.text()).toContain('2002')
    expect(wrapper.find('.active-view').text()).toBe('anime')
    expect(wrapper.find('.step-song').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.song-view').exists()).toBe(false)
  })

  it('keeps the clear action out of the anime cards', async () => {
    setActivePinia(createPinia())

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
      },
    })

    await openDialog(wrapper)

    expect(wrapper.find('.clear-result').exists()).toBe(false)
  })

  it('switches to the song view immediately after selecting an anime', async () => {
    setActivePinia(createPinia())

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
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeSongs.mockResolvedValue({
      animeId: 42,
      animeTitle: selectedSong.animeTitle,
      animeCoverImage: selectedSong.animeCoverImage,
      songs: [],
    })

    const wrapper = mount(SongPickerDialog, {
      props: {
        category,
        globalFilter: createEmptyFilterState(),
      },
    })

    await openDialog(wrapper)
    await wrapper.find('.select-result').trigger('click')
    await Promise.resolve()
    await nextTick()

    expect(wrapper.find('.active-view').text()).toBe('song')
    expect(wrapper.find('.song-view').exists()).toBe(true)
    expect(wrapper.find('.step-song').attributes('disabled')).toBeUndefined()
  })
})
