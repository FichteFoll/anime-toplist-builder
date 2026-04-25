<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTrigger,
} from 'reka-ui'
import { ref } from 'vue'

import DialogCloseButton from '@/components/DialogCloseButton.vue'
import AnimePickerBrowser from '@/components/categories/AnimePickerBrowser.vue'
import PickerDialogHeader from '@/components/categories/PickerDialogHeader.vue'
import { createAnimeSelection } from '@/lib/song-selection'
import type { AniListSearchResult, AnimeSelection, Category, FilterState } from '@/types'

defineProps<{
  category: Category
  globalFilter: FilterState
  selectedMediaId?: number | null
}>()

const emit = defineEmits<{
  select: [selection: AnimeSelection]
  clear: []
}>()

const open = ref(false)

const selectResult = (result: AniListSearchResult) => {
  emit('select', createAnimeSelection({
    mediaId: result.id,
    title: result.title,
    coverImage: result.coverImage,
    season: result.season ?? null,
    seasonYear: result.seasonYear ?? null,
    format: result.format ?? null,
  }))
  open.value = false
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger as-child>
      <button
        type="button"
        class="shell-button shell-button-active"
        :aria-label="selectedMediaId ? `Replace selection for ${category.name}` : `Pick selection for ${category.name}`"
      >
        {{ selectedMediaId ? 'Replace' : 'Pick' }}
      </button>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(98vw,72rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell overflow-hidden">
        <DialogCloseButton />

        <div class="border-b border-app-border/70 pb-5 pr-24">
          <PickerDialogHeader
            eyebrow="Anime picker"
            :title="category.name"
            :description="category.description"
          />
        </div>

        <AnimePickerBrowser
          class="mt-5"
          :open="open"
          :category="category"
          :global-filter="globalFilter"
          :selected-media-id="selectedMediaId"
          :show-clear-button="true"
          empty-message="No anime matched the current effective filters and search term."
          @select-result="selectResult"
          @clear="emit('clear')"
        />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
