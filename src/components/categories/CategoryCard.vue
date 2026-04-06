<script setup lang="ts">
import { computed } from 'vue'
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'

import CategoryEditDialog from '@/components/categories/CategoryEditDialog.vue'
import CategoryMediaPickerDialog from '@/components/categories/CategoryMediaPickerDialog.vue'
import DeleteIcon from '@/components/icons/DeleteIcon.vue'
import DragHandleIcon from '@/components/icons/DragHandleIcon.vue'
import { resolveAnimeTitle } from '@/lib/anime-title'
import type {
  AniListMetadata,
  AnimeSelection,
  AnimeTitleLanguage,
  Category,
  FilterState,
} from '@/types'

const props = defineProps<{
  category: Category
  selection: AnimeSelection | null
  globalFilter: FilterState
  metadata: AniListMetadata | null
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
  canReorder: boolean
  titleLanguage: AnimeTitleLanguage
}>()

const emit = defineEmits<{
  save: [value: { name: string, description: string, filter: FilterState }]
  delete: [categoryId: string]
  selectAnime: [selection: AnimeSelection]
  clearSelection: [categoryId: string]
}>()

const selectionTitle = computed(() =>
  props.selection ? resolveAnimeTitle(props.selection.title, props.titleLanguage) : null,
)
const deleteCategoryTooltip = computed(() => `Delete category ${props.category.name}`)
</script>

<template>
  <article
    class="group flex flex-col rounded-[2rem] border bg-app-surface/90 p-5 shadow-shell backdrop-blur transition hover:border-app-accent/60"
    :class="selection ? 'border-app-accent/70' : 'border-app-border/70'"
    :data-category-id="category.id"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
          Category
        </p>
        <h3 class="mt-2 break-words text-xl font-semibold tracking-tight text-app-text">
          {{ category.name }}
        </h3>
        <p
          v-if="category.description"
          class="mt-2 max-w-2xl break-words text-sm leading-6 text-app-muted line-clamp-3"
        >
          {{ category.description }}
        </p>
      </div>

      <button
        type="button"
        class="category-drag-handle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-app-border/80 bg-app-bg/70 text-app-muted transition hover:border-app-accent/50 hover:text-app-text disabled:cursor-default disabled:opacity-50"
        :disabled="!canReorder"
        :aria-label="canReorder ? 'Drag to reorder categories' : 'Category drag handle'"
      >
        <DragHandleIcon class="h-4 w-4" />
      </button>
    </div>

    <div class="mt-5 flex-1 rounded-[1.5rem] border border-dashed border-app-border/70 bg-app-bg/50 p-4">
      <div
        v-if="selection"
        class="flex gap-4"
      >
        <img
          :src="selection.coverImage.large"
          :alt="selectionTitle ?? 'Selected anime cover'"
          class="h-24 w-16 rounded-xl border border-app-border/70 object-cover"
        >
        <div class="min-w-0 space-y-2">
          <p class="break-words text-base font-semibold text-app-text">
            {{ selectionTitle }}
          </p>
          <p class="text-sm text-app-muted">
            {{ selection.seasonYear ?? 'Unknown year' }}
            <span v-if="selection.format"> · {{ selection.format }}</span>
          </p>
        </div>
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <div class="grid grid-cols-[4rem_1fr] gap-4">
          <div class="h-24 rounded-xl bg-app-elevated/70" />
          <div class="space-y-3 pt-1">
            <div class="h-4 w-3/4 rounded-full bg-app-elevated/70" />
            <div class="h-4 w-1/2 rounded-full bg-app-elevated/50" />
            <div class="h-4 w-5/6 rounded-full bg-app-elevated/50" />
          </div>
        </div>
      </div>
    </div>

    <div class="mt-5 flex flex-wrap gap-2">
      <CategoryMediaPickerDialog
        :category="category"
        :global-filter="globalFilter"
        :selected-media-id="selection?.mediaId ?? null"
        :title-language="titleLanguage"
        @select="emit('selectAnime', $event)"
        @clear="emit('clearSelection', category.id)"
      />
      <button
        type="button"
        class="shell-button"
        :disabled="!selection"
        :aria-label="`Clear selection for ${category.name}`"
        @click="emit('clearSelection', category.id)"
      >
        Clear
      </button>
      <CategoryEditDialog
        :category="category"
        :global-filter="globalFilter"
        :metadata="metadata"
        :metadata-status="metadataStatus"
        :metadata-error="metadataError"
        @save="emit('save', $event)"
      />
      <TooltipRoot>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="shell-button inline-flex h-10 w-10 items-center justify-center p-0"
            :aria-label="deleteCategoryTooltip"
            @click="emit('delete', category.id)"
          >
            <DeleteIcon class="h-4 w-4" />
          </button>
        </TooltipTrigger>

        <TooltipPortal>
          <TooltipContent
            class="rounded-2xl border border-app-border/80 bg-app-surface px-3 py-2 text-xs leading-5 text-app-text shadow-shell"
            :side-offset="8"
          >
            Delete category
            <TooltipArrow class="fill-app-surface" />
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </div>
  </article>
</template>
