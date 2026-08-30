// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import { describe, expect, it, beforeEach } from 'vitest'

import CategoryCard from '@/components/categories/CategoryCard.vue'
import { createEmptyFilterState } from '@/lib/filter-state'
import { createAnimeSelection, createEmptySongFilterState, createSongSelection } from '@/lib/song-selection'
import {
  createCharacterSelection,
  createEmptyCharacterFilterState,
  createEmptyVoiceActorFilterState,
  createVoiceActorSelection,
} from '@/lib/relation-selection'
import {
  AnimeFormat,
  AnimeSeason,
  CategoryEntityKind,
  CharacterRole,
  ThemeType,
  type AnimeSelection,
  type Category,
} from '@/types'

const categoryMediaPickerStub = defineComponent({
  name: 'AnimePickerDialog',
  emits: ['clear', 'select'],
  template: `
    <div>
      <button type="button" class="emit-clear" @click="$emit('clear')">clear</button>
    </div>
  `,
})

const songPickerStub = defineComponent({
  name: 'SongPickerDialog',
  emits: ['clear', 'select'],
  template: '<div class="song-picker-stub" />',
})

const characterPickerStub = defineComponent({
  name: 'CharacterPickerDialog',
  emits: ['clear', 'select'],
  template: '<div class="character-picker-stub" />',
})

const voiceActorPickerStub = defineComponent({
  name: 'VoiceActorPickerDialog',
  emits: ['clear', 'select'],
  template: '<div class="voice-actor-picker-stub" />',
})

const category: Category = {
  id: 'category-1',
  name: 'Best Opening',
  description: '',
  filter: createEmptyFilterState(),
  entityKind: CategoryEntityKind.Anime,
  songFilter: createEmptySongFilterState(),
  characterFilter: createEmptyCharacterFilterState(),
  voiceActorFilter: createEmptyVoiceActorFilterState(),
}

const selection: AnimeSelection = createAnimeSelection({
  mediaId: 42,
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
  season: AnimeSeason.Fall,
  seasonYear: 2002,
  format: AnimeFormat.Tv,
})

describe('CategoryCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('forwards unselect from the picker dialog', async () => {

    const wrapper = mount(CategoryCard, {
      props: {
        category,
        selection,
        globalFilter: createEmptyFilterState(),
        metadata: null,
        metadataStatus: 'idle',
        metadataError: null,
        canReorder: false,
      },
      global: {
        stubs: {
          CategoryEditDialog: true,
          AnimePickerDialog: categoryMediaPickerStub,
          SongPickerDialog: songPickerStub,
          DeleteIcon: true,
          DragHandleIcon: true,
          TooltipArrow: true,
          TooltipContent: true,
          TooltipPortal: true,
          TooltipRoot: true,
          TooltipTrigger: true,
        },
      },
    })

    await wrapper.get('button.emit-clear').trigger('click')

    expect(wrapper.emitted('clearSelection')).toEqual([[ 'category-1' ]])
  })

  it('renders song selection details', () => {
    const wrapper = mount(CategoryCard, {
      props: {
        category: {
          ...category,
          entityKind: CategoryEntityKind.Song,
        },
        selection: createSongSelection({
          animeId: 42,
          animeTitle: selection.title,
          animeCoverImage: selection.coverImage,
          song: {
            id: 101,
            type: ThemeType.OP,
            slug: 'op1',
            title: 'Free Bird',
            artist: 'Ayaka',
            episodes: '2-12, 14',
          },
        }),
        globalFilter: createEmptyFilterState(),
        metadata: null,
        metadataStatus: 'idle',
        metadataError: null,
        canReorder: false,
      },
      global: {
        stubs: {
          CategoryEditDialog: true,
          AnimePickerDialog: categoryMediaPickerStub,
          SongPickerDialog: songPickerStub,
          DeleteIcon: true,
          DragHandleIcon: true,
          TooltipArrow: true,
          TooltipContent: true,
          TooltipPortal: true,
          TooltipRoot: true,
          TooltipTrigger: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Free Bird')
    expect(wrapper.text()).toContain('by Ayaka')
    expect(wrapper.text()).toContain('from Haibane Renmei (op1, eps 2-12, 14)')
  })

  it('hides the artist line when the song artist is blank', () => {
    const wrapper = mount(CategoryCard, {
      props: {
        category: {
          ...category,
          entityKind: CategoryEntityKind.Song,
        },
        selection: createSongSelection({
          animeId: 42,
          animeTitle: selection.title,
          animeCoverImage: selection.coverImage,
          song: {
            id: 101,
            type: ThemeType.OP,
            slug: 'op1',
            title: 'Free Bird',
            artist: '   ',
          },
        }),
        globalFilter: createEmptyFilterState(),
        metadata: null,
        metadataStatus: 'idle',
        metadataError: null,
        canReorder: false,
      },
      global: {
        stubs: {
          CategoryEditDialog: true,
          AnimePickerDialog: categoryMediaPickerStub,
          SongPickerDialog: songPickerStub,
          DeleteIcon: true,
          DragHandleIcon: true,
          TooltipArrow: true,
          TooltipContent: true,
          TooltipPortal: true,
          TooltipRoot: true,
          TooltipTrigger: true,
        },
      },
    })

    expect(wrapper.text()).not.toContain('by')
  })

  it('mounts the character picker for a character category', () => {
    const wrapper = mount(CategoryCard, {
      props: {
        category: {
          ...category,
          entityKind: CategoryEntityKind.Character,
        },
        selection: null,
        globalFilter: createEmptyFilterState(),
        metadata: null,
        metadataStatus: 'idle',
        metadataError: null,
        canReorder: false,
      },
      global: {
        stubs: {
          CategoryEditDialog: true,
          AnimePickerDialog: categoryMediaPickerStub,
          SongPickerDialog: songPickerStub,
          CharacterPickerDialog: characterPickerStub,
          DeleteIcon: true,
          DragHandleIcon: true,
          TooltipArrow: true,
          TooltipContent: true,
          TooltipPortal: true,
          TooltipRoot: true,
          TooltipTrigger: true,
        },
      },
    })

    expect(wrapper.find('.character-picker-stub').exists()).toBe(true)
    expect(wrapper.find('.song-picker-stub').exists()).toBe(false)
    expect(wrapper.find('button.emit-clear').exists()).toBe(false)
  })

  it('mounts the voice actor picker for a voice-actor category', () => {
    const wrapper = mount(CategoryCard, {
      props: {
        category: {
          ...category,
          entityKind: CategoryEntityKind.VoiceActor,
        },
        selection: null,
        globalFilter: createEmptyFilterState(),
        metadata: null,
        metadataStatus: 'idle',
        metadataError: null,
        canReorder: false,
      },
      global: {
        stubs: {
          CategoryEditDialog: true,
          AnimePickerDialog: categoryMediaPickerStub,
          SongPickerDialog: songPickerStub,
          CharacterPickerDialog: characterPickerStub,
          VoiceActorPickerDialog: voiceActorPickerStub,
          DeleteIcon: true,
          DragHandleIcon: true,
          TooltipArrow: true,
          TooltipContent: true,
          TooltipPortal: true,
          TooltipRoot: true,
          TooltipTrigger: true,
        },
      },
    })

    expect(wrapper.find('.voice-actor-picker-stub').exists()).toBe(true)
    expect(wrapper.find('.character-picker-stub').exists()).toBe(false)
    expect(wrapper.find('.song-picker-stub').exists()).toBe(false)
    expect(wrapper.find('button.emit-clear').exists()).toBe(false)
  })

  it('renders a character selection with the anime cover as an inset', () => {
    const wrapper = mount(CategoryCard, {
      props: {
        category: {
          ...category,
          entityKind: CategoryEntityKind.Character,
        },
        selection: createCharacterSelection({
          characterId: 7,
          characterName: 'Rem',
          characterImage: { large: 'https://img.example/rem-large.jpg', medium: null },
          role: CharacterRole.Main,
          animeId: 42,
          animeTitle: selection.title,
          animeCoverImage: selection.coverImage,
        }),
        globalFilter: createEmptyFilterState(),
        metadata: null,
        metadataStatus: 'idle',
        metadataError: null,
        canReorder: false,
      },
      global: {
        stubs: {
          CategoryEditDialog: true,
          AnimePickerDialog: categoryMediaPickerStub,
          SongPickerDialog: songPickerStub,
          CharacterPickerDialog: characterPickerStub,
          DeleteIcon: true,
          DragHandleIcon: true,
          TooltipArrow: true,
          TooltipContent: true,
          TooltipPortal: true,
          TooltipRoot: true,
          TooltipTrigger: true,
        },
      },
    })

    const images = wrapper.findAll('img')

    expect(images).toHaveLength(2)
    expect(images[0].attributes('src')).toBe('https://img.example/rem-large.jpg')
    expect(images[0].classes()).toContain('h-24')

    // The insets are positioned against the primary image box itself,
    // so that wrapper has to establish the positioning context.
    const imageWrapper = images[0].element.parentElement

    expect(imageWrapper).not.toBeNull()
    expect([...imageWrapper!.classList]).toEqual(
      expect.arrayContaining(['relative', 'h-24', 'w-16']),
    )
    expect(images[1].attributes('src')).toBe('https://img.example/haibane-large.jpg')
    expect(images[1].classes()).toContain('bottom-1')
    expect(wrapper.text()).toContain('Rem')
    expect(wrapper.text()).toContain('Main character in Haibane Renmei')
  })

  it('renders a voice-actor selection with the character above the anime cover', () => {
    const wrapper = mount(CategoryCard, {
      props: {
        category: {
          ...category,
          entityKind: CategoryEntityKind.VoiceActor,
        },
        selection: createVoiceActorSelection({
          voiceActorId: 11,
          voiceActorName: 'Rie Takahashi',
          voiceActorImage: { large: 'https://img.example/rie-large.jpg', medium: null },
          language: 'Japanese',
          characterId: 7,
          characterName: 'Rem',
          characterImage: { large: 'https://img.example/rem-large.jpg', medium: null },
          role: CharacterRole.Main,
          animeId: 42,
          animeTitle: selection.title,
          animeCoverImage: selection.coverImage,
        }),
        globalFilter: createEmptyFilterState(),
        metadata: null,
        metadataStatus: 'idle',
        metadataError: null,
        canReorder: false,
      },
      global: {
        stubs: {
          CategoryEditDialog: true,
          AnimePickerDialog: categoryMediaPickerStub,
          SongPickerDialog: songPickerStub,
          CharacterPickerDialog: characterPickerStub,
          VoiceActorPickerDialog: voiceActorPickerStub,
          DeleteIcon: true,
          DragHandleIcon: true,
          TooltipArrow: true,
          TooltipContent: true,
          TooltipPortal: true,
          TooltipRoot: true,
          TooltipTrigger: true,
        },
      },
    })

    const images = wrapper.findAll('img')

    expect(images).toHaveLength(3)
    expect(images[0].attributes('src')).toBe('https://img.example/rie-large.jpg')
    expect(images[0].classes()).toContain('h-24')
    // The first inset is the character and sits above the anime cover.
    expect(images[1].attributes('src')).toBe('https://img.example/rem-large.jpg')
    expect(images[1].classes()).toContain('bottom-12')
    expect(images[2].attributes('src')).toBe('https://img.example/haibane-large.jpg')
    expect(images[2].classes()).toContain('bottom-1')
    expect(wrapper.text()).toContain('Rie Takahashi')
    expect(wrapper.text()).toContain('Voiced Rem in Haibane Renmei')
    expect(wrapper.text()).toContain('Japanese')
  })

  it('tints the delete button hover state red', () => {
    const wrapper = mount(CategoryCard, {
      props: {
        category,
        selection,
        globalFilter: createEmptyFilterState(),
        metadata: null,
        metadataStatus: 'idle',
        metadataError: null,
        canReorder: false,
      },
      global: {
        stubs: {
          CategoryEditDialog: true,
          AnimePickerDialog: categoryMediaPickerStub,
          SongPickerDialog: songPickerStub,
          DeleteIcon: true,
          DragHandleIcon: true,
          TooltipArrow: true,
          TooltipContent: true,
          TooltipPortal: true,
          TooltipRoot: { template: '<div><slot /></div>' },
          TooltipTrigger: { template: '<div><slot /></div>' },
        },
      },
    })

    const deleteButton = wrapper.get('button[aria-label="Delete category Best Opening"]')

    expect(deleteButton.classes()).toContain('hover:bg-red-500/10')
    expect(deleteButton.classes()).toContain('hover:border-red-400/50')
  })
})
