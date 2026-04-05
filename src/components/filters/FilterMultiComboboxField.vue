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
  enableExclusion?: boolean
}>()

const model = defineModel<string[]>({ required: true })
const excludedModel = defineModel<string[]>('excludedValues')

const normalizeValues = (values: string[]) =>
  [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))].sort((left, right) =>
    left.localeCompare(right),
  )

const searchTerm = ref('')
const ignoreNextComboboxUpdate = ref(false)
const handledPopupValue = ref<string | null>(null)

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
  const excludedValues = props.enableExclusion ? excludedOptionValues.value : new Set<string>()

  return normalizeValues(model.value)
    .filter((value) => !excludedValues.has(value))
    .map((value) => optionMap.get(value))
    .filter((option): option is FilterOption => option !== undefined)
})

const excludedOptionValues = computed(() => new Set(normalizeValues(excludedModel.value ?? [])))

const includedModelValues = computed(() => {
  const values = normalizeValues(model.value)

  if (!props.enableExclusion) {
    return values
  }

  return values.filter((value) => !excludedOptionValues.value.has(value))
})

const excludedOptions = computed(() => {
  if (!props.enableExclusion) {
    return []
  }

  const optionMap = new Map(normalizedOptions.value.map((option) => [option.value, option]))

  return normalizeValues(excludedModel.value ?? [])
    .map((value) => optionMap.get(value))
    .filter((option): option is FilterOption => option !== undefined)
})

const displayedOptions = computed(() => [
  ...selectedOptions.value.map((option) => ({ ...option, tone: 'selected' as const })),
  ...excludedOptions.value.map((option) => ({ ...option, tone: 'excluded' as const })),
])

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

const emitExcludedValues = (values: string[] | undefined) => {
  excludedModel.value = normalizeValues(values ?? [])
}

const updateValuesFromCombobox = (values: string[] | undefined) => {
  if (ignoreNextComboboxUpdate.value) {
    ignoreNextComboboxUpdate.value = false
    searchTerm.value = ''
    return
  }

  const nextValues = normalizeValues(values ?? [])

  if (props.enableExclusion) {
    const currentIncludedValues = includedModelValues.value
    const removedValues = currentIncludedValues.filter((value) => !nextValues.includes(value))
    const addedValues = nextValues.filter((value) => !currentIncludedValues.includes(value))

    emitExcludedValues([
      ...(excludedModel.value ?? []).filter((value) => !addedValues.includes(value)),
      ...removedValues,
    ])

    emitValues(nextValues)
  } else {
    emitValues(nextValues)
  }

  searchTerm.value = ''
}

const cyclePopupSelection = (value: string) => {
  if (handledPopupValue.value === value) {
    return
  }

  handledPopupValue.value = value
  ignoreNextComboboxUpdate.value = true

  queueMicrotask(() => {
    if (handledPopupValue.value === value) {
      handledPopupValue.value = null
    }
  })

  const isSelected = model.value.includes(value)
  const isExcluded = (excludedModel.value ?? []).includes(value)

  if (!props.enableExclusion) {
    if (isSelected) {
      emitValues(model.value.filter((entry) => entry !== value))
      return
    }

    emitValues([...model.value, value])
    return
  }

  if (isSelected) {
    excludeValue(value)
    return
  }

  if (isExcluded) {
    emitExcludedValues((excludedModel.value ?? []).filter((entry) => entry !== value))
    return
  }

  includeValue(value)
}

const includeValue = (value: string) => {
  emitValues([...model.value.filter((entry) => entry !== value), value])

  if (props.enableExclusion) {
    emitExcludedValues((excludedModel.value ?? []).filter((entry) => entry !== value))
  }
}

const excludeValue = (value: string) => {
  emitValues(model.value.filter((entry) => entry !== value))

  if (props.enableExclusion) {
    emitExcludedValues([...(excludedModel.value ?? []).filter((entry) => entry !== value), value])
  }
}

const clearValues = () => {
  emitValues([])
  if (props.enableExclusion) {
    emitExcludedValues([])
  }
  searchTerm.value = ''
}

const removeValue = (value: string) => {
  emitValues(model.value.filter((entry) => entry !== value))

  if (props.enableExclusion) {
    emitExcludedValues((excludedModel.value ?? []).filter((entry) => entry !== value))
  }
}

const toggleChipSelection = (value: string) => {
  if (!props.enableExclusion) {
    if (model.value.includes(value)) {
      emitValues(model.value.filter((entry) => entry !== value))
      return
    }

    emitValues([...model.value, value])
    return
  }

  if ((excludedModel.value ?? []).includes(value)) {
    includeValue(value)
    return
  }

  excludeValue(value)
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
      :model-value="includedModelValues"
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
              v-for="option in displayedOptions"
              :key="option.value"
              class="inline-flex shrink-0 items-center gap-1"
            >
              <button
                type="button"
                :data-filter-chip="option.tone"
                :class="option.tone === 'excluded'
                  ? 'inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs leading-5 text-app-text transition hover:bg-red-500/25'
                  : 'inline-flex items-center gap-1 rounded-full bg-app-accentSoft px-2 py-0.5 text-xs leading-5 text-app-text transition hover:bg-app-accent/20'"
                :disabled="Boolean(disabledReason)"
                :aria-label="`${option.label}. Click to toggle exclusion.`"
                @mousedown.prevent
                @click.stop="toggleChipSelection(option.value)"
              >
                {{ option.label }}
              </button>
              <button
                type="button"
                class="text-[10px] leading-none text-app-muted transition hover:text-app-text"
                :disabled="Boolean(disabledReason)"
                :aria-label="`Remove ${option.label}`"
                @mousedown.prevent
                @click.stop="removeValue(option.value)"
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
                :data-filter-popup-item="option.value"
                :class="excludedOptionValues.has(option.value)
                  ? 'flex w-full cursor-pointer items-center rounded-xl bg-red-500/10 px-3 py-2 text-sm text-app-text outline-none data-[highlighted]:bg-red-500/20'
                  : 'flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-sm text-app-text outline-none data-[state=checked]:bg-app-accent/20 data-[highlighted]:bg-app-accentSoft'"
                @click.prevent.stop="cyclePopupSelection(option.value)"
                @select.prevent="cyclePopupSelection(option.value)"
              >
                <span class="flex w-full items-center justify-between gap-3">
                  <span>{{ option.label }}</span>
                  <span class="text-[10px] uppercase tracking-[0.2em] text-app-muted">
                    <template v-if="selectedOptions.some((selectedOption) => selectedOption.value === option.value)">
                      Include
                    </template>
                    <template v-else-if="props.enableExclusion && excludedOptions.some((excludedOption) => excludedOption.value === option.value)">
                      Exclude
                    </template>
                  </span>
                </span>
              </ComboboxItem>
            </ComboboxVirtualizer>

            <template v-else>
              <ComboboxItem
                v-for="option in filteredOptions"
                :key="option.value"
                :value="option.value"
                :text-value="option.label"
                :data-filter-popup-item="option.value"
                :class="excludedOptionValues.has(option.value)
                  ? 'flex w-full cursor-pointer items-center rounded-xl bg-red-500/10 px-3 py-2 text-sm text-app-text outline-none data-[highlighted]:bg-red-500/20'
                  : 'flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-sm text-app-text outline-none data-[state=checked]:bg-app-accent/20 data-[highlighted]:bg-app-accentSoft'"
                @click.prevent.stop="cyclePopupSelection(option.value)"
                @select.prevent="cyclePopupSelection(option.value)"
              >
                <span class="flex w-full items-center justify-between gap-3">
                  <span>{{ option.label }}</span>
                  <span class="text-[10px] uppercase tracking-[0.2em] text-app-muted">
                    <template v-if="selectedOptions.some((selectedOption) => selectedOption.value === option.value)">
                      Include
                    </template>
                    <template v-else-if="props.enableExclusion && excludedOptions.some((excludedOption) => excludedOption.value === option.value)">
                      Exclude
                    </template>
                  </span>
                </span>
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
