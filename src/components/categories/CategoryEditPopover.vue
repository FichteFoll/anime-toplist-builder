<script setup lang="ts">
import {
  PopoverArrow,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui'
import { computed, ref, watch } from 'vue'

import FilterEditor from '@/components/filters/FilterEditor.vue'
import {
  countConfiguredFilterFields,
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
  save: [value: { name: string, filter: FilterState }]
}>()

const open = ref(false)
const draftName = ref(props.category.name)
const draftFilter = ref<FilterState>(cloneFilter(props.category.filter))

function cloneFilter(filter: FilterState): FilterState {
  if (typeof structuredClone === 'function') {
    return structuredClone(filter)
  }

  return JSON.parse(JSON.stringify(filter)) as FilterState
}

const disabledFields = computed(() => getCategoryFilterDisabledReasons(props.globalFilter))
const filterRuleCount = computed(() => countConfiguredFilterFields(props.category.filter))
const hasValidName = computed(() => isNonBlankName(draftName.value))

const resetDraft = () => {
  draftName.value = props.category.name
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

  if (!isNonBlankName(nextName)) {
    return
  }

  emit('save', {
    name: nextName,
    filter: cloneFilter(draftFilter.value),
  })
  open.value = false
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="shell-button"
        :aria-label="`Edit category ${props.category.name}`"
      >
        Edit
        <span class="ml-2 rounded-full bg-app-accentSoft px-2 py-1 text-xs text-app-text">
          {{ filterRuleCount }} rule{{ filterRuleCount === 1 ? '' : 's' }}
        </span>
      </button>
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        class="z-50 w-[min(92vw,72rem)] rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell"
        align="end"
        :side-offset="12"
      >
        <div class="mb-5 space-y-2">
          <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
            Category editor
          </p>
          <h2 class="text-xl font-semibold tracking-tight text-app-text">
            {{ props.category.name }}
          </h2>
          <p class="text-sm leading-6 text-app-muted">
            Update the category name and refine its filters.
          </p>
        </div>

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
          <span class="text-xs leading-5 text-app-muted">
            Category names must stay non-blank.
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

        <PopoverArrow class="fill-app-surface" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
