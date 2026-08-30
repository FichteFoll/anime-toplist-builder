// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AniListCharacterCreditsResponse } from '@/api'
import VoiceActorPickerDialog from '@/components/categories/VoiceActorPickerDialog.vue'
import { createEmptyFilterState } from '@/lib/filter-state'
import { createEmptySongFilterState } from '@/lib/song-selection'
import {
  createEmptyCharacterFilterState,
  createEmptyVoiceActorFilterState,
  createVoiceActorSelection,
} from '@/lib/relation-selection'
import {
  AnimeFormat,
  AnimeSeason,
  CategoryEntityKind,
  CharacterRole,
  type AniListSearchResult,
  type Category,
  type VoiceActorSelection,
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
    template: '<div class="stepper"><button type="button" class="step-anime" @click="$emit(\'update:activeKey\', \'anime\')">Anime</button><button type="button" class="step-voice-actor" :disabled="disabledKeys.includes(\'voice-actor\')" @click="$emit(\'update:activeKey\', \'voice-actor\')">Voice actor</button><span class="active-view">{{ activeKey }}</span><span class="step-labels">{{ steps.map((step) => step.label).join(\'|\') }}</span></div>',
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

const rakkaImage = { large: 'https://img.example/rakka-large.jpg', medium: null }
const kuuImage = { large: 'https://img.example/kuu-large.jpg', medium: null }
const hirohashiImage = { large: 'https://img.example/hirohashi-large.jpg', medium: null }
const savageImage = { large: 'https://img.example/savage-large.jpg', medium: null }
const booneImage = { large: 'https://img.example/boone-large.jpg', medium: null }

const createCategory = (languages: Array<string> = []): Category => ({
  id: 'category-1',
  name: 'Best Voice Artist Performance',
  description: '',
  filter: createEmptyFilterState(),
  entityKind: CategoryEntityKind.VoiceActor,
  songFilter: createEmptySongFilterState(),
  characterFilter: createEmptyCharacterFilterState(),
  voiceActorFilter: { ...createEmptyVoiceActorFilterState(), languages },
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

const createCreditsResponse = (
  credits: AniListCharacterCreditsResponse['credits'],
): AniListCharacterCreditsResponse => ({
  pageInfo: {
    currentPage: 1,
    hasNextPage: false,
    lastPage: 1,
    perPage: 25,
    total: credits.length,
  },
  credits,
})

// Ryo Hirohashi voices both characters, so a row is identified by the
// (character, voice actor) pair rather than by the voice actor alone.
const creditsResponse = createCreditsResponse([
  {
    characterId: 7,
    name: 'Rakka',
    nativeName: 'ラッカ',
    image: rakkaImage,
    role: CharacterRole.Main,
    voiceActors: [
      {
        voiceActorId: 101,
        name: 'Ryo Hirohashi',
        nativeName: '広橋涼',
        image: hirohashiImage,
        language: 'Japanese',
      },
      {
        voiceActorId: 102,
        name: 'Carrie Savage',
        nativeName: null,
        image: savageImage,
        language: 'English',
      },
    ],
  },
  {
    characterId: 8,
    name: 'Kuu',
    nativeName: null,
    image: kuuImage,
    role: CharacterRole.Supporting,
    voiceActors: [
      {
        voiceActorId: 101,
        name: 'Ryo Hirohashi',
        nativeName: '広橋涼',
        image: hirohashiImage,
        language: 'Japanese',
      },
      {
        voiceActorId: 103,
        name: 'Jessica Boone',
        nativeName: null,
        image: booneImage,
        language: 'English',
      },
    ],
  },
])

const creditsWithoutVoiceActors = createCreditsResponse([
  {
    characterId: 7,
    name: 'Rakka',
    nativeName: 'ラッカ',
    image: rakkaImage,
    role: CharacterRole.Main,
    voiceActors: [],
  },
])

const selectedVoiceActor: VoiceActorSelection = createVoiceActorSelection({
  voiceActorId: 101,
  voiceActorName: 'Ryo Hirohashi',
  voiceActorNativeName: '広橋涼',
  voiceActorImage: hirohashiImage,
  language: 'Japanese',
  characterId: 8,
  characterName: 'Kuu',
  characterNativeName: null,
  characterImage: kuuImage,
  role: CharacterRole.Supporting,
  animeId: 42,
  animeTitle,
  animeCoverImage,
})

const openDialog = async (wrapper: ReturnType<typeof mount>) => {
  ;(wrapper.vm as unknown as { open: boolean }).open = true
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
  await nextTick()
}

// AniList caps this connection at 25 credits per page, so a large cast
// arrives across several pages and the language filter may match none of the first.
const japaneseOnlyFirstPage: AniListCharacterCreditsResponse = {
  ...createCreditsResponse([
    {
      characterId: 7,
      name: 'Rakka',
      nativeName: 'ラッカ',
      image: rakkaImage,
      role: CharacterRole.Main,
      voiceActors: [
        {
          voiceActorId: 101,
          name: 'Ryo Hirohashi',
          nativeName: '広橋涼',
          image: hirohashiImage,
          language: 'Japanese',
        },
      ],
    },
  ]),
  pageInfo: {
    currentPage: 1,
    hasNextPage: true,
    lastPage: 2,
    perPage: 25,
    total: 2,
  },
}

const englishSecondPage: AniListCharacterCreditsResponse = {
  ...createCreditsResponse([
    {
      characterId: 8,
      name: 'Kuu',
      nativeName: null,
      image: kuuImage,
      role: CharacterRole.Supporting,
      voiceActors: [
        {
          voiceActorId: 103,
          name: 'Jessica Boone',
          nativeName: null,
          image: booneImage,
          language: 'English',
        },
      ],
    },
  ]),
  pageInfo: {
    currentPage: 2,
    hasNextPage: false,
    lastPage: 2,
    perPage: 25,
    total: 2,
  },
}

const mountDialog = (category: Category, voiceActor?: VoiceActorSelection) => mount(VoiceActorPickerDialog, {
  props: {
    category,
    globalFilter: createEmptyFilterState(),
    selectedVoiceActor: voiceActor ?? null,
  },
})

const selectAnime = async (wrapper: ReturnType<typeof mount>) => {
  await wrapper.find('.select-result').trigger('click')
  await Promise.resolve()
  await nextTick()
}

describe('VoiceActorPickerDialog', () => {
  // Each case queues its own responses, so a leftover `mockResolvedValueOnce`
  // from an earlier case must not answer a later one's first request.
  beforeEach(() => {
    mocks.fetchAnimeCharacterCredits.mockReset()
    mocks.fetchAniListMediaById.mockReset()
  })

  it('opens on the anime step and keeps the voice actor step disabled without a selection', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsResponse)

    const wrapper = mountDialog(createCategory())

    await openDialog(wrapper)

    expect(wrapper.find('.active-view').text()).toBe('anime')
    expect(wrapper.find('.step-voice-actor').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.step-labels').text()).toBe('Select Anime|Select Voice Actor')
    expect(wrapper.find('.credit-row').exists()).toBe(false)
  })

  it('keeps loading pages until the language filter matches a row', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits
      .mockResolvedValueOnce(japaneseOnlyFirstPage)
      .mockResolvedValueOnce(englishSecondPage)

    const wrapper = mountDialog(createCategory(['English']))

    await openDialog(wrapper)
    await selectAnime(wrapper)
    await Promise.resolve()
    await Promise.resolve()
    await nextTick()

    // The first page carries only a Japanese credit, so an English-only
    // category would otherwise show an empty list with nothing to scroll.
    expect(mocks.fetchAnimeCharacterCredits).toHaveBeenNthCalledWith(2, {
      animeId: 42,
      page: 2,
      accessToken: 'token',
    })
    expect(wrapper.findAll('.credit-row')).toHaveLength(1)
    expect(wrapper.text()).toContain('Jessica Boone')
    expect(wrapper.text()).not.toContain("No voice actor matched this category's language filter.")
  })

  it('shows the voice actor and the character image in a row', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsResponse)

    const wrapper = mountDialog(createCategory(['Japanese']))

    await openDialog(wrapper)
    await selectAnime(wrapper)

    const row = wrapper.findAll('.credit-row')[0]

    // A credit is a pairing, so a row has to show both halves of it.
    expect(row.find('.voice-actor-image').attributes('src')).toBe(hirohashiImage.large)
    expect(row.find('.character-image').attributes('src')).toBe(rakkaImage.large)
  })

  it('renders one row per voice actor of a credit', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsResponse)

    const wrapper = mountDialog(createCategory())

    await openDialog(wrapper)
    await selectAnime(wrapper)

    expect(mocks.fetchAnimeCharacterCredits).toHaveBeenCalledWith({ animeId: 42, accessToken: 'token' })
    expect(wrapper.find('.active-view').text()).toBe('voice-actor')

    const rows = wrapper.findAll('.credit-row')

    expect(rows).toHaveLength(4)
    expect(rows[0].text()).toContain('Ryo Hirohashi')
    expect(rows[0].text()).toContain('as Rakka')
    expect(rows[0].text()).toContain('Japanese')
    expect(rows[1].text()).toContain('Carrie Savage')
    expect(rows[1].text()).toContain('as Rakka')
    expect(rows[2].text()).toContain('Ryo Hirohashi')
    expect(rows[2].text()).toContain('as Kuu')
    expect(rows[3].text()).toContain('Jessica Boone')
  })

  it('hides rows whose language the category language filter excludes', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsResponse)

    const wrapper = mountDialog(createCategory(['Japanese']))

    await openDialog(wrapper)
    await selectAnime(wrapper)

    const rows = wrapper.findAll('.credit-row')

    expect(rows).toHaveLength(2)
    expect(wrapper.text()).not.toContain('Carrie Savage')
    expect(wrapper.text()).not.toContain('Jessica Boone')
  })

  it('matches the language filter case-insensitively', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsResponse)

    const wrapper = mountDialog(createCategory(['japanese']))

    await openDialog(wrapper)
    await selectAnime(wrapper)

    expect(wrapper.findAll('.credit-row')).toHaveLength(2)
  })

  it('explains that the language filter excluded every row', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsResponse)

    const wrapper = mountDialog(createCategory(['Korean']))

    await openDialog(wrapper)
    await selectAnime(wrapper)

    expect(wrapper.findAll('.credit-row')).toHaveLength(0)
    expect(wrapper.text()).toContain("No voice actor matched this category's language filter.")
    expect(wrapper.text()).not.toContain('This anime has no voice credits on AniList.')
  })

  it('explains that the anime carries no voice credits at all', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsWithoutVoiceActors)

    const wrapper = mountDialog(createCategory(['Japanese']))

    await openDialog(wrapper)
    await selectAnime(wrapper)

    expect(wrapper.findAll('.credit-row')).toHaveLength(0)
    expect(wrapper.text()).toContain('This anime has no voice credits on AniList.')
    expect(wrapper.text()).not.toContain("No voice actor matched this category's language filter.")
  })

  it('emits the picked row as a voice actor selection', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsResponse)

    const wrapper = mountDialog(createCategory())

    await openDialog(wrapper)
    await selectAnime(wrapper)
    await wrapper.findAll('.credit-row')[1].trigger('click')

    expect(wrapper.emitted('select')).toEqual([[{
      kind: 'voice-actor',
      voiceActorId: 102,
      voiceActorName: 'Carrie Savage',
      voiceActorNativeName: null,
      voiceActorImage: savageImage,
      language: 'English',
      characterId: 7,
      characterName: 'Rakka',
      characterNativeName: 'ラッカ',
      characterImage: rakkaImage,
      role: CharacterRole.Main,
      animeId: 42,
      animeTitle,
      animeCoverImage,
    }]])
    expect((wrapper.vm as unknown as { open: boolean }).open).toBe(false)
  })

  it('restores the stored anime and marks the stored row when reopened', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(createResult())
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsResponse)

    const wrapper = mountDialog(createCategory(), selectedVoiceActor)

    await openDialog(wrapper)

    expect(mocks.fetchAniListMediaById).toHaveBeenCalledWith(42, 'token')
    expect(wrapper.find('.anime-view-hydrated').text()).toBe('42')
    expect(wrapper.find('.active-view').text()).toBe('anime')
    expect(wrapper.find('.step-voice-actor').attributes('disabled')).toBeUndefined()

    await wrapper.find('.step-voice-actor').trigger('click')

    const rows = wrapper.findAll('.credit-row')

    expect(rows).toHaveLength(4)
    expect(rows.map((row) => row.attributes('aria-pressed'))).toEqual(['false', 'false', 'true', 'false'])
  })

  it('reuses the credits of an anime it has already fetched', async () => {
    setActivePinia(createPinia())
    mocks.fetchAniListMediaById.mockResolvedValue(null)
    mocks.fetchAnimeCharacterCredits.mockResolvedValue(creditsResponse)
    mocks.fetchAnimeCharacterCredits.mockClear()

    const wrapper = mountDialog(createCategory())

    await openDialog(wrapper)
    await selectAnime(wrapper)

    expect(mocks.fetchAnimeCharacterCredits).toHaveBeenCalledTimes(1)

    await wrapper.find('.step-anime').trigger('click')
    await wrapper.find('.select-result').trigger('click')

    expect(mocks.fetchAnimeCharacterCredits).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).not.toContain('Loading voice actors...')
    expect(wrapper.findAll('.credit-row')).toHaveLength(4)
  })
})
