<script setup lang="ts">
import type { FilterSortDirection, FilterSortField } from '@/types'

defineProps<{
  categoryName: string
  sortFieldOptions: Array<{ value: FilterSortField, label: string }>
  sortFieldPlaceholderLabel: string
}>()

const searchDraft = defineModel<string>('searchDraft', { required: true })
const localSortField = defineModel<FilterSortField | ''>('localSortField', { required: true })
const localSortDirection = defineModel<FilterSortDirection>('localSortDirection', { required: true })
</script>

<template>
  <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_auto] lg:items-end">
    <label class="space-y-2">
      <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
        Search title
      </span>
      <input
        v-model="searchDraft"
        type="search"
        inputmode="search"
        class="shell-input"
        placeholder="Type to search ..."
        :aria-label="`Search anime for ${categoryName}`"
      >
    </label>

    <label class="space-y-2">
      <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
        Sort
      </span>
      <select
        v-model="localSortField"
        class="shell-input"
        :aria-label="`Sort search results for ${categoryName}`"
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
        @click="localSortDirection = 'asc'"
      >
        Asc
      </button>
      <button
        type="button"
        class="shell-button"
        :class="localSortDirection === 'desc' ? 'shell-button-active' : ''"
        :disabled="!localSortField"
        aria-label="Use descending sort order"
        @click="localSortDirection = 'desc'"
      >
        Desc
      </button>
    </div>
  </div>
</template>
