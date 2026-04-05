<script setup lang="ts">
import { computed } from 'vue'

import FilterMultiComboboxField, { type FilterOption } from '@/components/filters/FilterMultiComboboxField.vue'
import type { AniListTag } from '@/types'

const props = defineProps<{
  metadataTags: AniListTag[]
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
  disabledReason?: string
}>()

const model = defineModel<string[]>({ required: true })

const options = computed<FilterOption[]>(() => {
  const optionMap = new Map(props.metadataTags.map((tag) => [tag.name, tag]))

  for (const value of model.value) {
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
    return 'More tag options will appear here when AniList provides them.'
  }

  if (props.metadataStatus === 'error') {
    return props.metadataError ?? 'Tag suggestions are unavailable right now.'
  }

  return 'No tag suggestions are available yet.'
})
</script>

<template>
  <FilterMultiComboboxField
    v-model="model"
    label="Tags"
    description="Pick tags and set the minimum rank you want them to meet."
    :options="options"
    :empty-message="emptyMessage"
    virtualized
    placeholder="Search or select tags"
    :disabled-reason="disabledReason"
  />
</template>
