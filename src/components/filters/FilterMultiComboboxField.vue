<script setup lang="ts">
import { computed } from 'vue'
import {
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxViewport,
} from 'reka-ui'

import FilterField from '@/components/filters/FilterField.vue'

export interface FilterOption {
  value: string
  label: string
}

const props = defineProps<{
  label: string
  description?: string
  modelValue: string[]
  options: FilterOption[]
  emptyMessage?: string
  placeholder?: string
  disabledReason?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const normalizeValues = (values: string[]) =>
  [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))].sort((left, right) =>
    left.localeCompare(right),
  )

const normalizedOptions = computed(() => {
  const optionMap = new Map(props.options.map((option) => [option.value, option]))

  for (const selectedValue of props.modelValue) {
    if (!optionMap.has(selectedValue)) {
      optionMap.set(selectedValue, {
        value: selectedValue,
        label: selectedValue,
      })
    }
  }

  return [...optionMap.values()].sort((left, right) => left.label.localeCompare(right.label))
})

const selectedOptions = computed(() => {
  const optionMap = new Map(normalizedOptions.value.map((option) => [option.value, option]))

  return normalizeValues(props.modelValue)
    .map((value) => optionMap.get(value))
    .filter((option): option is FilterOption => option !== undefined)
})

const emitValues = (values: string[] | undefined) => {
  emit('update:modelValue', normalizeValues(values ?? []))
}

const removeValue = (value: string) => {
  emitValues(props.modelValue.filter((entry) => entry !== value))
}
</script>

<template>
  <FilterField
    :label="label"
    :description="description"
    :disabled-reason="disabledReason"
  >
    <ComboboxRoot
      :multiple="true"
      :model-value="normalizeValues(modelValue)"
      :disabled="Boolean(disabledReason)"
      open-on-focus
      :ignore-filter="false"
      @update:model-value="(value) => emitValues(value as unknown as string[])"
    >
      <div class="space-y-3">
        <div
          v-if="selectedOptions.length > 0"
          class="flex flex-wrap gap-2"
        >
          <span
            v-for="option in selectedOptions"
            :key="option.value"
            class="inline-flex items-center gap-2 rounded-full bg-app-accentSoft px-3 py-1.5 text-sm text-app-text"
          >
            {{ option.label }}
            <button
              type="button"
              class="text-xs text-app-muted"
              :disabled="Boolean(disabledReason)"
              :aria-label="`Remove ${option.label}`"
              @click="removeValue(option.value)"
            >
              ×
            </button>
          </span>
        </div>

        <ComboboxInput
          class="shell-input"
          :placeholder="placeholder ?? 'Search options'"
        />

        <ComboboxPortal>
          <ComboboxContent class="z-50 mt-2 rounded-[1.25rem] border border-app-border/80 bg-app-surface p-2 shadow-shell">
            <ComboboxViewport class="max-h-64 overflow-y-auto">
              <ComboboxItem
                v-for="option in normalizedOptions"
                :key="option.value"
                :value="option.value"
                :text-value="option.label"
                class="flex cursor-pointer items-center rounded-xl px-3 py-2 text-sm text-app-text outline-none data-[highlighted]:bg-app-accentSoft"
              >
                {{ option.label }}
              </ComboboxItem>
            </ComboboxViewport>
          </ComboboxContent>
        </ComboboxPortal>
      </div>
    </ComboboxRoot>

    <p
      v-if="normalizedOptions.length === 0 && selectedOptions.length === 0"
      class="text-sm text-app-muted"
    >
      {{ emptyMessage ?? 'No options available yet.' }}
    </p>
  </FilterField>
</template>
