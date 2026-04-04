<script setup lang="ts">
import { computed } from 'vue'

import FilterEditor from '@/components/filters/FilterEditor.vue'
import { getCategoryFilterDisabledReasons, isNonBlankName } from '@/lib/filter-editor'
import type { AniListMetadata, Category, FilterState } from '@/types'

const props = defineProps<{
  category: Category
  globalFilter: FilterState
  metadata: AniListMetadata | null
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
}>()

const emit = defineEmits<{
  'update:categoryName': [value: string]
  'update:categoryFilter': [value: FilterState]
}>()

const disabledFields = computed(() => getCategoryFilterDisabledReasons(props.globalFilter))

const clearCustomValidity = (event: Event) => {
  const input = event.currentTarget as HTMLInputElement
  input.setCustomValidity('')
}

const commitCategoryName = (event: Event) => {
  const input = event.currentTarget as HTMLInputElement
  const nextName = input.value.trim()

  if (!isNonBlankName(nextName)) {
    input.setCustomValidity('Category names cannot be blank.')
    input.reportValidity()
    input.value = props.category.name
    return
  }

  input.setCustomValidity('')
  input.value = nextName

  if (nextName !== props.category.name) {
    emit('update:categoryName', nextName)
  }
}
</script>

<template>
  <article class="rounded-[2rem] border border-app-border/70 bg-app-surface/90 p-5 shadow-shell backdrop-blur">
    <div class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
          Category filter
        </p>
        <h2 class="mt-2 text-xl font-semibold tracking-tight text-app-text">
          {{ category.name }}
        </h2>
      </div>

      <label class="w-full max-w-sm space-y-2">
        <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
          Category name
        </span>
        <input
          type="text"
          required
          class="shell-input"
          :value="category.name"
          @input="clearCustomValidity"
          @change="commitCategoryName"
        >
        <span class="text-xs leading-5 text-app-muted">
          Category names must stay non-blank.
        </span>
      </label>
    </div>

    <FilterEditor
      mode="category"
      :model-value="category.filter"
      :metadata="metadata"
      :metadata-status="metadataStatus"
      :metadata-error="metadataError"
      :disabled-fields="disabledFields"
      @update:model-value="emit('update:categoryFilter', $event)"
    />
  </article>
</template>
