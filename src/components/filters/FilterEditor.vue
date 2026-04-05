<script setup lang="ts">
import { computed } from 'vue'

import FilterField from '@/components/filters/FilterField.vue'
import FilterMultiSelectField from '@/components/filters/FilterMultiSelectField.vue'
import FilterMultiComboboxField from '@/components/filters/FilterMultiComboboxField.vue'
import FilterSingleComboboxField from '@/components/filters/FilterSingleComboboxField.vue'
import FilterSortEditor from '@/components/filters/FilterSortEditor.vue'
import FilterTagEditor from '@/components/filters/FilterTagEditor.vue'
import CaretIcon from '@/components/icons/CaretIcon.vue'
import { formatAnimeFormatLabel } from '@/lib/format-label'
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
  mode: 'global' | 'category'
  metadata: AniListMetadata | null
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
  disabledFields?: FilterDisabledReasons
}>()

const model = defineModel<FilterState>({ required: true })

const staticCountryOptions = ['CN', 'JP', 'KR', 'TW']
const countryDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' })

const createEnumOptions = (values: readonly string[]): FilterOption[] =>
  values.map((value) => ({
    value,
    label: formatAnimeFormatLabel(value),
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
  mergedOptions(staticCountryOptions, model.value.countryOfOrigin ? [model.value.countryOfOrigin] : []).map((option) => ({
    ...option,
    label: countryDisplayNames.of(option.value) ?? option.value,
  })),
)

const genreOptions = computed(() => mergedOptions(props.metadata?.genres ?? [], model.value.genres))

const seasonValue = computed(() => model.value.seasons[0] ?? '')
const countryOfOriginModel = computed({
  get: () => model.value.countryOfOrigin,
  set: (value: string | undefined) => updateFilter({ countryOfOrigin: value }),
})
const sourceValue = computed({
  get: () => model.value.source[0] ?? undefined,
  set: (value: string | undefined) => updateSingleSelect('source', value),
})
const genresModel = computed({
  get: () => model.value.genres,
  set: (value: string[]) => updateFilter({ genres: value }),
})
const formatsModel = computed({
  get: () => model.value.formats,
  set: (value: string[]) => updateFilter({ formats: value as AnimeFormat[] }),
})
const tagNamesModel = computed({
  get: () => model.value.tags,
  set: (value: string[]) => updateFilter({ tags: value }),
})
const sortModel = computed<FilterSort | undefined>({
  get: () => model.value.sort,
  set: (value) => updateFilter({ sort: value }),
})

const updateFilter = (patch: Partial<FilterState>) => {
  model.value = {
    ...model.value,
    ...patch,
  }
}

const updateRange = (
  field: 'yearRange' | 'episodes' | 'duration' | 'popularity',
  bound: keyof NumericRange,
  rawValue: string,
) => {
  const trimmedValue = rawValue.trim()
  const parsedValue = trimmedValue.length === 0 ? undefined : Number.parseInt(trimmedValue, 10)
  const currentRange = model.value[field]
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

const updateSingleSelect = (field: 'seasons' | 'source', value: string | undefined) => {
  updateFilter({ [field]: value ? [value] : [] } as Pick<FilterState, 'seasons' | 'source'>)
}

const isSeasonSelected = (value: string) => seasonValue.value === value

const setSeason = (value: string) => {
  updateSingleSelect('seasons', isSeasonSelected(value) ? undefined : value)
}

const genreEmptyMessage = computed(() => {
  if (props.metadataStatus === 'loading' || props.metadataStatus === 'idle') {
    return 'More genres will appear here when available.'
  }

  if (props.metadataStatus === 'error') {
    return props.metadataError ?? 'We could not load more genres right now.'
  }

  return 'No genres available.'
})

const updateMinimumTagRank = (rawValue: string) => {
  const trimmedValue = rawValue.trim()
  const parsedValue = trimmedValue.length === 0 ? undefined : Number.parseInt(trimmedValue, 10)

  model.value.minimumTagRank = Number.isFinite(parsedValue) ? parsedValue : undefined
}

</script>

<template>
  <div class="grid gap-5 lg:grid-cols-2">
    <FilterField
      label="Release year"
      description="Limit results to a release year range."
      :disabled-reason="disabledFields?.yearRange"
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <input
          type="number"
          class="shell-input"
          :disabled="Boolean(disabledFields?.yearRange)"
          :value="model.yearRange?.minimum ?? ''"
          placeholder="Minimum year"
          @input="updateRange('yearRange', 'minimum', ($event.target as HTMLInputElement).value)"
        >
        <input
          type="number"
          class="shell-input"
          :disabled="Boolean(disabledFields?.yearRange)"
          :value="model.yearRange?.maximum ?? ''"
          placeholder="Maximum year"
          @input="updateRange('yearRange', 'maximum', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </FilterField>

    <FilterField
      label="Season"
      description="Choose one season to focus on."
      :disabled-reason="disabledFields?.seasons"
    >
      <div class="flex flex-wrap gap-2">
        <button
          v-for="option in seasonOptions"
          :key="option.value"
          type="button"
          class="shell-button"
          :class="isSeasonSelected(option.value) ? 'shell-button-active' : ''"
          :disabled="Boolean(disabledFields?.seasons)"
          :aria-pressed="isSeasonSelected(option.value)"
          :aria-label="`Use ${option.label} season`"
          @click="setSeason(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </FilterField>

    <FilterMultiSelectField
      v-model="formatsModel"
      label="Formats"
      description="Choose the release formats you want included."
      :options="formatOptions"
      :disabled-reason="disabledFields?.formats"
    />

    <FilterSingleComboboxField
      v-model="sourceValue"
      label="Source material"
      description="Pick the type of source it was adapted from."
      :options="sourceOptions"
      placeholder="Choose a source type"
      clear-label="Clear source material"
      :disabled-reason="disabledFields?.source"
    />

    <FilterMultiComboboxField
      v-model="genresModel"
      label="Genres"
      description="Pick one or more genres you want to see."
      :options="genreOptions"
      :empty-message="genreEmptyMessage"
      clear-label="Clear genres"
      placeholder="Search or select genres"
      :disabled-reason="disabledFields?.genres"
    />

    <FilterTagEditor
      v-model="tagNamesModel"
      :metadata-tags="metadata?.tags ?? []"
      :metadata-status="metadataStatus"
      :metadata-error="metadataError"
      :disabled-reason="disabledFields?.tags"
    />

    <details class="group lg:col-span-2 rounded-[1.5rem] border border-app-border/70 bg-app-bg/50 p-4">
      <summary class="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-app-text">
        <CaretIcon class="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-90" />
        <span>Advanced filters</span>
      </summary>

      <div class="mt-4 grid gap-5 lg:grid-cols-2">
        <FilterSortEditor
          v-model="sortModel"
          label="Sort"
          :description="mode === 'global' ? 'Choose how results should be ordered by default.' : 'Choose how this category should be ordered.'"
          :inherit-label="mode === 'category' ? 'Use template order' : 'No sort set'"
        />

        <FilterSingleComboboxField
          v-model="countryOfOriginModel"
          label="Country of origin"
          description="Pick the country where the anime was made."
          :options="countryOptions"
          placeholder="Choose a country of origin"
          clear-label="Clear country of origin"
          :disabled-reason="disabledFields?.countryOfOrigin"
        />

        <FilterField
          label="Popularity"
          description="Limit results to a popularity range."
          :disabled-reason="disabledFields?.popularity"
        >
          <div class="grid gap-3 sm:grid-cols-2">
            <input
              type="number"
              class="shell-input"
              :disabled="Boolean(disabledFields?.popularity)"
              :value="model.popularity?.minimum ?? ''"
              placeholder="Minimum popularity"
              @input="updateRange('popularity', 'minimum', ($event.target as HTMLInputElement).value)"
            >
            <input
              type="number"
              class="shell-input"
              :disabled="Boolean(disabledFields?.popularity)"
              :value="model.popularity?.maximum ?? ''"
              placeholder="Maximum popularity"
              @input="updateRange('popularity', 'maximum', ($event.target as HTMLInputElement).value)"
            >
          </div>
        </FilterField>

        <FilterField
          label="Minimum tag rank"
          description="Only match tags at or above this rank. Range: 1-100."
          :disabled-reason="disabledFields?.minimumTagRank"
        >
          <input
            type="number"
            min="0"
            max="100"
            class="shell-input"
            :disabled="Boolean(disabledFields?.minimumTagRank)"
            :value="model.minimumTagRank ?? 60"
            placeholder="Minimum tag rank"
            @input="updateMinimumTagRank(($event.target as HTMLInputElement).value)"
          >
        </FilterField>

        <FilterField
          label="Episode count"
          description="Limit results to a range of episode counts."
          :disabled-reason="disabledFields?.episodes"
        >
          <div class="grid gap-3 sm:grid-cols-2">
            <input
              type="number"
              class="shell-input"
              :disabled="Boolean(disabledFields?.episodes)"
              :value="model.episodes?.minimum ?? ''"
              placeholder="Minimum episodes"
              @input="updateRange('episodes', 'minimum', ($event.target as HTMLInputElement).value)"
            >
            <input
              type="number"
              class="shell-input"
              :disabled="Boolean(disabledFields?.episodes)"
              :value="model.episodes?.maximum ?? ''"
              placeholder="Maximum episodes"
              @input="updateRange('episodes', 'maximum', ($event.target as HTMLInputElement).value)"
            >
          </div>
        </FilterField>

        <FilterField
          label="Duration"
          description="Limit results to a range of durations in minutes."
          :disabled-reason="disabledFields?.duration"
        >
          <div class="grid gap-3 sm:grid-cols-2">
            <input
              type="number"
              class="shell-input"
              :disabled="Boolean(disabledFields?.duration)"
              :value="model.duration?.minimum ?? ''"
              placeholder="Minimum minutes"
              @input="updateRange('duration', 'minimum', ($event.target as HTMLInputElement).value)"
            >
            <input
              type="number"
              class="shell-input"
              :disabled="Boolean(disabledFields?.duration)"
              :value="model.duration?.maximum ?? ''"
              placeholder="Maximum minutes"
              @input="updateRange('duration', 'maximum', ($event.target as HTMLInputElement).value)"
            >
          </div>
        </FilterField>
      </div>
    </details>
  </div>
</template>
