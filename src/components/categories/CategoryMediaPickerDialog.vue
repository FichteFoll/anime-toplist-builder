<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTrigger,
} from 'reka-ui'
import { computed, ref, watch } from 'vue'

import { normalizeAniListError, searchAnimeMedia } from '@/api'
import AnimePickerResultCard from '@/components/categories/AnimePickerResultCard.vue'
import PickerDialogHeader from '@/components/categories/PickerDialogHeader.vue'
import PickerFilterSummary from '@/components/categories/PickerFilterSummary.vue'
import PickerResultsFrame from '@/components/categories/PickerResultsFrame.vue'
import PickerSearchToolbar from '@/components/categories/PickerSearchToolbar.vue'
import { useDebouncedValue } from '@/composables/useDebouncedValue'
import { mergeFilterStates } from '@/lib/filter-merge'
import { buildActiveFilterSummary } from '@/lib/filter-summary'
import { createAnimeSelection } from '@/lib/song-selection'
import { useAniListAuthStore } from '@/stores/anilist-auth'
import { usePickerFiltersStore } from '@/stores/picker-filters'
import {
  AniListListVisibility,
  filterSortFields,
  type AniListSearchResponse,
  type AniListSearchResult,
  type AnimeSelection,
  type AnimeTitleLanguage,
  type Category,
  type FilterSort,
  FilterSortDirection,
  type FilterSortField,
  type FilterState,
} from '@/types'

const pageSize = 15
const props = defineProps<{
  category: Category
  globalFilter: FilterState
  selectedMediaId?: number | null
  titleLanguage: AnimeTitleLanguage
}>()

const emit = defineEmits<{
  select: [selection: AnimeSelection]
  clear: []
}>()

const open = ref(false)
const searchDraft = ref('')
const currentPage = ref(1)
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const errorMessage = ref<string | null>(null)
const searchResponse = ref<AniListSearchResponse | null>(null)
const localSortField = ref<FilterSortField | ''>('')
const localSortDirection = ref<FilterSortDirection>(FilterSortDirection.Desc)
const debouncedSearch = useDebouncedValue(searchDraft, 250)
const isResettingState = ref(false)
const aniListAuthStore = useAniListAuthStore()
const pickerFiltersStore = usePickerFiltersStore()

let activeRequestId = 0

const sortFieldOptions = filterSortFields.map((field) => ({
  value: field,
  label: field.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
}))

const currentCategorySort = computed(() => props.category.filter.sort)
const templateSortFieldLabel = computed(() => {
  const templateSort = props.globalFilter.sort

  if (!templateSort) {
    return 'AniList default order'
  }

  return templateSort.field.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
})

const activeFilterSummary = computed(() => {
  const { filter } = mergeFilterStates(props.globalFilter, props.category.filter)
  return buildActiveFilterSummary(filter)
})

const sortFieldPlaceholderLabel = computed(() => `Template: ${templateSortFieldLabel.value}`)
const pickerSort = computed<FilterSort | undefined>(() => {
  if (!localSortField.value) {
    return undefined
  }

  return {
    field: localSortField.value,
    direction: localSortDirection.value,
  }
})

const totalResults = computed(() => searchResponse.value?.pageInfo.total ?? 0)
const hasResults = computed(() => (searchResponse.value?.results.length ?? 0) > 0)
const canUseListFilters = computed(() => aniListAuthStore.isAuthenticated)
const listVisibility = computed(() => (canUseListFilters.value ? pickerFiltersStore.listVisibility : null))

const resetSearchState = () => {
  isResettingState.value = true
  searchDraft.value = ''
  currentPage.value = 1
  errorMessage.value = null
  searchResponse.value = null
  status.value = 'idle'
  localSortField.value = currentCategorySort.value?.field ?? ''
  localSortDirection.value = currentCategorySort.value?.direction ?? FilterSortDirection.Desc
  isResettingState.value = false
}

const createSelection = (result: AniListSearchResult): AnimeSelection =>
  createAnimeSelection({
    mediaId: result.id,
    title: result.title,
    coverImage: result.coverImage,
    season: result.season ?? null,
    seasonYear: result.seasonYear ?? null,
    format: result.format ?? null,
  })

const loadResults = async (searchTerm: string, page: number) => {
  const requestId = ++activeRequestId

  status.value = 'loading'
  errorMessage.value = null

  try {
    const accessToken = aniListAuthStore.resolveAccessTokenForRequest()
    const response = await searchAnimeMedia({
      globalFilter: props.globalFilter,
      categoryFilter: {
        ...props.category.filter,
        sort: pickerSort.value,
      },
      listVisibility: listVisibility.value,
      search: searchTerm,
      page,
      perPage: pageSize,
      accessToken,
    })

    if (requestId !== activeRequestId) {
      return
    }

    searchResponse.value = response
    status.value = 'ready'
  } catch (error) {
    if (requestId !== activeRequestId) {
      return
    }

    if (aniListAuthStore.handleRequestAuthFailure(error)) {
      void loadResults(searchTerm, page)
      return
    }

    status.value = 'error'
    errorMessage.value = normalizeAniListError(error).message
  }
}

const openPicker = () => {
  resetSearchState()
  void loadResults('', 1)
}

const selectResult = (result: AniListSearchResult) => {
  emit('select', createSelection(result))
  open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) {
    openPicker()
    return
  }

  activeRequestId += 1
})

watch(debouncedSearch, (value, previousValue) => {
  if (!open.value || isResettingState.value || value === previousValue) {
    return
  }

  currentPage.value = 1
  void loadResults(value, 1)
})

watch(currentPage, (page, previousPage) => {
  if (!open.value || isResettingState.value || page === previousPage) {
    return
  }

  void loadResults(debouncedSearch.value, page)
})

watch(pickerSort, (value, previousValue) => {
  if (
    !open.value ||
    isResettingState.value ||
    (value?.field === previousValue?.field && value?.direction === previousValue?.direction)
  ) {
    return
  }

  currentPage.value = 1
  void loadResults(debouncedSearch.value, 1)
})

watch(listVisibility, (value, previousValue) => {
  if (!open.value || value === previousValue) {
    return
  }

  currentPage.value = 1
  void loadResults(debouncedSearch.value, 1)
})
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger as-child>
      <button
        type="button"
        class="shell-button shell-button-active"
        :aria-label="selectedMediaId ? `Replace selection for ${category.name}` : `Pick selection for ${category.name}`"
      >
        {{ selectedMediaId ? 'Replace' : 'Pick' }}
      </button>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(98vw,72rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell overflow-hidden">
        <PickerDialogHeader
          eyebrow="Anime picker"
          :title="category.name"
          :description="category.description"
        />

        <div class="min-h-0 flex-1 overflow-y-auto pr-1 pt-5">
          <PickerSearchToolbar
            v-model:search-draft="searchDraft"
            v-model:local-sort-field="localSortField"
            v-model:local-sort-direction="localSortDirection"
            :category-name="category.name"
            :sort-field-options="sortFieldOptions"
            :sort-field-placeholder-label="sortFieldPlaceholderLabel"
          />

          <PickerFilterSummary
            :active-filter-summary="activeFilterSummary"
            :can-use-list-filters="canUseListFilters"
            :only-on-list="pickerFiltersStore.onlyOnList"
            :hide-on-list="pickerFiltersStore.hideOnList"
            @toggle-list-visibility="pickerFiltersStore.toggleListVisibility($event)"
          />

          <PickerResultsFrame
            :total-results="totalResults"
            :current-page="searchResponse?.pageInfo.currentPage ?? currentPage"
            :last-page="searchResponse?.pageInfo.lastPage ?? 1"
            :has-next-page="searchResponse?.pageInfo.hasNextPage ?? false"
            :status="status"
            :has-results="hasResults"
            :error-message="errorMessage"
            empty-message="No anime matched the current effective filters and search term."
            @previous="currentPage -= 1"
            @next="currentPage += 1"
            @retry="loadResults(debouncedSearch, currentPage)"
          >
            <div
              v-if="searchResponse?.results?.length"
              class="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
            >
              <AnimePickerResultCard
                v-for="result in searchResponse.results"
                :key="result.id"
                :result="result"
                :title-language="titleLanguage"
                :is-selected="result.id === selectedMediaId"
                :show-clear-button="true"
                @select="selectResult"
                @clear="emit('clear')"
              />
            </div>
          </PickerResultsFrame>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
