<script setup lang="ts">
import { computed } from 'vue'

import FilterField from '@/components/filters/FilterField.vue'
import FilterMultiSelectField, {
  type FilterOption,
} from '@/components/filters/FilterMultiSelectField.vue'
import FilterSortEditor from '@/components/filters/FilterSortEditor.vue'
import FilterTagEditor from '@/components/filters/FilterTagEditor.vue'
import type { FilterDisabledReasons } from '@/lib/filter-editor'
import {
  animeFormats,
  animeSeasons,
  animeSources,
  type AnimeFormat,
  type AnimeSeason,
  type AnimeSource,
  type AniListMetadata,
  type FilterSort,
  type FilterState,
  type NumericRange,
} from '@/types'

const props = defineProps<{
  modelValue: FilterState
  mode: 'global' | 'category'
  metadata: AniListMetadata | null
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
  disabledFields?: FilterDisabledReasons
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterState]
}>()

const staticCountryOptions = ['CN', 'JP', 'KR', 'TW']

const toTitleLabel = (value: string) =>
  value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const createEnumOptions = (values: readonly string[]): FilterOption[] =>
  values.map((value) => ({
    value,
    label: toTitleLabel(value),
  }))

const mergedOptions = (values: string[], currentValues: string[]): FilterOption[] =>
  [...new Set([...values, ...currentValues])]
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({
      value,
      label: value,
    }))

const seasonOptions = createEnumOptions(animeSeasons)
const formatOptions = createEnumOptions(animeFormats)
const sourceOptions = createEnumOptions(animeSources)

const countryOptions = computed(() =>
  mergedOptions(staticCountryOptions, props.modelValue.countryOfOrigin).map((option) => ({
    ...option,
    label: option.value,
  })),
)

const genreOptions = computed(() =>
  mergedOptions(props.metadata?.genres ?? [], props.modelValue.genres),
)

const updateFilter = (patch: Partial<FilterState>) => {
  emit('update:modelValue', {
    ...props.modelValue,
    ...patch,
  })
}

const updateRange = (
  field: 'yearRange' | 'popularity',
  bound: keyof NumericRange,
  rawValue: string,
) => {
  const trimmedValue = rawValue.trim()
  const parsedValue = trimmedValue.length === 0 ? undefined : Number.parseInt(trimmedValue, 10)
  const currentRange = props.modelValue[field]
  const nextRange: NumericRange = {
    ...(currentRange ?? {}),
    [bound]: Number.isFinite(parsedValue) ? parsedValue : undefined,
  }

  if (nextRange.minimum === undefined && nextRange.maximum === undefined) {
    updateFilter({
      [field]: undefined,
    })
    return
  }

  updateFilter({
    [field]: nextRange,
  })
}

const setSearch = (value: string) => {
  updateFilter({
    search: value.trim(),
  })
}

const setSort = (value: FilterSort | undefined) => {
  updateFilter({
    sort: value,
  })
}

const setSeasons = (value: string[]) => {
  updateFilter({
    seasons: value as AnimeSeason[],
  })
}

const setFormats = (value: string[]) => {
  updateFilter({
    formats: value as AnimeFormat[],
  })
}

const setSource = (value: string[]) => {
  updateFilter({
    source: value as AnimeSource[],
  })
}

const genreEmptyMessage = computed(() => {
  if (props.metadataStatus === 'loading' || props.metadataStatus === 'idle') {
    return 'Genre metadata is loading. Existing selections remain visible.'
  }

  if (props.metadataStatus === 'error') {
    return props.metadataError ?? 'Genre metadata is unavailable right now.'
  }

  return 'No genres available.'
})
</script>

<template>
  <div class="grid gap-5 lg:grid-cols-2">
    <FilterField
      label="Search"
      description="Search text is trimmed before it becomes part of the shared filter model."
      :disabled-reason="disabledFields?.search"
    >
      <input
        type="text"
        class="shell-input"
        :disabled="Boolean(disabledFields?.search)"
        :value="modelValue.search"
        placeholder="Search AniList titles"
        @input="setSearch(($event.target as HTMLInputElement).value)"
      >
    </FilterField>

    <FilterSortEditor
      label="Sort"
      :description="mode === 'global' ? 'Default result ordering for the template.' : 'Override the template sort for this category only.'"
      :model-value="modelValue.sort"
      :inherit-label="mode === 'category' ? 'Use template sort' : 'No explicit sort'"
      @update:model-value="setSort"
    />

    <FilterField
      label="Release year"
      description="Minimum and maximum years map to AniList start-date bounds."
      :disabled-reason="disabledFields?.yearRange"
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <input
          type="number"
          class="shell-input"
          :disabled="Boolean(disabledFields?.yearRange)"
          :value="modelValue.yearRange?.minimum ?? ''"
          placeholder="Minimum year"
          @input="updateRange('yearRange', 'minimum', ($event.target as HTMLInputElement).value)"
        >
        <input
          type="number"
          class="shell-input"
          :disabled="Boolean(disabledFields?.yearRange)"
          :value="modelValue.yearRange?.maximum ?? ''"
          placeholder="Maximum year"
          @input="updateRange('yearRange', 'maximum', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </FilterField>

    <FilterField
      label="Popularity"
      description="Use AniList popularity thresholds to narrow broad searches."
      :disabled-reason="disabledFields?.popularity"
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <input
          type="number"
          class="shell-input"
          :disabled="Boolean(disabledFields?.popularity)"
          :value="modelValue.popularity?.minimum ?? ''"
          placeholder="Minimum popularity"
          @input="updateRange('popularity', 'minimum', ($event.target as HTMLInputElement).value)"
        >
        <input
          type="number"
          class="shell-input"
          :disabled="Boolean(disabledFields?.popularity)"
          :value="modelValue.popularity?.maximum ?? ''"
          placeholder="Maximum popularity"
          @input="updateRange('popularity', 'maximum', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </FilterField>

    <FilterMultiSelectField
      label="Seasons"
      description="Choose one or more airing seasons."
      :model-value="modelValue.seasons"
      :options="seasonOptions"
      :disabled-reason="disabledFields?.seasons"
      @update:model-value="setSeasons"
    />

    <FilterMultiSelectField
      label="Country of origin"
      description="Common anime-producing regions are available even before metadata loads."
      :model-value="modelValue.countryOfOrigin"
      :options="countryOptions"
      :disabled-reason="disabledFields?.countryOfOrigin"
      @update:model-value="updateFilter({ countryOfOrigin: $event })"
    />

    <FilterMultiSelectField
      label="Genres"
      description="Genre choices come from AniList metadata when available."
      :model-value="modelValue.genres"
      :options="genreOptions"
      :empty-message="genreEmptyMessage"
      :disabled-reason="disabledFields?.genres"
      @update:model-value="updateFilter({ genres: $event })"
    />

    <FilterMultiSelectField
      label="Formats"
      description="Filter by anime release format."
      :model-value="modelValue.formats"
      :options="formatOptions"
      :disabled-reason="disabledFields?.formats"
      @update:model-value="setFormats"
    />

    <FilterMultiSelectField
      label="Source material"
      description="Filter by the origin of the anime adaptation."
      :model-value="modelValue.source"
      :options="sourceOptions"
      :disabled-reason="disabledFields?.source"
      @update:model-value="setSource"
    />

    <div class="lg:col-span-2">
      <FilterTagEditor
        :model-value="modelValue.tags"
        :metadata-tags="metadata?.tags ?? []"
        :metadata-status="metadataStatus"
        :metadata-error="metadataError"
        :disabled-reason="disabledFields?.tags"
        @update:model-value="updateFilter({ tags: $event })"
      />
    </div>
  </div>
</template>
