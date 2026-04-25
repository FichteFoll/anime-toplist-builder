<script setup lang="ts">
import { computed } from 'vue'

import FilterField from '@/components/filters/FilterField.vue'
import {
  FilterSortDirection,
  filterSortDirections,
  filterSortFields,
  type FilterSort,
  type FilterSortField,
} from '@/types'

defineProps<{
  label: string
  description?: string
  inheritLabel?: string
}>()

const model = defineModel<FilterSort | undefined>()

const sortFieldOptions = computed(() =>
  filterSortFields.map((field) => ({
    value: field,
    label: field.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
  })),
)

const setField = (field: FilterSortField | '') => {
  if (!field) {
    model.value = undefined
    return
  }

  model.value = {
    field,
    direction: model.value?.direction ?? FilterSortDirection.Desc,
  }
}

const setDirection = (direction: FilterSortDirection) => {
  if (!model.value) {
    return
  }

  model.value = {
    ...model.value,
    direction,
  }
}
</script>

<template>
  <FilterField
    :label="label"
    :description="description"
  >
    <div class="flex flex-nowrap justify-content-center items-end gap-2">
      <label class="min-w-0 flex-1 space-y-2">
        <span class="sr-only">Sort field</span>
        <select
          class="shell-input w-full min-w-0"
          :value="model?.field ?? ''"
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

      <button
        v-for="direction in filterSortDirections"
        :key="direction"
        type="button"
        class="shrink-0 shell-button"
        :class="model?.direction === direction ? 'shell-button-active' : ''"
        :disabled="!model"
        :aria-pressed="model?.direction === direction"
        :aria-label="direction === FilterSortDirection.Asc ? 'Use ascending sort order' : 'Use descending sort order'"
        @click="setDirection(direction)"
      >
        {{ direction === FilterSortDirection.Asc ? 'Asc' : 'Desc' }}
      </button>
    </div>
  </FilterField>
</template>
