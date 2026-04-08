<script setup lang="ts">
import type { FilterSortDirection, FilterSortField } from '@/types'

defineProps<{
  categoryName: string
  searchDraft: string
  localSortField: FilterSortField | ''
  localSortDirection: FilterSortDirection
  sortFieldOptions: Array<{ value: FilterSortField, label: string }>
  sortFieldPlaceholderLabel: string
}>()

const emit = defineEmits<{
  'update:searchDraft': [value: string]
  'update:localSortField': [value: FilterSortField | '']
  'update:localSortDirection': [value: FilterSortDirection]
}>()
</script>

<template>
  <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_auto] lg:items-end">
    <label class="space-y-2">
      <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
        Search title
      </span>
      <input
        :model-value="searchDraft"
        type="search"
        inputmode="search"
        class="shell-input"
        placeholder="Type to search ..."
        :aria-label="`Search anime for ${categoryName}`"
        @input="emit('update:searchDraft', ($event.target as HTMLInputElement).value)"
      >
    </label>

    <label class="space-y-2">
      <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
        Sort
      </span>
      <select
        :value="localSortField"
        class="shell-input"
        :aria-label="`Sort search results for ${categoryName}`"
        @change="emit('update:localSortField', ($event.target as HTMLSelectElement).value as FilterSortField | '')"
      >
        <option value="">
          {{ sortFieldPlaceholderLabel }}
        </option>
        <option
          v-for="option in sortFieldOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </label>

    <div class="flex gap-2 lg:justify-end">
      <button
        type="button"
        class="shell-button"
        :class="localSortDirection === 'asc' ? 'shell-button-active' : ''"
        :disabled="!localSortField"
        aria-label="Use ascending sort order"
        @click="emit('update:localSortDirection', 'asc')"
      >
        Asc
      </button>
      <button
        type="button"
        class="shell-button"
        :class="localSortDirection === 'desc' ? 'shell-button-active' : ''"
        :disabled="!localSortField"
        aria-label="Use descending sort order"
        @click="emit('update:localSortDirection', 'desc')"
      >
        Desc
      </button>
    </div>
  </div>
</template>
