<script setup lang="ts">
import { computed } from 'vue'

import FilterField from '@/components/filters/FilterField.vue'

export interface FilterOption {
  value: string
  label: string
}

const props = defineProps<{
  label: string
  description?: string
  options: FilterOption[]
  emptyMessage?: string
  disabledReason?: string
}>()

const model = defineModel<string[]>({ required: true })

const normalizedOptions = computed(() => {
  const optionMap = new Map(props.options.map((option) => [option.value, option]))

  for (const selectedValue of model.value) {
    if (!optionMap.has(selectedValue)) {
      optionMap.set(selectedValue, {
        value: selectedValue,
        label: selectedValue,
      })
    }
  }

  return [...optionMap.values()].sort((left, right) => left.label.localeCompare(right.label))
})

const isSelected = (value: string) => model.value.includes(value)

const toggleValue = (value: string) => {
  const nextValues = isSelected(value) ? model.value.filter((entry) => entry !== value) : [...model.value, value]

  model.value = [...new Set(nextValues)].sort((left, right) => left.localeCompare(right))
}
</script>

<template>
  <FilterField
    :label="label"
    :description="description"
    :disabled-reason="disabledReason"
  >
    <div
      v-if="normalizedOptions.length > 0"
      class="flex flex-wrap gap-2"
    >
      <button
        v-for="option in normalizedOptions"
        :key="option.value"
        type="button"
        class="shell-button"
        :class="isSelected(option.value) ? 'shell-button-active' : ''"
        :disabled="Boolean(disabledReason)"
        :aria-pressed="isSelected(option.value)"
        :aria-label="`${isSelected(option.value) ? 'Remove' : 'Add'} ${option.label}`"
        @click="toggleValue(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <p
      v-else
      class="text-sm text-app-muted"
    >
      {{ emptyMessage ?? 'No suggestions are available yet.' }}
    </p>
  </FilterField>
</template>
