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
import FilterMultiComboboxField from '@/components/filters/FilterMultiComboboxField.vue'
import FilterMultiSelectField from '@/components/filters/FilterMultiSelectField.vue'
import FilterSortEditor from '@/components/filters/FilterSortEditor.vue'
import FilterTagEditor from '@/components/filters/FilterTagEditor.vue'
import type { FilterDisabledReasons } from '@/lib/filter-editor'
import {
  animeFormats,
  animeSeasons,
  animeSources,
  type AnimeFormat,
  type AniListMetadata,
  type FilterSort,
  type FilterState,
  type NumericRange,
} from '@/types'

export interface FilterOption {
  value: string
  label: string
}

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
const countryDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' })

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
    label: countryDisplayNames.of(option.value) ?? option.value,
  })),
)

const genreOptions = computed(() => mergedOptions(props.metadata?.genres ?? [], props.modelValue.genres))

const seasonValue = computed(() => props.modelValue.seasons[0] ?? '')
const sourceValue = computed(() => props.modelValue.source[0] ?? '')

const seasonLabelByValue = new Map(seasonOptions.map((option) => [option.value, option.label]))
const sourceLabelByValue = new Map(sourceOptions.map((option) => [option.value, option.label]))

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
    updateFilter({ [field]: undefined })
    return
  }

  updateFilter({ [field]: nextRange })
}

const setSearch = (value: string) => {
  updateFilter({ search: value.trim() })
}

const setSort = (value: FilterSort | undefined) => {
  updateFilter({ sort: value })
}

const setFormats = (value: string[]) => {
  updateFilter({ formats: value as AnimeFormat[] })
}

const updateSingleSelect = (field: 'seasons' | 'source', value: string | undefined) => {
  updateFilter({ [field]: value ? [value] : [] } as Pick<FilterState, 'seasons' | 'source'>)
}

const genreEmptyMessage = computed(() => {
  if (props.metadataStatus === 'loading' || props.metadataStatus === 'idle') {
    return 'Additional genres will appear automatically when available.'
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
      v-if="mode === 'category'"
      label="Search"
      description="Search text is trimmed before it is applied."
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
      :description="mode === 'global' ? 'Default result ordering for the template.' : 'Adjust ordering for this category.'"
      :model-value="modelValue.sort"
      :inherit-label="mode === 'category' ? 'Use template sort' : 'No explicit sort'"
      @update:model-value="setSort"
    />

    <FilterField
      label="Release year"
      description="Set a year range to narrow results."
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
      description="Use popularity thresholds to narrow broad searches."
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

    <FilterField
      label="Season"
      description="Choose a single airing season."
      :disabled-reason="disabledFields?.seasons"
    >
      <ComboboxRoot
        :model-value="seasonValue"
        :disabled="Boolean(disabledFields?.seasons)"
        open-on-focus
        @update:model-value="updateSingleSelect('seasons', $event as string | undefined)"
      >
        <ComboboxAnchor>
          <ComboboxInput
            class="shell-input"
            :display-value="(value) => seasonLabelByValue.get(value as string) ?? ''"
            placeholder="Choose a season"
          />
        </ComboboxAnchor>

        <ComboboxPortal>
          <ComboboxContent
            position="popper"
            class="z-[60] w-[var(--reka-combobox-trigger-width)] min-w-[var(--reka-combobox-trigger-width)] border border-app-border/80 bg-app-surface p-2 shadow-shell"
          >
            <ComboboxViewport class="max-h-64 w-full overflow-y-auto">
              <ComboboxItem
                v-for="option in seasonOptions"
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

    <FilterMultiComboboxField
      label="Country of origin"
      description="Common anime-producing regions are always available."
      :model-value="modelValue.countryOfOrigin"
      :options="countryOptions"
      placeholder="Search or select countries"
      :disabled-reason="disabledFields?.countryOfOrigin"
      @update:model-value="updateFilter({ countryOfOrigin: $event })"
    />

    <FilterMultiComboboxField
      label="Genres"
      description="Genre choices update automatically as more data becomes available."
      :model-value="modelValue.genres"
      :options="genreOptions"
      :empty-message="genreEmptyMessage"
      placeholder="Search or select genres"
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

    <FilterField
      label="Source material"
      description="Choose a single source material type."
      :disabled-reason="disabledFields?.source"
    >
      <ComboboxRoot
        :model-value="sourceValue"
        :disabled="Boolean(disabledFields?.source)"
        open-on-focus
        @update:model-value="updateSingleSelect('source', $event as string | undefined)"
      >
        <ComboboxAnchor>
          <ComboboxInput
            class="shell-input"
            :display-value="(value) => sourceLabelByValue.get(value as string) ?? ''"
            placeholder="Choose a source type"
          />
        </ComboboxAnchor>

        <ComboboxPortal>
          <ComboboxContent
            position="popper"
            class="z-[60] w-[var(--reka-combobox-trigger-width)] min-w-[var(--reka-combobox-trigger-width)] border border-app-border/80 bg-app-surface p-2 shadow-shell"
          >
            <ComboboxViewport class="max-h-64 w-full overflow-y-auto">
              <ComboboxItem
                v-for="option in sourceOptions"
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

    <div class="lg:col-span-2">
      <FilterTagEditor
        :model-value="modelValue.tags.map((tag) => tag.name)"
        :metadata-tags="metadata?.tags ?? []"
        :metadata-status="metadataStatus"
        :metadata-error="metadataError"
        :disabled-reason="disabledFields?.tags"
        @update:model-value="updateFilter({ tags: $event.map((name: string) => ({ name })) })"
      />
    </div>
  </div>
</template>
