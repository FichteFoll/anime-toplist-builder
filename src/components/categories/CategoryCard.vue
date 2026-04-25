<script setup lang="ts">
import { computed } from 'vue'
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'

import CategoryEditDialog from '@/components/categories/CategoryEditDialog.vue'
import AnimePickerDialog from '@/components/categories/AnimePickerDialog.vue'
import SongPickerDialog from '@/components/categories/SongPickerDialog.vue'
import DeleteIcon from '@/components/icons/DeleteIcon.vue'
import DragHandleIcon from '@/components/icons/DragHandleIcon.vue'
import { resolveAnimeTitle } from '@/lib/anime-title'
import { getSelectionCoverImage, resolveSongTitle, getSongContextLabel } from '@/lib/song-selection'
import { useSettingsStore } from '@/stores/settings'
import type {
  AniListMetadata,
  Category,
  CategorySelection,
  FilterState,
} from '@/types'

const props = defineProps<{
  category: Category
  selection: CategorySelection | null
  globalFilter: FilterState
  metadata: AniListMetadata | null
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
  canReorder: boolean
}>()

const emit = defineEmits<{
  save: [value: { name: string, description: string, filter: FilterState, entityKind: Category['entityKind'], songFilter: Category['songFilter'] }]
  delete: [categoryId: string]
  selectSelection: [selection: CategorySelection]
  clearSelection: [categoryId: string]
}>()

const settingsStore = useSettingsStore()

const selectionTitle = computed(() => {
  if (!props.selection) {
    return null
  }

  return props.selection.kind === 'song'
    ? resolveSongTitle(props.selection.song, settingsStore.titleLanguage).primary
    : resolveAnimeTitle(props.selection.title, settingsStore.titleLanguage)
})
const selectionAltTitle = computed(() => {
  if (!props.selection) {
    return null
  }

  return props.selection.kind === 'song'
    ? resolveSongTitle(props.selection.song, settingsStore.titleLanguage).tooltip
    : null
})
const selectionCoverImage = computed(() =>
  props.selection ? getSelectionCoverImage(props.selection) : null,
)
const songArtistLine = computed(() =>
  props.selection?.kind === 'song' && props.selection.song.artist.trim()
    ? `by ${props.selection.song.artist.trim()}`
    : null,
)
const songContextLine = computed(() =>
  props.selection?.kind === 'song' ? getSongContextLabel(props.selection, settingsStore.titleLanguage) : null,
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
          :src="selectionCoverImage?.large"
          :alt="selectionTitle ?? 'Selected anime cover'"
          class="h-24 w-16 rounded-xl border border-app-border/70 object-cover"
        >

        <div class="min-w-0 space-y-2">
          <TooltipRoot v-if="selectionAltTitle">
            <TooltipTrigger as-child>
              <p class="break-words text-base font-semibold text-app-text decoration-dashed underline decoration-app-border underline-offset-4">
                {{ selectionTitle }}
              </p>
            </TooltipTrigger>

            <TooltipPortal>
              <TooltipContent
                class="z-50 rounded-2xl border border-app-border/80 bg-app-surface px-3 py-2 text-xs leading-5 text-app-text shadow-shell"
                :side-offset="8"
              >
                {{ selectionAltTitle }}
                <TooltipArrow class="fill-app-surface" />
              </TooltipContent>
            </TooltipPortal>
          </TooltipRoot>
          <p
            v-else
            class="break-words text-base font-semibold text-app-text"
          >
            {{ selectionTitle }}
          </p>

          <p
            v-if="selection.kind === 'anime'"
            class="text-sm text-app-muted"
          >
            {{ selection.seasonYear ?? 'Unknown year' }}
            <span v-if="selection.format"> · {{ selection.format }}</span>
          </p>
          <p
            v-else
            class="text-sm text-app-muted"
          >
            {{ songArtistLine }}
          </p>

          <p
            v-if="selection.kind === 'song'"
            class="text-xs leading-5 text-app-muted"
          >
            {{ songContextLine }}
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
      <AnimePickerDialog
        v-if="category.entityKind === 'anime'"
        :category="category"
        :global-filter="globalFilter"
        :selected-media-id="selection?.kind === 'anime' ? selection.mediaId : null"
        @select="emit('selectSelection', $event)"
        @clear="emit('clearSelection', category.id)"
      />
      <SongPickerDialog
        v-else
        :category="category"
        :global-filter="globalFilter"
        :selected-song="selection?.kind === 'song' ? selection : null"
        @select="emit('selectSelection', $event)"
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
