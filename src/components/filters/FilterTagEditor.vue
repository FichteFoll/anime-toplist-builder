<script setup lang="ts">
import { computed, watch } from 'vue'

import FilterField from '@/components/filters/FilterField.vue'
import FilterMultiComboboxField, { type FilterOption } from '@/components/filters/FilterMultiComboboxField.vue'
import { defaultMinimumTagRank } from '@/lib/filter-state'
import type { AniListTag } from '@/types'

const props = defineProps<{
  metadataTags: AniListTag[]
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
  disabledReason?: string
}>()

const model = defineModel<string[]>({ required: true })

const minimumTagRankModel = defineModel<number | undefined>('minimumTagRank')

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

const hasSelectedTags = computed(() => model.value.length > 0)

const updateMinimumTagRank = (rawValue: string) => {
  const trimmedValue = rawValue.trim()
  const parsedValue = trimmedValue.length === 0 ? undefined : Number.parseInt(trimmedValue, 10)

  minimumTagRankModel.value = Number.isFinite(parsedValue) ? parsedValue : undefined
}

watch(hasSelectedTags, (hasTags) => {
  if (hasTags && minimumTagRankModel.value === undefined) {
    minimumTagRankModel.value = defaultMinimumTagRank
  }

  if (!hasTags) {
    minimumTagRankModel.value = undefined
  }
})
</script>

<template>
  <div class="grid gap-5 lg:grid-cols-2">
    <div :class="hasSelectedTags ? '' : 'lg:col-span-2'">
      <FilterMultiComboboxField
        v-model="model"
        label="Tags"
        description="Pick tags and set the minimum rank you want them to meet."
        :options="options"
        :empty-message="emptyMessage"
        clear-label="Clear tags"
        virtualized
        placeholder="Search or select tags"
        :disabled-reason="disabledReason"
      />
    </div>

    <FilterField
      v-if="hasSelectedTags"
      label="Minimum tag rank"
      description="Only match if all tags are ranked higher than this value. (Range: 1-100)"
      :disabled-reason="disabledReason"
    >
      <input
        type="number"
        min="0"
        max="100"
        class="shell-input"
        :disabled="Boolean(disabledReason)"
        :value="minimumTagRankModel ?? defaultMinimumTagRank"
        placeholder="Minimum tag rank"
        @input="updateMinimumTagRank(($event.target as HTMLInputElement).value)"
      >
    </FilterField>
  </div>
</template>
