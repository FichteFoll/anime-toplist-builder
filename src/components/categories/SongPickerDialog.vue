<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTrigger,
} from 'reka-ui'
import { computed, ref, watch } from 'vue'

import { fetchAniListMediaById, fetchAnimeSongs, normalizeAnimeThemesError, searchAnimeMedia, type AnimeThemesSong } from '@/api'
import AnimePickerResultCard from '@/components/categories/AnimePickerResultCard.vue'
import PickerDialogHeader from '@/components/categories/PickerDialogHeader.vue'
import PickerFilterSummary from '@/components/categories/PickerFilterSummary.vue'
import PickerResultsFrame from '@/components/categories/PickerResultsFrame.vue'
import PickerSearchToolbar from '@/components/categories/PickerSearchToolbar.vue'
import SongPreviewDialog from '@/components/categories/SongPreviewDialog.vue'
import SongPickerSidebar from '@/components/categories/SongPickerSidebar.vue'
import { useDebouncedValue } from '@/composables/useDebouncedValue'
import { loadCachedAnimeSongs, saveCachedAnimeSongs } from '@/lib/song-cache'
import { mergeFilterStates } from '@/lib/filter-merge'
import { buildActiveFilterSummary } from '@/lib/filter-summary'
import {
  createSongSelection,
  getSongContextLabel,
  resolveSongTitle,
} from '@/lib/song-selection'
import { useAniListAuthStore } from '@/stores/anilist-auth'
import { usePickerFiltersStore } from '@/stores/picker-filters'
import { useSettingsStore } from '@/stores/settings'
import {
  filterSortFields,
  type AniListSearchResponse,
  type AniListSearchResult,
  type Category,
  type FilterSort,
  FilterSortDirection,
  type FilterSortField,
  type FilterState,
  type SongSelection,
} from '@/types'

const pageSize = 15
const props = defineProps<{
  category: Category
  globalFilter: FilterState
  selectedSong?: SongSelection | null
}>()

const emit = defineEmits<{
  select: [selection: SongSelection]
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
const focusedAnimeId = ref<number | null>(null)
const isDetailCollapsed = ref(false)
const songStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const songErrorMessage = ref<string | null>(null)
const songPreview = ref<{ open: boolean, title: string, description: string, videoUrl: string, videoHeight: number | null }>({
  open: false,
  title: '',
  description: '',
  videoUrl: '',
  videoHeight: null,
})
const songsByAnimeId = ref<Record<number, AnimeThemesSong[]>>({})
const hydratedSelectedAnime = ref<AniListSearchResult | null>(null)
const debouncedSearch = useDebouncedValue(searchDraft, 250)
const isResettingState = ref(false)
const aniListAuthStore = useAniListAuthStore()
const pickerFiltersStore = usePickerFiltersStore()
const settingsStore = useSettingsStore()

let activeRequestId = 0
let activeSongRequestId = 0

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
const listVisibility = computed(() => (canUseListFilters.value ? pickerFiltersStore.listVisibility : null))
const detailAnime = computed(() =>
  searchResponse.value?.results.find((result) => result.id === focusedAnimeId.value)
    ?? hydratedSelectedAnime.value
    ?? null,
)
const focusedSongs = computed(() => (focusedAnimeId.value ? songsByAnimeId.value[focusedAnimeId.value] ?? [] : []))

const resetState = () => {
  isResettingState.value = true
  searchDraft.value = ''
  currentPage.value = 1
  errorMessage.value = null
  searchResponse.value = null
  status.value = 'idle'
  songStatus.value = 'idle'
  songErrorMessage.value = null
  songsByAnimeId.value = {}
  hydratedSelectedAnime.value = createHydratedAnimePlaceholder()
  localSortField.value = currentCategorySort.value?.field ?? ''
  localSortDirection.value = currentCategorySort.value?.direction ?? FilterSortDirection.Desc
  focusedAnimeId.value = props.selectedSong?.animeId ?? null
  isDetailCollapsed.value = !props.selectedSong
  isResettingState.value = false
}

const createHydratedAnimePlaceholder = () => props.selectedSong
    ? {
        id: props.selectedSong.animeId,
        title: props.selectedSong.animeTitle,
        coverImage: props.selectedSong.animeCoverImage,
        description: null,
        season: null,
        seasonYear: null,
        format: null,
        siteUrl: `https://anilist.co/anime/${props.selectedSong.animeId}`,
      }
    : null

const hydrateSelectedAnime = async () => {
  if (!props.selectedSong) {
    hydratedSelectedAnime.value = null
    return
  }

  const accessToken = aniListAuthStore.resolveAccessTokenForRequest()

  try {
    const result = await fetchAniListMediaById(props.selectedSong.animeId, accessToken)

    hydratedSelectedAnime.value = result ?? createHydratedAnimePlaceholder()
    focusedAnimeId.value = hydratedSelectedAnime.value?.id ?? props.selectedSong.animeId
    isDetailCollapsed.value = false
    if (hydratedSelectedAnime.value) {
      void loadSongsForAnime(hydratedSelectedAnime.value)
    }
  } catch (error) {
    aniListAuthStore.handleRequestAuthFailure(error)

    hydratedSelectedAnime.value = createHydratedAnimePlaceholder()
    focusedAnimeId.value = props.selectedSong.animeId
    isDetailCollapsed.value = false
    if (hydratedSelectedAnime.value) {
      void loadSongsForAnime(hydratedSelectedAnime.value)
    }
  }
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
    errorMessage.value = normalizeAnimeThemesError(error).message
  }
}

const loadSongsForAnime = async (result: AniListSearchResult) => {
  focusedAnimeId.value = result.id
  isDetailCollapsed.value = false
  songErrorMessage.value = null

  const cached = loadCachedAnimeSongs(result.id)

  if (cached) {
    songsByAnimeId.value = {
      ...songsByAnimeId.value,
      [result.id]: cached.songs,
    }
    songStatus.value = 'ready'
    return
  }

  const requestId = ++activeSongRequestId
  songStatus.value = 'loading'

  try {
    const response = await fetchAnimeSongs({
      animeId: result.id,
      animeTitle: result.title,
      animeCoverImage: result.coverImage,
    })

    if (requestId !== activeSongRequestId) {
      return
    }

    songsByAnimeId.value = {
      ...songsByAnimeId.value,
      [result.id]: response.songs,
    }
    saveCachedAnimeSongs(response)
    songStatus.value = 'ready'
  } catch (error) {
    if (requestId !== activeSongRequestId) {
      return
    }

    songStatus.value = 'error'
    songErrorMessage.value = normalizeAnimeThemesError(error).message
  }
}

const collapseDetailPanel = () => {
  isDetailCollapsed.value = true
}

const expandDetailPanel = () => {
  if (detailAnime.value) {
    isDetailCollapsed.value = false
  }
}

const selectSong = (result: AniListSearchResult, song: AnimeThemesSong) => {
  emit('select', createSongSelection({
    animeId: result.id,
    animeTitle: result.title,
    animeCoverImage: result.coverImage,
    song,
  }))
  open.value = false
}

const openPreview = (result: AniListSearchResult, song: AnimeThemesSong) => {
  if (!song.videoLink) {
    return
  }

  const songSelection = createSongSelection({
    animeId: result.id,
    animeTitle: result.title,
    animeCoverImage: result.coverImage,
    song,
  })
  const title = `${resolveSongTitle(songSelection.song, settingsStore.titleLanguage).primary} by ${song.artist}`

  songPreview.value = {
    open: true,
    title,
    description: getSongContextLabel(songSelection, settingsStore.titleLanguage),
    videoUrl: song.videoLink,
    videoHeight: song.videoHeight ?? null,
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    resetState()
    void loadResults('', 1)
    void hydrateSelectedAnime()
    return
  }

  activeRequestId += 1
  activeSongRequestId += 1
  songPreview.value.open = false
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
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger as-child>
      <button
        type="button"
        class="shell-button shell-button-active"
        :aria-label="selectedSong ? `Replace song selection for ${category.name}` : `Pick song selection for ${category.name}`"
      >
        {{ selectedSong ? 'Replace' : 'Pick' }}
      </button>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(98vw,78rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell overflow-hidden">
        <PickerDialogHeader
          eyebrow="Song picker"
          :title="category.name"
          :description="category.description"
        />

        <div class="mt-5 flex min-h-0 flex-1 overflow-hidden">
          <div class="min-w-0 flex-1 overflow-y-auto pr-1">
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
              :has-results="(searchResponse?.results?.length ?? 0) > 0"
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
                    @select="loadSongsForAnime"
                    @clear="emit('clear')"
                  />
                </div>
              </div>
            </PickerResultsFrame>
          </div>

          <SongPickerSidebar
            v-if="detailAnime"
            :detail-anime="detailAnime"
            :songs="focusedSongs"
            :is-collapsed="isDetailCollapsed"
            :song-error-message="songErrorMessage"
            :song-status="songStatus"
            :selected-song="selectedSong"
            :song-filter-types="category.songFilter.types"
            @clear="emit('clear')"
            @collapse-toggle="isDetailCollapsed ? expandDetailPanel() : collapseDetailPanel()"
            @preview-song="openPreview(detailAnime, $event)"
            @retry-songs="loadSongsForAnime(detailAnime)"
            @select-song="selectSong(detailAnime, $event)"
          />
        </div>
      </DialogContent>
    </DialogPortal>

    <SongPreviewDialog
      v-model:open="songPreview.open"
      :title="songPreview.title"
      :description="songPreview.description"
      :video-url="songPreview.videoUrl"
      :video-height="songPreview.videoHeight"
    />
  </DialogRoot>
</template>
