<script setup lang="ts">
import { FilterSortDirection, type FilterSortField } from '@/types'

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
  <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
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

    <fieldset class="min-w-0 space-y-2 border-0 p-0 m-0">
      <legend class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
        Sort
      </legend>
      <div class="flex min-w-0 gap-2">
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

        <button
          type="button"
          class="shrink-0 shell-button"
          :class="localSortDirection === FilterSortDirection.Asc ? 'shell-button-active' : ''"
          :disabled="!localSortField"
          aria-label="Use ascending sort order"
          @click="localSortDirection = FilterSortDirection.Asc"
        >
          Asc
        </button>
        <button
          type="button"
          class="shrink-0 shell-button"
          :class="localSortDirection === FilterSortDirection.Desc ? 'shell-button-active' : ''"
          :disabled="!localSortField"
          aria-label="Use descending sort order"
          @click="localSortDirection = FilterSortDirection.Desc"
        >
          Desc
        </button>
      </div>
    </fieldset>
  </div>
</template>
