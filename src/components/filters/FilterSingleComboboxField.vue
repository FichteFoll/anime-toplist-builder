<script setup lang="ts">
import { computed } from 'vue'
import {
  ComboboxAnchor,
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
  options: FilterOption[]
  placeholder?: string
  disabledReason?: string
  clearLabel: string
}>()

const model = defineModel<string | undefined>({ required: true })

const optionLabelByValue = computed(() => new Map(props.options.map((option) => [option.value, option.label])))

const displayValue = (value: string) => optionLabelByValue.value.get(value) ?? ''

const updateValue = (value: string | undefined) => {
  model.value = value || undefined
}
</script>

<template>
  <FilterField
    :label="label"
    :description="description"
    :disabled-reason="disabledReason"
  >
    <ComboboxRoot
      :model-value="model"
      :disabled="Boolean(disabledReason)"
      open-on-focus
      @update:model-value="updateValue($event as string | undefined)"
    >
      <ComboboxAnchor as-child>
        <div class="relative">
          <ComboboxInput
            class="shell-input pr-10"
            :display-value="displayValue"
            :placeholder="placeholder ?? 'Choose an option'"
          />

          <button
            v-if="model"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs text-app-muted transition hover:bg-app-accentSoft hover:text-app-text"
            :disabled="Boolean(disabledReason)"
            :aria-label="clearLabel"
            @click="updateValue(undefined)"
          >
            ×
          </button>
        </div>
      </ComboboxAnchor>

      <ComboboxPortal>
        <ComboboxContent
          position="popper"
          class="z-[60] w-[var(--reka-combobox-trigger-width)] min-w-[var(--reka-combobox-trigger-width)] border border-app-border/80 bg-app-surface p-2 shadow-shell"
        >
          <ComboboxViewport class="max-h-64 w-full overflow-y-auto">
            <ComboboxItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              :text-value="option.label"
              class="flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-sm text-app-text outline-none data-[highlighted]:bg-app-accentSoft"
            >
              {{ option.label }}
            </ComboboxItem>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxPortal>
    </ComboboxRoot>
  </FilterField>
</template>
