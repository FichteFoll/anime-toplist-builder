<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxViewport,
  ComboboxVirtualizer,
} from 'reka-ui'

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
  placeholder?: string
  clearLabel: string
  disabledReason?: string
  virtualized?: boolean
}>()

const model = defineModel<string[]>({ required: true })

const normalizeValues = (values: string[]) =>
  [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))].sort((left, right) =>
    left.localeCompare(right),
  )

const searchTerm = ref('')

const normalizedSearchTerm = computed(() => searchTerm.value.trim().toLocaleLowerCase())

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

const selectedOptions = computed(() => {
  const optionMap = new Map(normalizedOptions.value.map((option) => [option.value, option]))

  return normalizeValues(model.value)
    .map((value) => optionMap.get(value))
    .filter((option): option is FilterOption => option !== undefined)
})

const filteredOptions = computed(() => {
  const term = normalizedSearchTerm.value

  if (!term) {
    return normalizedOptions.value
  }

  return normalizedOptions.value.filter((option) => {
    const label = option.label.toLocaleLowerCase()
    const value = option.value.toLocaleLowerCase()

    return label.includes(term) || value.includes(term)
  })
})

const emptyStateMessage = computed(() => {
  if (normalizedOptions.value.length === 0) {
    return props.emptyMessage ?? 'No suggestions are available yet.'
  }

  return 'No results match your search.'
})

const emitValues = (values: string[] | undefined) => {
  model.value = normalizeValues(values ?? [])
}

const updateValuesFromCombobox = (values: string[] | undefined) => {
  emitValues(values)
  searchTerm.value = ''
}

const clearValues = () => {
  emitValues([])
  searchTerm.value = ''
}

const removeValue = (value: string) => {
  emitValues(model.value.filter((entry) => entry !== value))
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
      :model-value="normalizeValues(model)"
      :disabled="Boolean(disabledReason)"
      open-on-focus
      :ignore-filter="true"
      @update:model-value="(value) => updateValuesFromCombobox(value as unknown as string[])"
    >
      <ComboboxAnchor as-child>
        <div class="relative">
          <div
            class="flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-2xl border border-app-border/80 bg-app-surface px-3 py-2 pr-10 text-sm text-app-text outline-none transition focus-within:border-app-accent/60 focus-within:ring-2 focus-within:ring-app-accent/30"
          >
            <span
              v-for="option in selectedOptions"
              :key="option.value"
              class="inline-flex shrink-0 items-center gap-1 rounded-full bg-app-accentSoft px-2 py-0.5 text-xs leading-5 text-app-text"
            >
              {{ option.label }}
              <button
                type="button"
                class="text-[10px] leading-none text-app-muted transition hover:text-app-text"
                :disabled="Boolean(disabledReason)"
                :aria-label="`Remove ${option.label}`"
                @click="removeValue(option.value)"
              >
                ×
              </button>
            </span>

            <ComboboxInput
              v-model="searchTerm"
              class="min-w-[6rem] flex-1 border-0 bg-transparent px-0 py-1 text-sm text-app-text outline-none placeholder:text-app-muted/70 focus:ring-0"
              :placeholder="placeholder ?? 'Search options'"
            />
          </div>

          <button
            v-if="selectedOptions.length > 0"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs text-app-muted transition hover:bg-app-accentSoft hover:text-app-text"
            :disabled="Boolean(disabledReason)"
            :aria-label="clearLabel"
            @click="clearValues"
          >
            ×
          </button>
        </div>
      </ComboboxAnchor>

      <ComboboxPortal>
        <ComboboxContent
          position="popper"
          class="z-50 w-[var(--reka-combobox-trigger-width)] min-w-[var(--reka-combobox-trigger-width)] border border-app-border/80 bg-app-surface p-2 shadow-shell"
        >
          <ComboboxViewport class="max-h-64 w-full overflow-y-auto">
            <p
              v-if="filteredOptions.length === 0"
              class="px-3 py-2 text-sm text-app-muted"
            >
              {{ emptyStateMessage }}
            </p>

            <ComboboxVirtualizer
              v-else-if="virtualized"
              v-slot="{ option }"
              :options="filteredOptions"
              :text-content="(option) => option.label"
              :estimate-size="40"
            >
              <ComboboxItem
                :value="option.value"
                :text-value="option.label"
                class="flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-sm text-app-text outline-none data-[state=checked]:bg-app-accent/20 data-[highlighted]:bg-app-accentSoft"
              >
                {{ option.label }}
              </ComboboxItem>
            </ComboboxVirtualizer>

            <template v-else>
              <ComboboxItem
                v-for="option in filteredOptions"
                :key="option.value"
                :value="option.value"
                :text-value="option.label"
                class="flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-sm text-app-text outline-none data-[state=checked]:bg-app-accent/20 data-[highlighted]:bg-app-accentSoft"
              >
                {{ option.label }}
              </ComboboxItem>
            </template>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxPortal>
    </ComboboxRoot>

    <p
      v-if="normalizedOptions.length === 0 && selectedOptions.length === 0"
      class="text-sm text-app-muted"
    >
      {{ emptyMessage ?? 'No suggestions are available yet.' }}
    </p>
  </FilterField>
</template>
