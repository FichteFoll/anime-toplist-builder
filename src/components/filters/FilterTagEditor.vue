<script setup lang="ts">
import { computed } from 'vue'

import FilterMultiComboboxField, { type FilterOption } from '@/components/filters/FilterMultiComboboxField.vue'
import type { AniListTag } from '@/types'

const props = defineProps<{
  modelValue: string[]
  metadataTags: AniListTag[]
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
  disabledReason?: string
}>()

const options = computed<FilterOption[]>(() => {
  const optionMap = new Map(props.metadataTags.map((tag) => [tag.name, tag]))

  for (const value of props.modelValue) {
    if (!optionMap.has(value)) {
      optionMap.set(value, {
        id: -1,
        name: value,
      })
    }
  }

  return [...optionMap.values()]
    .map((tag) => ({
      value: tag.name,
      label: tag.name,
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
})

const emptyMessage = computed(() => {
  if (props.metadataStatus === 'loading' || props.metadataStatus === 'idle') {
    return 'Additional tag options will appear automatically when available.'
  }

  if (props.metadataStatus === 'error') {
    return props.metadataError ?? 'AniList tag metadata is unavailable right now.'
  }

  return 'No tag options available yet.'
})
</script>

<template>
  <FilterMultiComboboxField
    label="Tags"
    description="AniList applies a single minimum rank threshold across all selected tags."
    :model-value="modelValue"
    :options="options"
    :empty-message="emptyMessage"
    placeholder="Search or select tags"
    :disabled-reason="disabledReason"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>
