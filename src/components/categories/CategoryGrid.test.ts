// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import CategoryGrid from '@/components/categories/CategoryGrid.vue'
import { createEmptyFilterState } from '@/lib/filter-state'
import type { AnimeSelection, Category } from '@/types'

const { sortableCreate, sortableDestroy } = vi.hoisted(() => ({
  sortableDestroy: vi.fn(),
  sortableCreate: vi.fn(() => ({
    destroy: sortableDestroy,
  })),
}))

vi.mock('sortablejs', () => ({
  default: {
    create: sortableCreate,
  },
}))

vi.mock('reka-ui', () => ({
  PopoverArrow: {
    template: '<div><slot /></div>',
  },
  PopoverContent: {
    template: '<div><slot /></div>',
  },
  PopoverPortal: {
    template: '<div><slot /></div>',
  },
  PopoverRoot: {
    template: '<div><slot /></div>',
  },
  PopoverTrigger: {
    template: '<div><slot /></div>',
  },
}))

const categoryCardStub = defineComponent({
  name: 'CategoryCard',
  props: {
    category: {
      type: Object,
      required: true,
    },
  },
  emits: ['save', 'delete', 'selectAnime', 'clearSelection'],
  setup(props, { emit }) {
    const selection: AnimeSelection = {
      mediaId: 77,
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

    return {
      emitSave: () =>
        emit('save', {
          name: `${(props.category as Category).name} Updated`,
          filter: createEmptyFilterState(),
        }),
      emitDelete: () => emit('delete', (props.category as Category).id),
      emitSelect: () => emit('selectAnime', selection),
      emitClear: () => emit('clearSelection', (props.category as Category).id),
    }
  },
  template: `
    <div class="category-card-stub">
      <button type="button" class="emit-save" @click="emitSave">save</button>
      <button type="button" class="emit-delete" @click="emitDelete">delete</button>
      <button type="button" class="emit-select" @click="emitSelect">select</button>
      <button type="button" class="emit-clear" @click="emitClear">clear</button>
    </div>
  `,
})

const categories: Category[] = [
  {
    id: 'cat_gridopening01',
    name: 'Best Opening',
    filter: createEmptyFilterState(),
  },
]

const mountCategoryGrid = () =>
  mount(CategoryGrid, {
    props: {
      categories,
      selectionByCategory: {},
      globalFilter: createEmptyFilterState(),
      metadata: null,
      metadataStatus: 'idle',
      metadataError: null,
      titleLanguage: 'userPreferred',
    },
    global: {
      stubs: {
        CategoryCard: categoryCardStub,
      },
    },
  })

describe('CategoryGrid', () => {
  it('emits addCategory from the add-category flow', async () => {
    const wrapper = mountCategoryGrid()

    await wrapper.get('button[aria-label="Add category"]').trigger('click')
    await wrapper.get('input.shell-input').setValue('Best Ending')
    await wrapper.findAll('button.shell-button.shell-button-active')[1]!.trigger('click')

    expect(wrapper.emitted('addCategory')).toEqual([[ 'Best Ending' ]])
    expect(sortableCreate).toHaveBeenCalled()
  })

  it('forwards critical child-card actions', async () => {
    const wrapper = mountCategoryGrid()

    await wrapper.get('button.emit-save').trigger('click')
    await wrapper.get('button.emit-delete').trigger('click')
    await wrapper.get('button.emit-select').trigger('click')
    await wrapper.get('button.emit-clear').trigger('click')

    expect(wrapper.emitted('updateCategory')).toEqual([
      [
        'cat_gridopening01',
        {
          name: 'Best Opening Updated',
          filter: createEmptyFilterState(),
        },
      ],
    ])
    expect(wrapper.emitted('deleteCategory')).toEqual([[ 'cat_gridopening01' ]])
    expect(wrapper.emitted('selectAnime')?.[0]).toEqual([
      'cat_gridopening01',
      expect.objectContaining({
        mediaId: 77,
        seasonYear: 2002,
      }),
    ])
    expect(wrapper.emitted('clearSelection')).toEqual([[ 'cat_gridopening01' ]])
  })
})
