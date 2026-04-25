<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { normalizeAniListError, searchAnimeMedia } from '@/api'
import AnimePickerResultCard from '@/components/categories/AnimePickerResultCard.vue'
import PickerFilterSummary from '@/components/categories/PickerFilterSummary.vue'
import PickerResultsFrame from '@/components/categories/PickerResultsFrame.vue'
import PickerSearchToolbar from '@/components/categories/PickerSearchToolbar.vue'
import { useDebouncedValue } from '@/composables/useDebouncedValue'
import { mergeFilterStates } from '@/lib/filter-merge'
import { buildActiveFilterSummary } from '@/lib/filter-summary'
import { useAniListAuthStore } from '@/stores/anilist-auth'
import { usePickerFiltersStore } from '@/stores/picker-filters'
import type {
  AniListListVisibility,
  AniListSearchResponse,
  AniListSearchResult,
  Category,
  FilterSort,
  FilterState,
  FilterSortField,
} from '@/types'
import { filterSortFields, FilterSortDirection } from '@/types'

const pageSize = 15

const props = defineProps<{
  open: boolean
  category: Category
  globalFilter: FilterState
  focusedAnimeId: number | null
}>()

const emit = defineEmits<{
  selectAnime: [result: AniListSearchResult]
  clear: []
}>()

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
const canUseListFilters = computed(() => aniListAuthStore.isAuthenticated)
const hasResults = computed(() => (searchResponse.value?.results?.length ?? 0) > 0)
const listVisibility = computed(() => (canUseListFilters.value ? pickerFiltersStore.listVisibility : null))

const resetState = () => {
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

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    resetState()
    void loadResults('', 1)
    return
  }

  activeRequestId += 1
}, { immediate: true })

watch(debouncedSearch, (value, previousValue) => {
  if (!props.open || isResettingState.value || value === previousValue) {
    return
  }

  currentPage.value = 1
  void loadResults(value, 1)
})

watch(currentPage, (page, previousPage) => {
  if (!props.open || isResettingState.value || page === previousPage) {
    return
  }

  void loadResults(debouncedSearch.value, page)
})

watch(pickerSort, (value, previousValue) => {
  if (
    !props.open ||
    isResettingState.value ||
    (value?.field === previousValue?.field && value?.direction === previousValue?.direction)
  ) {
    return
  }

  currentPage.value = 1
  void loadResults(debouncedSearch.value, 1)
})
</script>

<template>
  <div class="min-h-0 flex-1 overflow-y-auto pr-1">
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
      @toggle-list-visibility="pickerFiltersStore.toggleListVisibility($event as AniListListVisibility)"
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
      <div class="relative min-h-[24rem] overflow-visible">
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AnimePickerResultCard
            v-for="result in searchResponse?.results ?? []"
            :key="result.id"
            :result="result"
            :is-selected="focusedAnimeId === result.id"
            :show-clear-button="false"
            @select="emit('selectAnime', result)"
            @clear="emit('clear')"
          />
        </div>
      </div>
    </PickerResultsFrame>
  </div>
</template>
