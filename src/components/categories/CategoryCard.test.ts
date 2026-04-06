// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'

import CategoryCard from '@/components/categories/CategoryCard.vue'
import { createEmptyFilterState } from '@/lib/filter-state'
import type { AnimeSelection, Category } from '@/types'

const categoryMediaPickerStub = defineComponent({
  name: 'CategoryMediaPickerDialog',
  emits: ['clear', 'select'],
  template: `
    <div>
      <button type="button" class="emit-clear" @click="$emit('clear')">clear</button>
    </div>
  `,
})

const category: Category = {
  id: 'category-1',
  name: 'Best Opening',
  description: '',
  filter: createEmptyFilterState(),
}

const selection: AnimeSelection = {
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
  season: 'FALL',
  seasonYear: 2002,
  format: 'TV',
}

describe('CategoryCard', () => {
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
        titleLanguage: 'english',
      },
      global: {
        stubs: {
          CategoryEditDialog: true,
          CategoryMediaPickerDialog: categoryMediaPickerStub,
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
})
