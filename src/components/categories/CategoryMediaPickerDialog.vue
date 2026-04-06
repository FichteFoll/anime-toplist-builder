<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'
import { computed, ref, watch } from 'vue'

import { normalizeAniListError, searchAnimeMedia } from '@/api'
import { useDebouncedValue } from '@/composables/useDebouncedValue'
import { sanitizeAnimeDescriptionHtml } from '@/lib/anime-description'
import { mergeFilterStates } from '@/lib/filter-merge'
import { buildActiveFilterSummary } from '@/lib/filter-summary'
import { resolveAnimeTitle } from '@/lib/anime-title'
import ExternalLinkIcon from '@/components/icons/ExternalLinkIcon.vue'
import { useAniListAuthStore } from '@/stores/anilist-auth'
import { usePickerFiltersStore } from '@/stores/picker-filters'
import {
  filterSortFields,
  type AniListSearchResponse,
  type AniListSearchResult,
  type AnimeSelection,
  type AnimeTitleLanguage,
  type Category,
  type FilterSort,
  type FilterSortDirection,
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
}>()

const open = ref(false)
const searchDraft = ref('')
const currentPage = ref(1)
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const errorMessage = ref<string | null>(null)
const searchResponse = ref<AniListSearchResponse | null>(null)
const localSortField = ref<FilterSortField | ''>('')
const localSortDirection = ref<FilterSortDirection>('desc')
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
  localSortDirection.value = currentCategorySort.value?.direction ?? 'desc'
  isResettingState.value = false
}

const createSelection = (result: AniListSearchResult): AnimeSelection => ({
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

    const normalizedError = normalizeAniListError(error)

    status.value = 'error'
    errorMessage.value = normalizedError.message
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
        <div class="shrink-0 flex flex-col gap-5 border-b border-app-border/70 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
              Anime picker
            </p>
            <DialogTitle class="mt-3 text-xl font-semibold tracking-tight text-app-text">
              {{ category.name }}
            </DialogTitle>
            <DialogDescription
              v-if="category.description"
              class="mt-2 max-w-2xl text-sm leading-6 text-app-muted"
            >
              {{ category.description }}
            </DialogDescription>
          </div>

          <DialogClose as-child>
            <button
              type="button"
              class="shell-button self-start"
            >
              Close
            </button>
          </DialogClose>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto pr-1 pt-5">
          <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_auto] lg:items-end">
            <label class="space-y-2">
              <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
                Search title
              </span>
              <input
                v-model="searchDraft"
                type="search"
                inputmode="search"
                class="shell-input"
                placeholder="Type to search ..."
                :aria-label="`Search anime for ${category.name}`"
              >
            </label>

            <label class="space-y-2">
              <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
                Sort
              </span>
              <select
                v-model="localSortField"
                class="shell-input"
                :aria-label="`Sort search results for ${category.name}`"
              >
                <option value="">
                  {{ sortFieldPlaceholderLabel }}
                </option>
                <option
                  v-for="option in sortFieldOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>

            <div class="flex gap-2 lg:justify-end">
              <button
                type="button"
                class="shell-button"
                :class="localSortDirection === 'asc' ? 'shell-button-active' : ''"
                :disabled="!localSortField"
                aria-label="Use ascending sort order"
                @click="localSortDirection = 'asc'"
              >
                Asc
              </button>
              <button
                type="button"
                class="shell-button"
                :class="localSortDirection === 'desc' ? 'shell-button-active' : ''"
                :disabled="!localSortField"
                aria-label="Use descending sort order"
                @click="localSortDirection = 'desc'"
              >
                Desc
              </button>
            </div>
          </div>

          <div class="mt-4 rounded-[1.25rem] border border-app-border/70 bg-app-bg/35 px-4 py-3 text-sm text-app-muted">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div class="space-y-2">
                <p class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
                  Active filters
                </p>
                <div
                  v-if="activeFilterSummary.length > 0"
                  class="flex flex-wrap gap-2"
                >
                  <span
                    v-for="item in activeFilterSummary"
                    :key="item"
                    class="max-w-full rounded-full border border-app-border/70 bg-app-surface/80 px-3 py-1 leading-5"
                  >
                    {{ item }}
                  </span>
                </div>
                <p v-else>
                  No picker filters are active.
                </p>
              </div>

              <div
                v-if="canUseListFilters"
                class="flex flex-wrap gap-2 lg:justify-end"
              >
                <button
                  type="button"
                  class="rounded-full border px-3 py-1 text-xs font-medium transition"
                  :class="pickerFiltersStore.onlyOnList ? 'border-app-accent bg-app-accent/15 text-app-text' : 'border-app-border/70 bg-app-surface/80 text-app-muted hover:text-app-text'"
                  :aria-pressed="pickerFiltersStore.onlyOnList"
                  :aria-label="pickerFiltersStore.onlyOnList ? 'Turn off only my anime filter' : 'Show only my anime'"
                  @click="pickerFiltersStore.toggleListVisibility('only')"
                >
                  Only my anime
                </button>
                <button
                  type="button"
                  class="rounded-full border px-3 py-1 text-xs font-medium transition"
                  :class="pickerFiltersStore.hideOnList ? 'border-app-accent bg-app-accent/15 text-app-text' : 'border-app-border/70 bg-app-surface/80 text-app-muted hover:text-app-text'"
                  :aria-pressed="pickerFiltersStore.hideOnList"
                  :aria-label="pickerFiltersStore.hideOnList ? 'Turn off hide my anime filter' : 'Hide my anime'"
                  @click="pickerFiltersStore.toggleListVisibility('hide')"
                >
                  Hide my anime
                </button>
              </div>
            </div>
          </div>

          <div class="mt-3 flex items-center justify-between gap-3 rounded-[1.25rem] bg-app-bg/50 px-4 py-3 text-sm text-app-muted">
            <p>
              {{ totalResults > 0 ? `${totalResults} matches` : 'No total reported yet' }}
            </p>
            <p>
              {{ status === 'loading' ? 'Loading...' : `Page ${searchResponse?.pageInfo.currentPage ?? currentPage} · 15 per page` }}
            </p>
          </div>

          <div class="mt-4 flex items-center justify-between gap-3 text-sm text-app-muted">
            <p>
              Page {{ searchResponse?.pageInfo.currentPage ?? currentPage }} of {{ searchResponse?.pageInfo.lastPage ?? 1 }}
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="shell-button"
                :disabled="currentPage <= 1 || status === 'loading'"
                @click="currentPage -= 1"
              >
                Previous
              </button>
              <button
                type="button"
                class="shell-button"
                :disabled="!searchResponse?.pageInfo.hasNextPage || status === 'loading'"
                @click="currentPage += 1"
              >
                Next
              </button>
            </div>
          </div>

          <div class="mt-5 flex min-h-0 flex-1 flex-col rounded-[1.5rem] border border-app-border/70 bg-app-bg/40 p-4">
            <div
              v-if="status === 'loading' && !hasResults"
              class="grid min-h-[18rem] gap-3 overflow-y-auto md:grid-cols-2 xl:grid-cols-3"
            >
              <div
                v-for="index in 6"
                :key="index"
                class="grid grid-cols-[5rem_1fr] gap-4 rounded-[1.25rem] border border-app-border/60 bg-app-surface/80 p-3"
              >
                <div class="h-28 rounded-xl bg-app-elevated/70" />
                <div class="space-y-3 pt-1">
                  <div class="h-4 w-4/5 rounded-full bg-app-elevated/70" />
                  <div class="h-4 w-1/2 rounded-full bg-app-elevated/50" />
                  <div class="h-10 rounded-2xl bg-app-elevated/50" />
                </div>
              </div>
            </div>

            <div
              v-else-if="status === 'error'"
              class="flex min-h-[18rem] flex-1 flex-col items-center justify-center gap-4 overflow-y-auto text-center"
            >
              <p class="max-w-lg text-sm leading-6 text-app-muted">
                {{ errorMessage }}
              </p>
              <button
                type="button"
                class="shell-button"
                @click="loadResults(debouncedSearch, currentPage)"
              >
                Retry search
              </button>
            </div>

            <div
              v-else-if="status === 'ready' && !hasResults"
              class="flex min-h-[18rem] flex-1 items-center justify-center overflow-y-auto text-center"
            >
              <p class="max-w-lg text-sm leading-6 text-app-muted">
                No anime matched the current effective filters and search term.
              </p>
            </div>

            <div
              v-else
              class="min-h-[18rem] flex-1 overflow-y-auto pr-1"
            >
              <div
                v-if="searchResponse?.results?.length"
                class="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
              >
                <article
                  v-for="result in searchResponse?.results ?? []"
                  :key="result.id"
                  class="flex h-full flex-col rounded-[1.25rem] border bg-app-surface/85 p-3"
                  :class="result.id === selectedMediaId ? 'border-app-accent/80' : 'border-app-border/70'"
                >
                  <button
                    type="button"
                    class="flex flex-1 cursor-pointer flex-col gap-4 text-left"
                    :aria-label="`Select ${resolveAnimeTitle(result.title, titleLanguage)}`"
                    @click="selectResult(result)"
                  >
                    <div class="grid grid-cols-[5rem_1fr] gap-4">
                      <img
                        :src="result.coverImage.large"
                        :alt="resolveAnimeTitle(result.title, titleLanguage)"
                        class="h-28 w-20 rounded-xl border border-app-border/70 object-cover"
                      >

                      <div class="min-w-0 space-y-2">
                        <div class="flex flex-wrap items-center gap-2">
                          <p class="min-w-0 flex-1 break-words text-base font-semibold text-app-text">
                            {{ resolveAnimeTitle(result.title, titleLanguage) }}
                          </p>
                        </div>

                        <p class="text-sm text-app-muted">
                          {{ result.seasonYear ?? 'Unknown year' }}
                          <span v-if="result.format"> · {{ result.format }}</span>
                        </p>
                      </div>
                    </div>

                    <p class="line-clamp-3 text-sm leading-6 text-app-muted">
                      <span
                        v-if="result.description"
                        v-html="sanitizeAnimeDescriptionHtml(result.description)"
                      />
                      <span v-else>No synopsis available from AniList.</span>
                    </p>
                  </button>

                  <div class="mt-auto flex items-center justify-between gap-3 pt-4">
                    <a
                      :href="result.siteUrl"
                      target="_blank"
                      rel="noreferrer noopener"
                      class="inline-flex items-center gap-1 text-xs font-medium text-app-muted transition hover:text-app-text"
                    >
                      AniList
                      <ExternalLinkIcon class="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      class="shell-button"
                      :class="result.id === selectedMediaId ? 'shell-button-active' : ''"
                      @click="selectResult(result)"
                    >
                      {{ result.id === selectedMediaId ? 'Keep selected' : 'Select anime' }}
                    </button>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
