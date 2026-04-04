<script setup lang="ts">
import {
  PopoverArrow,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui'
import Sortable from 'sortablejs'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import CategoryCard from '@/components/categories/CategoryCard.vue'
import { isNonBlankName } from '@/lib/filter-editor'
import type {
  AniListMetadata,
  AnimeSelection,
  AnimeTitleLanguage,
  Category,
  FilterState,
} from '@/types'

const props = defineProps<{
  categories: Category[]
  selectionByCategory: Record<string, AnimeSelection | null>
  globalFilter: FilterState
  metadata: AniListMetadata | null
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
  titleLanguage: AnimeTitleLanguage
}>()

const emit = defineEmits<{
  addCategory: [name: string]
  updateCategory: [categoryId: string, value: { name: string, filter: FilterState }]
  deleteCategory: [categoryId: string]
  reorderCategories: [value: { fromIndex: number, toIndex: number }]
  selectAnime: [categoryId: string, selection: AnimeSelection]
  clearSelection: [categoryId: string]
}>()

const gridRef = ref<HTMLElement | null>(null)
const isAddOpen = ref(false)
const newCategoryName = ref('')

let sortable: Sortable | null = null

const canReorder = computed(() => props.categories.length > 1)
const selectedCategoryCount = computed(
  () => props.categories.filter((category) => props.selectionByCategory[category.id]).length,
)

const resetAddDraft = () => {
  newCategoryName.value = `Category ${props.categories.length + 1}`
}

const forwardCategoryUpdate = (categoryId: string, value: { name: string, filter: FilterState }) => {
  emit('updateCategory', categoryId, value)
}

const forwardAnimeSelection = (categoryId: string, selection: AnimeSelection) => {
  emit('selectAnime', categoryId, selection)
}

const createCategory = () => {
  const nextName = newCategoryName.value.trim()

  if (!isNonBlankName(nextName)) {
    return
  }

  emit('addCategory', nextName)
  isAddOpen.value = false
}

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

watch(isAddOpen, (isOpen) => {
  if (isOpen) {
    resetAddDraft()
  }
})

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
      <div>
        <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
          Category workspace
        </p>
        <h2 class="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Build the toplist layout
        </h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
          Edit category names and filters from each card,
          drag by the handle to reorder,
          and keep the mobile layout in a single column.
        </p>
      </div>

      <PopoverRoot v-model:open="isAddOpen">
        <PopoverTrigger as-child>
          <button
            type="button"
            class="shell-button shell-button-active self-start"
            aria-label="Add category"
          >
            Add category
          </button>
        </PopoverTrigger>

        <PopoverPortal>
          <PopoverContent
            class="z-50 w-[min(92vw,28rem)] rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell"
            align="end"
            :side-offset="12"
          >
            <div class="space-y-2">
              <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
                New category
              </p>
              <h3 class="text-xl font-semibold tracking-tight text-app-text">
                Add a category card
              </h3>
              <p class="text-sm leading-6 text-app-muted">
                Start with a name here,
                then refine its category-specific filters from the card editor.
              </p>
            </div>

            <label class="mt-5 block space-y-2">
              <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
                Category name
              </span>
              <input
                v-model="newCategoryName"
                type="text"
                required
                class="shell-input"
                placeholder="Best finale"
              >
            </label>

            <div class="mt-5 flex justify-end gap-2">
              <button
                type="button"
                class="shell-button"
                @click="resetAddDraft"
              >
                Reset
              </button>
              <button
                type="button"
                class="shell-button shell-button-active"
                :disabled="!isNonBlankName(newCategoryName)"
                @click="createCategory"
              >
                Create category
              </button>
            </div>

            <PopoverArrow class="fill-app-surface" />
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
    </div>

    <div class="mt-5 grid gap-4 rounded-[1.5rem] bg-app-bg/60 p-4 md:grid-cols-3">
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
          Filled slots
        </dt>
        <dd class="mt-2 text-sm text-app-text">
          {{ selectedCategoryCount }}
        </dd>
      </div>
      <div>
        <dt class="text-xs font-medium uppercase tracking-[0.25em] text-app-muted">
          Reordering
        </dt>
        <dd class="mt-2 text-sm text-app-text">
          {{ canReorder ? 'Enabled' : 'Add another category first' }}
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

        <div class="rounded-[1.5rem] border border-app-border/70 bg-app-surface/70 p-4">
          <div class="grid grid-cols-[4.5rem_1fr] gap-4">
            <div class="h-28 rounded-2xl bg-app-elevated/70" />
            <div class="space-y-3 pt-1">
              <div class="h-4 w-2/3 rounded-full bg-app-elevated/70" />
              <div class="h-4 w-1/2 rounded-full bg-app-elevated/50" />
              <div class="h-16 rounded-2xl border border-dashed border-app-border/70 bg-app-bg/50" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      ref="gridRef"
      class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
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
        :title-language="titleLanguage"
        @save="forwardCategoryUpdate(category.id, $event)"
        @delete="emit('deleteCategory', $event)"
        @select-anime="forwardAnimeSelection(category.id, $event)"
        @clear-selection="emit('clearSelection', $event)"
      />
    </div>
  </section>
</template>
