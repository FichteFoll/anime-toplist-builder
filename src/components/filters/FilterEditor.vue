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
  mode: 'global' | 'category'
  metadata: AniListMetadata | null
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
  disabledFields?: FilterDisabledReasons
}>()

const model = defineModel<FilterState>({ required: true })

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
  mergedOptions(staticCountryOptions, model.value.countryOfOrigin).map((option) => ({
    ...option,
    label: countryDisplayNames.of(option.value) ?? option.value,
  })),
)

const genreOptions = computed(() => mergedOptions(props.metadata?.genres ?? [], model.value.genres))

const seasonValue = computed(() => model.value.seasons[0] ?? '')
const sourceValue = computed(() => model.value.source[0] ?? '')
const countryOfOriginModel = computed({
  get: () => model.value.countryOfOrigin,
  set: (value: string[]) => updateFilter({ countryOfOrigin: value }),
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
  get: () => model.value.tags.map((tag) => tag.name),
  set: (value: string[]) => updateFilter({ tags: value.map((name) => ({ name })) }),
})
const sortModel = computed<FilterSort | undefined>({
  get: () => model.value.sort,
  set: (value) => setSort(value),
})

const sourceLabelByValue = new Map(sourceOptions.map((option) => [option.value, option.label]))

const updateFilter = (patch: Partial<FilterState>) => {
  model.value = {
    ...model.value,
    ...patch,
  }
}

const updateRange = (
  field: 'yearRange' | 'popularity',
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

const setSearch = (value: string) => {
  updateFilter({ search: value.trim() })
}

const setSort = (value: FilterSort | undefined) => {
  updateFilter({ sort: value })
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
        :value="model.search"
        placeholder="Search AniList titles"
        @input="setSearch(($event.target as HTMLInputElement).value)"
      >
    </FilterField>

    <FilterSortEditor
      v-model="sortModel"
      label="Sort"
      :description="mode === 'global' ? 'Default result ordering for the template.' : 'Adjust ordering for this category.'"
      :inherit-label="mode === 'category' ? 'Use template sort' : 'No explicit sort'"
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
      label="Popularity"
      description="Use popularity thresholds to narrow broad searches."
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
      label="Season"
      description="Choose a single airing season."
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

    <FilterMultiComboboxField
      v-model="countryOfOriginModel"
      label="Country of origin"
      description="Common anime-producing regions are always available."
      :options="countryOptions"
      placeholder="Search or select countries"
      :disabled-reason="disabledFields?.countryOfOrigin"
    />

    <FilterMultiComboboxField
      v-model="genresModel"
      label="Genres"
      description="Genre choices update automatically as more data becomes available."
      :options="genreOptions"
      :empty-message="genreEmptyMessage"
      placeholder="Search or select genres"
      :disabled-reason="disabledFields?.genres"
    />

    <FilterMultiSelectField
      v-model="formatsModel"
      label="Formats"
      description="Filter by anime release format."
      :options="formatOptions"
      :disabled-reason="disabledFields?.formats"
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
            :display-value="(value: string) => sourceLabelByValue.get(value) ?? ''"
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
        v-model="tagNamesModel"
        :metadata-tags="metadata?.tags ?? []"
        :metadata-status="metadataStatus"
        :metadata-error="metadataError"
        :disabled-reason="disabledFields?.tags"
      />
    </div>
  </div>
</template>
