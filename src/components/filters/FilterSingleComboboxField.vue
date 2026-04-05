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
} from 'reka-ui'

import FilterField from '@/components/filters/FilterField.vue'
import { useVisibleScrollbar } from '@/composables/useVisibleScrollbar'

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

const searchTerm = ref('')

const optionLabelByValue = computed(() => new Map(props.options.map((option) => [option.value, option.label])))

const displayValue = (value: string) => optionLabelByValue.value.get(value) ?? ''

const { scrollbarState, viewportRef } = useVisibleScrollbar(() => props.options.length)

watch(
  model,
  (value) => {
    searchTerm.value = value ? displayValue(value) : ''
  },
  { immediate: true },
)

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
            v-model="searchTerm"
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
          <div class="relative max-h-64 w-full overflow-hidden pr-3">
            <ComboboxViewport
              ref="viewportRef"
              class="max-h-64 w-full overflow-y-auto pr-2"
            >
              <ComboboxItem
                v-for="option in options"
                :key="option.value"
                :value="option.value"
                :text-value="option.label"
                class="flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-sm text-app-text outline-none data-[state=checked]:bg-app-accent/20 data-[highlighted]:bg-app-accentSoft"
              >
                {{ option.label }}
              </ComboboxItem>
            </ComboboxViewport>

            <div
              v-if="scrollbarState.visible"
              class="pointer-events-none absolute bottom-2 right-1 top-2 w-1.5 rounded-full bg-app-text/8"
            >
              <div
                class="absolute left-0 right-0 rounded-full bg-app-muted/80"
                :style="{
                  height: `${scrollbarState.thumbHeight}px`,
                  transform: `translateY(${scrollbarState.thumbTop}px)`,
                }"
              />
            </div>
          </div>
        </ComboboxContent>
      </ComboboxPortal>
    </ComboboxRoot>
  </FilterField>
</template>
