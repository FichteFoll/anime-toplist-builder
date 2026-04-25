// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import { describe, expect, it, beforeEach } from 'vitest'

import CategoryCard from '@/components/categories/CategoryCard.vue'
import { createEmptyFilterState } from '@/lib/filter-state'
import { createAnimeSelection, createEmptySongFilterState, createSongSelection } from '@/lib/song-selection'
import { AnimeFormat, AnimeSeason, CategoryEntityKind, ThemeType, type AnimeSelection, type Category } from '@/types'

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

const category: Category = {
  id: 'category-1',
  name: 'Best Opening',
  description: '',
  filter: createEmptyFilterState(),
  entityKind: CategoryEntityKind.Anime,
  songFilter: createEmptySongFilterState(),
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
})
