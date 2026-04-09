<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'
import { computed, ref, watch } from 'vue'

import FilterEditor from '@/components/filters/FilterEditor.vue'
import EditIcon from '@/components/icons/EditIcon.vue'
import {
  getCategoryFilterDisabledReasons,
  isNonBlankName,
} from '@/lib/filter-editor'
import { formatThemeTypeLabel } from '@/lib/format-label'
import {
  CategoryEntityKind,
  ThemeType,
  type AniListMetadata,
  type Category,
  type FilterState,
  type SongFilterState,
} from '@/types'

const props = defineProps<{
  category: Category
  globalFilter: FilterState
  metadata: AniListMetadata | null
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
}>()

const emit = defineEmits<{
  save: [value: { name: string, description: string, filter: FilterState, entityKind: CategoryEntityKind, songFilter: SongFilterState }]
}>()

const open = ref(false)
const draftName = ref(props.category.name)
const draftDescription = ref(props.category.description)
const draftFilter = ref<FilterState>(cloneFilter(props.category.filter))
const draftEntityKind = ref<CategoryEntityKind>(props.category.entityKind)
const draftSongFilter = ref<SongFilterState>(cloneSongFilter(props.category.songFilter))

function cloneFilter(filter: FilterState): FilterState {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(filter)
    } catch {
      // Vue props can be proxies, which structuredClone rejects.
      // Fall back to JSON cloning for this plain filter state.
    }
  }

  return JSON.parse(JSON.stringify(filter)) as FilterState
}

function cloneSongFilter(songFilter: SongFilterState): SongFilterState {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(songFilter)
    } catch {
      // Same JSON-compatible fallback as the filter clone helper.
    }
  }

  return JSON.parse(JSON.stringify(songFilter)) as SongFilterState
}

const disabledFields = computed(() => getCategoryFilterDisabledReasons(props.globalFilter))
const hasValidName = computed(() => isNonBlankName(draftName.value))

const resetDraft = () => {
  draftName.value = props.category.name
  draftDescription.value = props.category.description
  draftFilter.value = cloneFilter(props.category.filter)
  draftEntityKind.value = props.category.entityKind
  draftSongFilter.value = cloneSongFilter(props.category.songFilter)
}

watch(open, (isOpen) => {
  if (isOpen) {
    resetDraft()
  }
})

watch(
  () => props.category,
  () => {
    if (!open.value) {
      resetDraft()
    }
  },
  { deep: true },
)

const save = () => {
  const nextName = draftName.value.trim()
  const nextDescription = draftDescription.value.trim()

  if (!isNonBlankName(nextName)) {
    return
  }

  emit('save', {
    name: nextName,
    description: nextDescription,
    filter: cloneFilter(draftFilter.value),
    entityKind: draftEntityKind.value,
    songFilter: cloneSongFilter(draftSongFilter.value),
  })
  open.value = false
}

const songTypeOptions = [
  { value: ThemeType.OP, label: 'Opening' },
  { value: ThemeType.IN, label: 'Insert' },
  { value: ThemeType.ED, label: 'Ending' },
] as const

const isSongTypeSelected = (value: SongFilterState['types'][number]) =>
  draftSongFilter.value.types.includes(value)

const toggleSongType = (value: SongFilterState['types'][number]) => {
  const nextTypes = isSongTypeSelected(value)
    ? draftSongFilter.value.types.filter((entry) => entry !== value)
    : [...draftSongFilter.value.types, value]

  draftSongFilter.value = {
    types: [...new Set(nextTypes)].sort(),
  }
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <TooltipRoot>
      <DialogTrigger as-child>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="shell-button inline-flex h-10 w-10 items-center justify-center p-0"
            :aria-label="`Edit category ${props.category.name}`"
          >
            <EditIcon class="h-4 w-4" />
          </button>
        </TooltipTrigger>
      </DialogTrigger>

      <TooltipPortal>
        <TooltipContent
          class="rounded-2xl border border-app-border/80 bg-app-surface px-3 py-2 text-xs leading-5 text-app-text shadow-shell"
          :side-offset="8"
        >
          Edit
          <TooltipArrow class="fill-app-surface" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(96vw,80rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell overflow-hidden">
        <div class="shrink-0 flex items-start justify-between gap-4 border-b border-app-border/70 pb-5">
          <div class="max-w-3xl space-y-2">
            <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
              Edit Category
            </p>
            <DialogTitle class="text-xl font-semibold tracking-tight text-app-text">
              {{ props.category.name }}
            </DialogTitle>
            <p class="text-sm leading-6 text-app-muted">
              Update the category name, description, and filters for this card.
            </p>
          </div>

          <DialogClose as-child>
            <button
              type="button"
              class="shell-button"
            >
              Close
            </button>
          </DialogClose>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto pr-1 pt-5">
          <label class="mb-5 block space-y-2">
            <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
              Category name
            </span>
            <input
              v-model="draftName"
              type="text"
              required
              class="shell-input"
              placeholder="Best opener"
            >
          </label>

          <label class="mb-5 block space-y-2">
            <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
              Description
            </span>
            <textarea
              v-model="draftDescription"
              rows="2"
              class="shell-input min-h-0 resize-none"
              placeholder="Short context for this category"
            />
            <span class="text-xs leading-5 text-app-muted">
              Optional. Keep it short so it fits beside the category title.
            </span>
          </label>

          <div class="my-5 border-t border-app-border/70" />

          <div class="mb-5 space-y-3">
            <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
              Category type
            </span>
            <div class="grid gap-2 sm:grid-cols-2">
              <label class="flex cursor-pointer items-start gap-3 rounded-[1rem] border border-app-border/70 bg-app-surface/70 p-3 text-sm text-app-text transition hover:border-app-accent/40">
                <input
                  v-model="draftEntityKind"
                  value="anime"
                  type="radio"
                  class="mt-1 h-4 w-4"
                >
                <div>
                  <p class="font-medium text-app-text">Anime</p>
                  <p class="mt-1 text-xs leading-5 text-app-muted">
                    Pick one anime directly from AniList results.
                  </p>
                </div>
              </label>
              <label class="flex cursor-pointer items-start gap-3 rounded-[1rem] border border-app-border/70 bg-app-surface/70 p-3 text-sm text-app-text transition hover:border-app-accent/40">
                <input
                  v-model="draftEntityKind"
                  value="song"
                  type="radio"
                  class="mt-1 h-4 w-4"
                >
                <div>
                  <p class="font-medium text-app-text">Song</p>
                  <p class="mt-1 text-xs leading-5 text-app-muted">
                    Pick an anime first, then choose a song tied to it.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div
            v-if="draftEntityKind === CategoryEntityKind.Song"
            class="mb-5 rounded-[1.5rem] border border-app-border/70 bg-app-bg/50 p-4"
          >
            <p class="text-sm font-medium text-app-text">
              Song type
            </p>
            <p class="mt-1 text-xs leading-5 text-app-muted">
              Choose which theme types this category can include.
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-for="type in songTypeOptions"
                :key="type.value"
                type="button"
                class="shell-button"
                :class="isSongTypeSelected(type.value) ? 'border-app-accent/70 bg-app-accentSoft/70 text-app-text' : ''"
                :aria-pressed="isSongTypeSelected(type.value)"
                :aria-label="`${isSongTypeSelected(type.value) ? 'Remove' : 'Add'} ${type.label}`"
                @click="toggleSongType(type.value)"
              >
                {{ formatThemeTypeLabel(type.value) }}
              </button>
            </div>
          </div>

          <FilterEditor
            mode="category"
            :model-value="draftFilter"
            :metadata="metadata"
            :metadata-status="metadataStatus"
            :metadata-error="metadataError"
            :disabled-fields="disabledFields"
            @update:model-value="draftFilter = $event"
          />
        </div>

        <div class="shrink-0 border-t border-app-border/70 bg-app-surface/95 pt-4">
          <div class="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="shell-button"
              @click="resetDraft"
            >
              Reset draft
            </button>
            <button
              type="button"
              class="shell-button shell-button-active"
              :disabled="!hasValidName"
              @click="save"
            >
              Save category
            </button>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
