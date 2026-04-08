<script setup lang="ts">
import Sortable from 'sortablejs'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import CategoryCard from '@/components/categories/CategoryCard.vue'
import type {
  AniListMetadata,
  AnimeTitleLanguage,
  Category,
  CategorySelection,
  FilterState,
} from '@/types'

const props = defineProps<{
  categories: Category[]
  selectionByCategory: Record<string, CategorySelection | null>
  globalFilter: FilterState
  metadata: AniListMetadata | null
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
  titleLanguage: AnimeTitleLanguage
}>()

const emit = defineEmits<{
  addCategory: [name: string]
  updateCategory: [
    categoryId: string,
    value: {
      name: string
      description: string
      filter: FilterState
      entityKind: Category['entityKind']
      songFilter: Category['songFilter']
    },
  ]
  deleteCategory: [categoryId: string]
  reorderCategories: [value: { fromIndex: number, toIndex: number }]
  selectSelection: [categoryId: string, selection: CategorySelection]
  clearSelection: [categoryId: string]
  clearAllSelections: []
}>()

const gridRef = ref<HTMLElement | null>(null)

let sortable: Sortable | null = null

const canReorder = computed(() => props.categories.length > 1)

const selectedCategoryCount = computed(
  () => props.categories.filter((category) => props.selectionByCategory[category.id]).length,
)
const openCategoryCount = computed(() => props.categories.length - selectedCategoryCount.value)

const forwardCategoryUpdate = (
  categoryId: string,
  value: {
    name: string
    description: string
    filter: FilterState
    entityKind: Category['entityKind']
    songFilter: Category['songFilter']
  },
) => {
  emit('updateCategory', categoryId, value)
}

const forwardAnimeSelection = (categoryId: string, selection: CategorySelection) => {
  emit('selectSelection', categoryId, selection)
}

const addCategory = () => {
  emit('addCategory', `Category ${props.categories.length + 1}`)
}

const shouldUseFallbackDrag = () =>
  typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent)

const mountSortable = async () => {
  await nextTick()

  sortable?.destroy()
  sortable = null

  if (!gridRef.value) {
    return
  }

  sortable = Sortable.create(gridRef.value, {
    animation: 180,
    delay: 180,
    delayOnTouchOnly: true,
    draggable: '[data-category-id]',
    fallbackOnBody: shouldUseFallbackDrag(),
    forceFallback: shouldUseFallbackDrag(),
    ghostClass: 'category-sort-ghost',
    chosenClass: 'category-sort-chosen',
    dragClass: 'category-sort-drag',
    handle: '.category-drag-handle',
    touchStartThreshold: 4,
    onEnd: ({ oldIndex, newIndex }) => {
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
        return
      }

      emit('reorderCategories', {
        fromIndex: oldIndex,
        toIndex: newIndex,
      })
    },
  })
}

watch(
  () => props.categories.map((category) => category.id),
  () => {
    void mountSortable()
  },
)

onMounted(() => {
  void mountSortable()
})

onBeforeUnmount(() => {
  sortable?.destroy()
})
</script>

<template>
  <section class="rounded-[2rem] border border-app-border/70 bg-app-surface/90 p-6 shadow-shell backdrop-blur sm:p-7">
    <div class="flex flex-col gap-5 border-b border-app-border/70 pb-5 md:flex-row md:items-start md:justify-between">
      <div class="max-w-4xl">
        <h2 class="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Categories
        </h2>
        <p class="mt-3 max-w-none text-sm leading-6 text-app-muted">
          Edit category names and filters for each card,
          drag by the handle to reorder,
          and make your selections.
        </p>
      </div>

      <button
        type="button"
        class="shell-button"
        :disabled="selectedCategoryCount === 0"
        @click="emit('clearAllSelections')"
      >
        Clear all selections
      </button>
    </div>

    <div class="mt-5 grid gap-4 rounded-[1.5rem] bg-app-bg/60 p-4 md:grid-cols-2">
      <div>
        <dt class="text-xs font-medium uppercase tracking-[0.25em] text-app-muted">
          Categories
        </dt>
        <dd class="mt-2 text-sm text-app-text">
          {{ categories.length }}
        </dd>
      </div>
      <div>
        <dt class="text-xs font-medium uppercase tracking-[0.25em] text-app-muted">
          Open categories
        </dt>
        <dd class="mt-2 text-sm text-app-text">
          {{ openCategoryCount }} not yet selected
        </dd>
      </div>
    </div>

    <div
      v-if="categories.length === 0"
      class="mt-6 rounded-[1.75rem] border border-dashed border-app-border/70 bg-app-bg/40 p-6"
    >
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
        <div>
          <p class="text-lg font-semibold tracking-tight text-app-text">
            No categories yet.
          </p>
          <p class="mt-3 max-w-xl text-sm leading-6 text-app-muted">
            Add the first card to define the toplist structure.
            You can reorder and edit cards after that.
          </p>
        </div>

        <button
          type="button"
          class="group flex min-h-48 items-center justify-center rounded-[1.5rem] border border-dashed border-app-border/70 bg-app-surface/70 p-4 text-app-muted transition hover:border-app-accent/50 hover:text-app-text"
          aria-label="Add category"
          @click="addCategory"
        >
          <span class="inline-flex h-14 w-14 items-center justify-center rounded-full border border-current text-3xl font-light leading-none">
            +
          </span>
        </button>
      </div>
    </div>

    <div
      v-else
      ref="gridRef"
      class="mt-6 flex flex-wrap items-start gap-4"
    >
      <CategoryCard
        v-for="category in categories"
        :key="category.id"
        :category="category"
        :selection="selectionByCategory[category.id] ?? null"
        :global-filter="globalFilter"
        :metadata="metadata"
        :metadata-status="metadataStatus"
        :metadata-error="metadataError"
        :can-reorder="canReorder"
        class="w-full md:w-[calc(50%-0.5rem)] xl:w-[calc(33.333%-0.889rem)]"
        :title-language="titleLanguage"
        @save="forwardCategoryUpdate(category.id, $event)"
        @delete="emit('deleteCategory', $event)"
        @select-selection="forwardAnimeSelection(category.id, $event)"
        @clear-selection="emit('clearSelection', $event)"
      />

      <button
        type="button"
        class="group flex min-h-80 w-full flex-col items-center justify-center rounded-[2rem] border border-dashed border-app-border/70 bg-app-surface/70 p-5 text-app-muted transition hover:border-app-accent/50 hover:text-app-text md:w-[calc(50%-0.5rem)] xl:w-[calc(33.333%-0.889rem)]"
        aria-label="Add category"
        @click="addCategory"
      >
        <span class="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-current text-4xl font-light leading-none">
          +
        </span>
        <span class="mt-4 text-sm font-medium uppercase tracking-[0.25em]">
          Add category
        </span>
      </button>
    </div>
  </section>
</template>
