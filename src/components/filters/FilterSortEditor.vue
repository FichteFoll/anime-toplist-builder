<script setup lang="ts">
import { computed } from 'vue'

import FilterField from '@/components/filters/FilterField.vue'
import {
  filterSortDirections,
  filterSortFields,
  type FilterSort,
  type FilterSortDirection,
  type FilterSortField,
} from '@/types'

const props = defineProps<{
  label: string
  description?: string
  modelValue?: FilterSort
  inheritLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterSort | undefined]
}>()

const sortFieldOptions = computed(() =>
  filterSortFields.map((field) => ({
    value: field,
    label: field.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
  })),
)

const setField = (field: FilterSortField | '') => {
  if (!field) {
    emit('update:modelValue', undefined)
    return
  }

  emit('update:modelValue', {
    field,
    direction: props.modelValue?.direction ?? 'desc',
  })
}

const setDirection = (direction: FilterSortDirection) => {
  if (!props.modelValue) {
    return
  }

  emit('update:modelValue', {
    ...props.modelValue,
    direction,
  })
}
</script>

<template>
  <FilterField
    :label="label"
    :description="description"
  >
    <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <label class="space-y-2">
        <span class="sr-only">Sort field</span>
        <select
          class="shell-input"
          :value="modelValue?.field ?? ''"
          @change="setField(($event.target as HTMLSelectElement).value as FilterSortField | '')"
        >
          <option value="">
            {{ inheritLabel ?? 'No explicit sort' }}
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

      <div class="flex flex-wrap gap-2">
        <button
          v-for="direction in filterSortDirections"
          :key="direction"
          type="button"
          class="shell-button"
          :class="modelValue?.direction === direction ? 'shell-button-active' : ''"
          :disabled="!modelValue"
          :aria-pressed="modelValue?.direction === direction"
          :aria-label="direction === 'asc' ? 'Use ascending sort order' : 'Use descending sort order'"
          @click="setDirection(direction)"
        >
          {{ direction === 'asc' ? 'Ascending' : 'Descending' }}
        </button>
      </div>
    </div>
  </FilterField>
</template>
