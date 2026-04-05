<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

const normalizeValues = (values: string[], sort = true) => {
  const seen = new Set<string>()
  const normalizedValues: string[] = []

  for (const rawValue of values) {
    const value = rawValue.trim()

    if (value.length === 0 || seen.has(value)) {
      continue
    }

    seen.add(value)
    normalizedValues.push(value)
  }

  return sort ? normalizedValues.sort((left, right) => left.localeCompare(right)) : normalizedValues
}

const mergePreservingOrder = (currentValues: string[], nextValues: string[]) => {
  const nextValueSet = new Set(nextValues)
  const currentValueSet = new Set(currentValues)
  const mergedValues = currentValues.filter((value) => nextValueSet.has(value))

  for (const value of nextValues) {
    if (!currentValueSet.has(value)) {
      mergedValues.push(value)
    }
  }

  return mergedValues
}

const areSameValues = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index])

const searchTerm = ref('')
const ignoreNextComboboxUpdate = ref(false)
const selectedValues = ref<string[]>([])
const excludedValues = ref<string[]>([])
const pendingPropState = ref<{ model: string[]; excluded: string[] } | null>(null)

const normalizedSearchTerm = computed(() => searchTerm.value.trim().toLocaleLowerCase())

const excludedValueSet = computed(() => new Set(excludedValues.value))

const includedValues = computed(() => selectedValues.value.filter((value) => !excludedValueSet.value.has(value)))

const normalizedOptions = computed(() => {
  const optionMap = new Map(props.options.map((option) => [option.value, option]))

  for (const selectedValue of selectedValues.value) {
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

  return selectedValues.value
    .map((value) => optionMap.get(value))
    .filter((option): option is FilterOption => option !== undefined)
})

const displayedOptions = computed(() => [
  ...selectedOptions.value.map((option) => ({
    ...option,
    tone: excludedValueSet.value.has(option.value) ? ('excluded' as const) : ('selected' as const),
  })),
])

const popupItemClass = (value: string) =>
  excludedValueSet.value.has(value)
    ? 'flex w-full cursor-pointer items-center rounded-xl bg-red-500/10 px-3 py-2 text-sm text-app-text outline-none data-[highlighted]:bg-red-500/20'
    : 'flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-sm text-app-text outline-none data-[state=checked]:bg-app-accent/20 data-[highlighted]:bg-app-accentSoft'

const popupItemStatus = (value: string) => {
  if (props.enableExclusion && excludedValueSet.value.has(value)) {
    return 'Exclude'
  }

  if (selectedValues.value.includes(value)) {
    return 'Include'
  }

  return ''
}

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

const setPendingPropState = (nextModelValues: string[], nextExcludedValues: string[]) => {
  pendingPropState.value = {
    model: normalizeValues(nextModelValues),
    excluded: normalizeValues(nextExcludedValues),
  }
}

const syncInternalStateFromProps = () => {
  const nextModelValues = normalizeValues(model.value ?? [])
  const nextExcludedValues = normalizeValues(excludedModel.value ?? [])

  if (pendingPropState.value !== null) {
    if (
      areSameValues(nextModelValues, pendingPropState.value.model) &&
      areSameValues(nextExcludedValues, pendingPropState.value.excluded)
    ) {
      pendingPropState.value = null
      return
    }

    return
  }

  const nextSelectedValues = normalizeValues([...nextModelValues, ...nextExcludedValues], false)

  selectedValues.value = mergePreservingOrder(selectedValues.value, nextSelectedValues)
  excludedValues.value = mergePreservingOrder(excludedValues.value, nextExcludedValues).filter((value) =>
    selectedValues.value.includes(value),
  )
}

watch([model, excludedModel], syncInternalStateFromProps, { immediate: true })

const syncSelectionToProps = () => {
  const nextIncludedValues = includedValues.value
  const nextExcludedValues = props.enableExclusion ? excludedValues.value : []

  setPendingPropState(nextIncludedValues, nextExcludedValues)
  emitValues(nextIncludedValues)

  if (props.enableExclusion) {
    emitExcludedValues(nextExcludedValues)
  }
}

const applySelectionChange = (mutate: () => void) => {
  mutate()
  syncSelectionToProps()
}

const updateValuesFromCombobox = (values: string[] | undefined) => {
  if (ignoreNextComboboxUpdate.value) {
    ignoreNextComboboxUpdate.value = false
    searchTerm.value = ''
    return
  }

  applySelectionChange(() => {
    selectedValues.value = normalizeValues(values ?? [], false)

    if (props.enableExclusion) {
      excludedValues.value = excludedValues.value.filter((value) => selectedValues.value.includes(value))
    } else {
      excludedValues.value = []
    }
  })

  searchTerm.value = ''
}

const includeValue = (value: string) => {
  applySelectionChange(() => {
    if (!selectedValues.value.includes(value)) {
      selectedValues.value = [...selectedValues.value, value]
    }

    excludedValues.value = excludedValues.value.filter((entry) => entry !== value)
  })
}

const excludeValue = (value: string) => {
  applySelectionChange(() => {
    if (!selectedValues.value.includes(value)) {
      selectedValues.value = [...selectedValues.value, value]
    }

    if (!excludedValues.value.includes(value)) {
      excludedValues.value = [...excludedValues.value, value]
    }
  })
}

const clearValues = () => {
  applySelectionChange(() => {
    selectedValues.value = []
    excludedValues.value = []
  })

  searchTerm.value = ''
}

const removeValue = (value: string) => {
  applySelectionChange(() => {
    selectedValues.value = selectedValues.value.filter((entry) => entry !== value)
    excludedValues.value = excludedValues.value.filter((entry) => entry !== value)
  })
}

const cyclePopupSelection = (value: string) => {
  ignoreNextComboboxUpdate.value = true

  const isExcluded = excludedValues.value.includes(value)
  const isSelected = selectedValues.value.includes(value)

  if (!props.enableExclusion) {
    applySelectionChange(() => {
      selectedValues.value = isSelected
        ? selectedValues.value.filter((entry) => entry !== value)
        : [...selectedValues.value, value]
    })

    return
  }

  if (isExcluded) {
    includeValue(value)
    return
  }

  if (isSelected) {
    excludeValue(value)
    return
  }

  includeValue(value)
}

const toggleChipSelection = (value: string) => {
  if (!props.enableExclusion) {
    applySelectionChange(() => {
      selectedValues.value = selectedValues.value.includes(value)
        ? selectedValues.value.filter((entry) => entry !== value)
        : [...selectedValues.value, value]
    })

    return
  }

  if (excludedValues.value.includes(value)) {
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
      :model-value="selectedValues"
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
                :class="popupItemClass(option.value)"
                @select.prevent="cyclePopupSelection(option.value)"
              >
                <span class="flex w-full items-center justify-between gap-3">
                  <span>{{ option.label }}</span>
                  <span class="text-[10px] uppercase tracking-[0.2em] text-app-muted">
                    {{ popupItemStatus(option.value) }}
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
                :class="popupItemClass(option.value)"
                @select.prevent="cyclePopupSelection(option.value)"
              >
                <span class="flex w-full items-center justify-between gap-3">
                  <span>{{ option.label }}</span>
                  <span class="text-[10px] uppercase tracking-[0.2em] text-app-muted">
                    {{ popupItemStatus(option.value) }}
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
