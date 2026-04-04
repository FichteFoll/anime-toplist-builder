<script setup lang="ts">
import { computed } from 'vue'

import FilterField from '@/components/filters/FilterField.vue'
import type { AniListTag, TagFilter } from '@/types'

const props = defineProps<{
  modelValue: TagFilter[]
  metadataTags: AniListTag[]
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
  disabledReason?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TagFilter[]]
}>()

const normalizedOptions = computed(() => {
  const optionMap = new Map(props.metadataTags.map((tag) => [tag.name, tag]))

  for (const selectedTag of props.modelValue) {
    if (!optionMap.has(selectedTag.name)) {
      optionMap.set(selectedTag.name, {
        id: -1,
        name: selectedTag.name,
      })
    }
  }

  return [...optionMap.values()].sort((left, right) => left.name.localeCompare(right.name))
})

const normalizedSelectedTags = computed(() =>
  [...props.modelValue].sort((left, right) => left.name.localeCompare(right.name)),
)

const hasTag = (tagName: string) => props.modelValue.some((tag) => tag.name === tagName)

const emitTags = (tags: TagFilter[]) => {
  emit(
    'update:modelValue',
    [...tags]
      .filter((tag) => tag.name.trim().length > 0)
      .map((tag) => ({
        name: tag.name.trim(),
        minimumRank: tag.minimumRank,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
  )
}

const toggleTag = (tagName: string) => {
  if (hasTag(tagName)) {
    emitTags(props.modelValue.filter((tag) => tag.name !== tagName))
    return
  }

  emitTags([
    ...props.modelValue,
    {
      name: tagName,
    },
  ])
}

const updateRank = (tagName: string, rawValue: string) => {
  const trimmedValue = rawValue.trim()
  const parsedValue =
    trimmedValue.length === 0 ? undefined : Number.parseInt(trimmedValue, 10)
  const minimumRank =
    parsedValue === undefined ? undefined : Math.max(0, Math.min(100, parsedValue))

  emitTags(
    props.modelValue.map((tag) =>
      tag.name === tagName
        ? {
            ...tag,
            minimumRank: Number.isFinite(minimumRank) ? minimumRank : undefined,
          }
        : tag,
    ),
  )
}

const metadataMessage = computed(() => {
  if (props.metadataStatus === 'loading' || props.metadataStatus === 'idle') {
    return 'Additional tag options will appear automatically when available.'
  }

  if (props.metadataStatus === 'error') {
    return props.metadataError ?? 'AniList tag metadata is unavailable right now.'
  }

  return null
})
</script>

<template>
  <FilterField
    label="Tags"
    description="AniList applies the strictest selected minimum rank across chosen tags."
    :disabled-reason="disabledReason"
  >
    <p
      v-if="metadataMessage"
      class="text-sm text-app-muted"
    >
      {{ metadataMessage }}
    </p>

    <div
      v-if="normalizedOptions.length > 0"
      class="max-h-48 overflow-y-auto rounded-[1.25rem] border border-app-border/70 bg-app-bg/50 p-3"
    >
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in normalizedOptions"
          :key="tag.name"
          type="button"
          class="shell-button"
          :class="hasTag(tag.name) ? 'shell-button-active' : ''"
          :disabled="Boolean(disabledReason)"
          :aria-pressed="hasTag(tag.name)"
          :aria-label="`${hasTag(tag.name) ? 'Remove' : 'Add'} tag ${tag.name}`"
          @click="toggleTag(tag.name)"
        >
          {{ tag.name }}
        </button>
      </div>
    </div>

    <p
      v-else-if="normalizedSelectedTags.length === 0"
      class="text-sm text-app-muted"
    >
      No tag options available yet.
    </p>

    <div
      v-if="normalizedSelectedTags.length > 0"
      class="space-y-3 rounded-[1.25rem] border border-app-border/70 bg-app-bg/40 p-4"
    >
      <div
        v-for="tag in normalizedSelectedTags"
        :key="tag.name"
        class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-center"
      >
        <div>
          <p class="text-sm font-medium text-app-text">
            {{ tag.name }}
          </p>
          <p class="text-xs leading-5 text-app-muted">
            Leave rank empty to match any rank.
          </p>
        </div>

        <label class="space-y-2">
          <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
            Minimum rank
          </span>
          <input
            type="number"
            min="0"
            max="100"
            class="shell-input"
            :disabled="Boolean(disabledReason)"
            :value="tag.minimumRank ?? ''"
            @input="updateRank(tag.name, ($event.target as HTMLInputElement).value)"
          >
        </label>
      </div>
    </div>
  </FilterField>
</template>
