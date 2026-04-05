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
import {
  getCategoryFilterDisabledReasons,
  isNonBlankName,
} from '@/lib/filter-editor'
import type { AniListMetadata, Category, FilterState } from '@/types'

const props = defineProps<{
  category: Category
  globalFilter: FilterState
  metadata: AniListMetadata | null
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
}>()

const emit = defineEmits<{
  save: [value: { name: string, description: string, filter: FilterState }]
}>()

const open = ref(false)
const draftName = ref(props.category.name)
const draftDescription = ref(props.category.description)
const draftFilter = ref<FilterState>(cloneFilter(props.category.filter))

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

const disabledFields = computed(() => getCategoryFilterDisabledReasons(props.globalFilter))
const hasValidName = computed(() => isNonBlankName(draftName.value))

const resetDraft = () => {
  draftName.value = props.category.name
  draftDescription.value = props.category.description
  draftFilter.value = cloneFilter(props.category.filter)
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
  })
  open.value = false
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
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
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
      <DialogContent class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(96vw,72rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell overflow-hidden">
        <div class="shrink-0 flex items-start justify-between gap-4 border-b border-app-border/70 pb-5">
          <div class="space-y-2">
            <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
              Category editor
            </p>
            <DialogTitle class="text-xl font-semibold tracking-tight text-app-text">
              {{ props.category.name }}
            </DialogTitle>
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

          <FilterEditor
            mode="category"
            :model-value="draftFilter"
            :metadata="metadata"
            :metadata-status="metadataStatus"
            :metadata-error="metadataError"
            :disabled-fields="disabledFields"
            @update:model-value="draftFilter = $event"
          />

          <div class="mt-6 flex flex-wrap justify-end gap-2">
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
