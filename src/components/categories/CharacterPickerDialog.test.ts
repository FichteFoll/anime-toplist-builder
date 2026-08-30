// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AniListCharacterCreditsResponse } from '@/api'
import CharacterPickerDialog from '@/components/categories/CharacterPickerDialog.vue'
import { createEmptyFilterState } from '@/lib/filter-state'
import { createEmptySongFilterState } from '@/lib/song-selection'
import {
  createCharacterSelection,
  createEmptyCharacterFilterState,
  createEmptyVoiceActorFilterState,
} from '@/lib/relation-selection'
import {
  AnimeFormat,
  AnimeSeason,
  CategoryEntityKind,
  CharacterRole,
  type AniListSearchResult,
  type Category,
  type CharacterSelection,
} from '@/types'

const mocks = vi.hoisted(() => ({
  fetchAniListMediaById: vi.fn(),
  fetchAnimeCharacterCredits: vi.fn(),
  searchAnimeMedia: vi.fn(),
  resolveAccessTokenForRequest: vi.fn(() => 'token'),
  handleRequestAuthFailure: vi.fn(() => false),
}))

vi.mock('@/api', () => ({
  fetchAniListMediaById: mocks.fetchAniListMediaById,
  fetchAnimeCharacterCredits: mocks.fetchAnimeCharacterCredits,
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

vi.mock('@/components/DialogHeader.vue', () => ({
  default: { template: '<div />' },
}))

vi.mock('@/components/categories/AnimePickerBrowser.vue', () => ({
  default: {
    props: ['open', 'category', 'globalFilter', 'selectedMediaId', 'showClearButton', 'emptyMessage'],
    emits: ['selectResult', 'clear'],
    template: '<div><button type="button" class="select-result" @click="$emit(\'selectResult\', { id: 42, title: { userPreferred: \'Haibane Renmei\', romaji: \'Haibane Renmei\', english: null, native: null }, coverImage: { large: \'https://img.example/haibane-large.jpg\', medium: null, extraLarge: null, color: \'#475569\' }, description: \'A quiet synopsis.\', season: \'FALL\', seasonYear: 2002, format: \'TV\', siteUrl: \'https://anilist.co/anime/42\' })">select</button><span class="anime-view-hydrated">{{ selectedMediaId ?? "none" }}</span></div>',
  },
}))

vi.mock('@/components/categories/PickerStepper.vue', () => ({
  default: {
    props: ['activeKey', 'steps', 'disabledKeys'],
    emits: ['update:activeKey'],
    template: '<div class="stepper"><button type="button" class="step-anime" @click="$emit(\'update:activeKey\', \'anime\')">Anime</button><button type="button" class="step-character" :disabled="disabledKeys.includes(\'character\')" @click="$emit(\'update:activeKey\', \'character\')">Character</button><span class="active-view">{{ activeKey }}</span></div>',
  },
}))

const animeTitle = {
  userPreferred: 'Haibane Renmei',
  romaji: 'Haibane Renmei',
  english: null,
  native: null,
}

const animeCoverImage = {
  large: 'https://img.example/haibane-large.jpg',
  medium: null,
  extraLarge: null,
  color: '#475569',
}

const createCategory = (roles: Array<CharacterRole> = []): Category => ({
  id: 'category-1',
  name: 'Best Girl',
  description: '',
  filter: createEmptyFilterState(),
  entityKind: CategoryEntityKind.Character,
  songFilter: createEmptySongFilterState(),
  characterFilter: { ...createEmptyCharacterFilterState(), roles },
  voiceActorFilter: createEmptyVoiceActorFilterState(),
})

const createResult = (): AniListSearchResult => ({
  id: 42,
  title: animeTitle,
  coverImage: animeCoverImage,
  description: 'A quiet synopsis.',
  season: AnimeSeason.Fall,
  seasonYear: 2002,
  format: AnimeFormat.Tv,
  siteUrl: 'https://anilist.co/anime/42',
})

const creditsResponse: AniListCharacterCreditsResponse = {
  pageInfo: {
    currentPage: 1,
    hasNextPage: false,
    lastPage: 1,
    perPage: 25,
    total: 2,
  },
  credits: [
    {
      characterId: 7,
      name: 'Rakka',
      nativeName: 'ラッカ',
      image: { large: 'https://img.example/rakka-large.jpg', medium: null },
      role: CharacterRole.Main,
      voiceActors: [],
    },
    {
      characterId: 8,
      name: 'Kuu',
      nativeName: null,
      image: { large: 'https://img.example/kuu-large.jpg', medium: null },
      role: CharacterRole.Supporting,
      voiceActors: [],
    },
  ],
}

const selectedCharacter: CharacterSelection = createCharacterSelection({
  characterId: 8,
  characterName: 'Kuu',
  characterNativeName: null,
  characterImage: { large: 'https://img.example/kuu-large.jpg', medium: null },
  role: CharacterRole.Supporting,
  animeId: 42,
  animeTitle,
  animeCoverImage,
})

// AniList caps this connection at 25 credits per page, so a large cast
// arrives across several pages and the role filter may match none of the first.
const mainOnlyFirstPage: AniListCharacterCreditsResponse = {
  pageInfo: {
    currentPage: 1,
    hasNextPage: true,
    lastPage: 2,
    perPage: 25,
    total: 3,
  },
  credits: [
    {
      characterId: 7,
      name: 'Rakka',
      nativeName: 'ラッカ',
      image: { large: 'https://img.example/rakka-large.jpg', medium: null },
      role: CharacterRole.Main,
      voiceActors: [],
    },
  ],
}

const supportingSecondPage: AniListCharacterCreditsResponse = {
  pageInfo: {
    currentPage: 2,
    hasNextPage: false,
    lastPage: 2,
    perPage: 25,
    total: 3,
  },
  credits: [
    {
      characterId: 9,
      name: 'Reki',
      nativeName: null,
      image: { large: 'https://img.example/reki-large.jpg', medium: null },
      role: CharacterRole.Supporting,
      voiceActors: [],
    },
  ],
}

const openDialog = async (wrapper: ReturnType<typeof mount>) => {
  ;(wrapper.vm as unknown as { open: boolean }).open = true
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
  await nextTick()
}

const mountDialog = (category: Category, character?: CharacterSelection) => mount(CharacterPickerDialog, {
  props: {
    category,
    globalFilter: createEmptyFilterState(),
    selectedCharacter: character ?? null,
  },
})

describe('CharacterPickerDialog', () => {
  // Each case queues its own responses, so a leftover `mockResolvedValueOnce`
  // from an earlier case must not answer a later one's first request.
  beforeEach(() => {
    mocks.fetchAnimeCharacterCredits.mockReset()
    mocks.fetchAniListMediaById.mockReset()
  })

  it('opens on the anime step and keeps the character step disabled without a selection', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsResponse)

    const wrapper = mountDialog(createCategory())

    await openDialog(wrapper)

    expect(wrapper.find('.active-view').text()).toBe('anime')
    expect(wrapper.find('.step-character').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.credit-row').exists()).toBe(false)
  })

  it('loads the credits of the selected anime and advances to the character step', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsResponse)

    const wrapper = mountDialog(createCategory())

    await openDialog(wrapper)
    await wrapper.find('.select-result').trigger('click')
    await Promise.resolve()
    await nextTick()

    expect(mocks.fetchAnimeCharacterCredits).toHaveBeenCalledWith({ animeId: 42, accessToken: 'token' })
    expect(wrapper.find('.active-view').text()).toBe('character')
    expect(wrapper.find('.step-character').attributes('disabled')).toBeUndefined()
    expect(wrapper.findAll('.credit-row')).toHaveLength(2)
    expect(wrapper.text()).toContain('Rakka')
    expect(wrapper.text()).toContain('Main')
  })

  it('keeps loading pages until the role filter matches a credit', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits
      .mockResolvedValueOnce(mainOnlyFirstPage)
      .mockResolvedValueOnce(supportingSecondPage)

    const wrapper = mountDialog(createCategory([CharacterRole.Supporting]))

    await openDialog(wrapper)
    await wrapper.find('.select-result').trigger('click')
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    await nextTick()

    // The first page holds only a main character, so the supporting-only
    // category would otherwise show an empty list with nothing to scroll.
    expect(mocks.fetchAnimeCharacterCredits).toHaveBeenNthCalledWith(2, {
      animeId: 42,
      page: 2,
      accessToken: 'token',
    })
    expect(wrapper.findAll('.credit-row')).toHaveLength(1)
    expect(wrapper.text()).toContain('Reki')
    expect(wrapper.text()).not.toContain("No character matched this category's role filter.")
  })

  it('loads the next page when the credit list is scrolled to its end', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits
      .mockResolvedValueOnce(mainOnlyFirstPage)
      .mockResolvedValueOnce(supportingSecondPage)

    const wrapper = mountDialog(createCategory())

    await openDialog(wrapper)
    await wrapper.find('.select-result').trigger('click')
    await Promise.resolve()
    await nextTick()

    // Every credit matches, so nothing was loaded past the first page yet.
    expect(mocks.fetchAnimeCharacterCredits).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.load-more-credits').exists()).toBe(true)

    const scroller = wrapper.find('section')

    Object.defineProperty(scroller.element, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(scroller.element, 'clientHeight', { value: 400, configurable: true })
    Object.defineProperty(scroller.element, 'scrollTop', { value: 500, configurable: true })
    await scroller.trigger('scroll')
    await Promise.resolve()
    await nextTick()

    expect(mocks.fetchAnimeCharacterCredits).toHaveBeenNthCalledWith(2, {
      animeId: 42,
      page: 2,
      accessToken: 'token',
    })
    expect(wrapper.findAll('.credit-row')).toHaveLength(2)
    expect(wrapper.find('.load-more-credits').exists()).toBe(false)
  })

  it('leaves the credit list alone while the scroll position is far from the end', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits
      .mockResolvedValueOnce(mainOnlyFirstPage)
      .mockResolvedValueOnce(supportingSecondPage)

    const wrapper = mountDialog(createCategory())

    await openDialog(wrapper)
    await wrapper.find('.select-result').trigger('click')
    await Promise.resolve()
    await nextTick()

    const scroller = wrapper.find('section')

    Object.defineProperty(scroller.element, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(scroller.element, 'clientHeight', { value: 400, configurable: true })
    Object.defineProperty(scroller.element, 'scrollTop', { value: 0, configurable: true })
    await scroller.trigger('scroll')
    await Promise.resolve()
    await nextTick()

    expect(mocks.fetchAnimeCharacterCredits).toHaveBeenCalledTimes(1)
  })

  it('emits the picked credit as a character selection', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsResponse)

    const wrapper = mountDialog(createCategory())

    await openDialog(wrapper)
    await wrapper.find('.select-result').trigger('click')
    await Promise.resolve()
    await nextTick()
    await wrapper.findAll('.credit-row')[0].trigger('click')

    expect(wrapper.emitted('select')).toEqual([[{
      kind: 'character',
      characterId: 7,
      characterName: 'Rakka',
      characterNativeName: 'ラッカ',
      characterImage: { large: 'https://img.example/rakka-large.jpg', medium: null },
      role: CharacterRole.Main,
      animeId: 42,
      animeTitle,
      animeCoverImage,
    }]])
    expect((wrapper.vm as unknown as { open: boolean }).open).toBe(false)
  })

  it('restores the stored anime and marks the stored character when reopened', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(createResult())
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsResponse)

    const wrapper = mountDialog(createCategory(), selectedCharacter)

    await openDialog(wrapper)

    expect(mocks.fetchAniListMediaById).toHaveBeenCalledWith(42, 'token')
    expect(wrapper.find('.anime-view-hydrated').text()).toBe('42')
    expect(wrapper.find('.active-view').text()).toBe('anime')
    expect(wrapper.find('.step-character').attributes('disabled')).toBeUndefined()

    await wrapper.find('.step-character').trigger('click')

    const rows = wrapper.findAll('.credit-row')

    expect(rows).toHaveLength(2)
    expect(rows[0].attributes('aria-pressed')).toBe('false')
    expect(rows[1].attributes('aria-pressed')).toBe('true')
  })

  it('reuses the credits of an anime it has already fetched', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsResponse)
    mocks.fetchAnimeCharacterCredits.mockClear()

    const wrapper = mountDialog(createCategory())

    await openDialog(wrapper)
    await wrapper.find('.select-result').trigger('click')
    await Promise.resolve()
    await nextTick()

    expect(mocks.fetchAnimeCharacterCredits).toHaveBeenCalledTimes(1)

    await wrapper.find('.step-anime').trigger('click')
    await wrapper.find('.select-result').trigger('click')

    expect(mocks.fetchAnimeCharacterCredits).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).not.toContain('Loading characters...')
    expect(wrapper.findAll('.credit-row')).toHaveLength(2)
  })

  it('explains that the role filter excluded every credit', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsResponse)

    const wrapper = mountDialog(createCategory([CharacterRole.Background]))

    await openDialog(wrapper)
    await wrapper.find('.select-result').trigger('click')
    await Promise.resolve()
    await nextTick()

    expect(wrapper.findAll('.credit-row')).toHaveLength(0)
    expect(wrapper.text()).toContain("No character matched this category's role filter.")
    expect(wrapper.text()).not.toContain('This anime has no character entries on AniList.')
  })

  it('hides credits whose role is excluded by the category character filter', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsResponse)

    const wrapper = mountDialog(createCategory([CharacterRole.Main]))

    await openDialog(wrapper)
    await wrapper.find('.select-result').trigger('click')
    await Promise.resolve()
    await nextTick()

    expect(wrapper.findAll('.credit-row')).toHaveLength(1)
    expect(wrapper.text()).toContain('Rakka')
    expect(wrapper.text()).not.toContain('Kuu')
  })
})
