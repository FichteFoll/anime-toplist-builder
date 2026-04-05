// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
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
          description: (props.category as Category).description,
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
    description: '',
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
          description: '',
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

  it('shows open category count in the workspace summary', () => {
    const wrapper = mountCategoryGrid()

    expect(wrapper.text()).toContain('Open categories')
    expect(wrapper.text()).toContain('1 not yet selected')
    expect(wrapper.text()).not.toContain('Filled slots')
    expect(wrapper.text()).not.toContain('Reordering')
  })

  it('configures sortable drag behavior on the category cards', () => {
    mountCategoryGrid()

    expect(sortableCreate).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        draggable: '[data-category-id]',
        handle: '.category-drag-handle',
        ghostClass: 'category-sort-ghost',
        chosenClass: 'category-sort-chosen',
        dragClass: 'category-sort-drag',
      }),
    )
  })

  it('enables fallback dragging in Firefox', async () => {
    const ua = window.navigator.userAgent

    sortableCreate.mockClear()

    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: `${ua} Firefox/125.0`,
    })
    mountCategoryGrid()
    await nextTick()

    expect(sortableCreate).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        fallbackOnBody: true,
        forceFallback: true,
      }),
    )

    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: ua,
    })
  })
})
