<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTrigger,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'
import { computed, ref, watch } from 'vue'

import { fetchAnimeSongs, normalizeAnimeThemesError, searchAnimeMedia, type AnimeThemesSong } from '@/api'
import AnimePickerResultCard from '@/components/categories/AnimePickerResultCard.vue'
import PickerDialogHeader from '@/components/categories/PickerDialogHeader.vue'
import PickerFilterSummary from '@/components/categories/PickerFilterSummary.vue'
import PickerResultsFrame from '@/components/categories/PickerResultsFrame.vue'
import PickerSearchToolbar from '@/components/categories/PickerSearchToolbar.vue'
import SongPreviewDialog from '@/components/categories/SongPreviewDialog.vue'
import PlayIcon from '@/components/icons/PlayIcon.vue'
import { useDebouncedValue } from '@/composables/useDebouncedValue'
import { loadCachedAnimeSongs, saveCachedAnimeSongs } from '@/lib/song-cache'
import { mergeFilterStates } from '@/lib/filter-merge'
import { buildActiveFilterSummary } from '@/lib/filter-summary'
import {
  createSongSelection,
  getSongContextLabel,
  getSongSelectionKey,
  resolveSongTitle,
} from '@/lib/song-selection'
import { useAniListAuthStore } from '@/stores/anilist-auth'
import { usePickerFiltersStore } from '@/stores/picker-filters'
import {
  filterSortFields,
  type AniListSearchResponse,
  type AniListSearchResult,
  type AnimeTitleLanguage,
  type Category,
  type FilterSort,
  type FilterSortDirection,
  type FilterSortField,
  type FilterState,
  type SongSelection,
} from '@/types'

const pageSize = 15
const props = defineProps<{
  category: Category
  globalFilter: FilterState
  selectedSong?: SongSelection | null
  titleLanguage: AnimeTitleLanguage
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
const localSortDirection = ref<FilterSortDirection>('desc')
const expandedAnimeId = ref<number | null>(null)
const songStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const songErrorMessage = ref<string | null>(null)
const songPreview = ref<{ open: boolean, title: string, description: string, videoUrl: string }>({
  open: false,
  title: '',
  description: '',
  videoUrl: '',
})
const songsByAnimeId = ref<Record<number, AnimeThemesSong[]>>({})
const pinnedResult = ref<AniListSearchResult | null>(null)
const debouncedSearch = useDebouncedValue(searchDraft, 250)
const isResettingState = ref(false)
const aniListAuthStore = useAniListAuthStore()
const pickerFiltersStore = usePickerFiltersStore()

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
const combinedResults = computed(() => {
  const results = searchResponse.value?.results ?? []

  if (!pinnedResult.value || searchDraft.value || currentPage.value !== 1 || localSortField.value) {
    return results
  }

  const withoutPinned = results.filter((result) => result.id !== pinnedResult.value?.id)

  return [pinnedResult.value, ...withoutPinned]
})
const filteredSongs = computed(() => {
  const songs = expandedAnimeId.value ? songsByAnimeId.value[expandedAnimeId.value] ?? [] : []
  const allowedTypes = props.category.songFilter.types

  if (allowedTypes.length === 0) {
    return songs
  }

  return songs.filter((song) => allowedTypes.includes(song.type))
})
const selectedSongKey = computed(() =>
  props.selectedSong ? getSongSelectionKey(props.selectedSong) : null,
)

const resetState = () => {
  isResettingState.value = true
  searchDraft.value = ''
  currentPage.value = 1
  errorMessage.value = null
  searchResponse.value = null
  status.value = 'idle'
  songStatus.value = 'idle'
  songErrorMessage.value = null
  localSortField.value = currentCategorySort.value?.field ?? ''
  localSortDirection.value = currentCategorySort.value?.direction ?? 'desc'
  pinnedResult.value = props.selectedSong
    ? {
        id: props.selectedSong.animeId,
        title: props.selectedSong.animeTitle,
        coverImage: props.selectedSong.animeCoverImage,
        description: null,
        season: null,
        seasonYear: null,
        format: null,
        source: null,
        genres: [],
        tags: [],
        popularity: null,
        averageScore: null,
        countryOfOrigin: null,
        siteUrl: `https://anilist.co/anime/${props.selectedSong.animeId}`,
      }
    : null
  expandedAnimeId.value = props.selectedSong?.animeId ?? null
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
    if (pinnedResult.value) {
      const hydratedPinnedResult = response.results.find((result) => result.id === pinnedResult.value?.id)

      if (hydratedPinnedResult) {
        pinnedResult.value = hydratedPinnedResult
      }
    }
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
  expandedAnimeId.value = result.id
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
  const title = `${resolveSongTitle(songSelection.song, props.titleLanguage).primary} by ${song.artist}`

  songPreview.value = {
    open: true,
    title,
    description: getSongContextLabel(songSelection, props.titleLanguage),
    videoUrl: song.videoLink,
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    resetState()
    void loadResults('', 1)
    if (pinnedResult.value && expandedAnimeId.value === pinnedResult.value.id) {
      void loadSongsForAnime(pinnedResult.value)
    }
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

  pinnedResult.value = null
  currentPage.value = 1
  expandedAnimeId.value = null
  void loadResults(value, 1)
})

watch(currentPage, (page, previousPage) => {
  if (!open.value || isResettingState.value || page === previousPage) {
    return
  }

  pinnedResult.value = null
  expandedAnimeId.value = null
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

  pinnedResult.value = null
  currentPage.value = 1
  expandedAnimeId.value = null
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

        <div class="min-h-0 flex-1 overflow-y-auto pr-1 pt-5">
          <PickerSearchToolbar
            :category-name="category.name"
            :search-draft="searchDraft"
            :local-sort-field="localSortField"
            :local-sort-direction="localSortDirection"
            :sort-field-options="sortFieldOptions"
            :sort-field-placeholder-label="sortFieldPlaceholderLabel"
            @update:search-draft="searchDraft = $event"
            @update:local-sort-field="localSortField = $event"
            @update:local-sort-direction="localSortDirection = $event"
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
            :has-results="combinedResults.length > 0"
            :error-message="errorMessage"
            empty-message="No anime matched the current effective filters and search term."
            @previous="currentPage -= 1"
            @next="currentPage += 1"
            @retry="loadResults(debouncedSearch, currentPage)"
          >
            <div class="space-y-3">
              <article
                v-for="result in combinedResults"
                :key="result.id"
                class="rounded-[1.5rem] border border-app-border/70 bg-app-surface/85 p-3"
              >
                <div class="grid gap-3 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
                  <AnimePickerResultCard
                    :result="result"
                    :title-language="titleLanguage"
                    :is-selected="expandedAnimeId === result.id"
                    @select="loadSongsForAnime"
                    @clear="emit('clear')"
                  />

                  <div
                    v-if="expandedAnimeId === result.id"
                    class="rounded-[1.25rem] border border-app-border/70 bg-app-bg/35 p-4"
                  >
                    <p class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
                      Songs
                    </p>
                    <p class="mt-2 text-sm leading-6 text-app-muted">
                      {{ category.songFilter.types.length > 0 ? `Showing ${category.songFilter.types.join(', ')} themes.` : 'Showing all available theme types.' }}
                    </p>

                    <div
                      v-if="songStatus === 'loading'"
                      class="mt-4 text-sm text-app-muted"
                    >
                      Loading songs...
                    </div>
                    <div
                      v-else-if="songStatus === 'error'"
                      class="mt-4 space-y-3"
                    >
                      <p class="text-sm leading-6 text-app-muted">
                        {{ songErrorMessage }}
                      </p>
                      <button
                        type="button"
                        class="shell-button"
                        @click="loadSongsForAnime(result)"
                      >
                        Retry songs
                      </button>
                    </div>
                    <div
                      v-else-if="songStatus === 'ready' && filteredSongs.length === 0"
                      class="mt-4 text-sm leading-6 text-app-muted"
                    >
                      No results.
                    </div>
                    <div
                      v-else
                      class="mt-4 space-y-2"
                    >
                      <button
                        v-for="song in filteredSongs"
                        :key="`${result.id}:${song.id}`"
                        type="button"
                        class="flex w-full items-start justify-between gap-3 rounded-[1rem] border px-3 py-3 text-left transition"
                        :class="selectedSongKey === `${result.id}:${song.id}` ? 'border-app-accent bg-app-accent/10' : 'border-app-border/70 bg-app-surface/70 hover:border-app-accent/40'"
                        @click="selectSong(result, song)"
                      >
                        <div class="min-w-0">
                          <TooltipRoot v-if="resolveSongTitle(song, titleLanguage).tooltip">
                            <TooltipTrigger as-child>
                              <p class="break-words font-medium text-app-text decoration-dashed underline decoration-app-border underline-offset-4">
                                {{ resolveSongTitle(song, titleLanguage).primary }}
                              </p>
                            </TooltipTrigger>
                            <TooltipPortal>
                              <TooltipContent
                                class="z-[60] rounded-2xl border border-app-border/80 bg-app-surface px-3 py-2 text-xs leading-5 text-app-text shadow-shell"
                                :side-offset="8"
                              >
                                {{ resolveSongTitle(song, titleLanguage).tooltip }}
                                <TooltipArrow class="fill-app-surface" />
                              </TooltipContent>
                            </TooltipPortal>
                          </TooltipRoot>
                          <p
                            v-else
                            class="break-words font-medium text-app-text"
                          >
                            {{ resolveSongTitle(song, titleLanguage).primary }}
                          </p>
                          <p class="mt-1 text-sm text-app-muted">
                            by {{ song.artist }}
                          </p>
                          <p class="mt-1 text-xs leading-5 text-app-muted">
                            {{ song.slug }}<span v-if="song.episodes"> (ep {{ song.episodes }})</span>
                          </p>
                        </div>

                        <button
                          v-if="song.videoLink"
                          type="button"
                          class="shell-button inline-flex h-10 w-10 shrink-0 items-center justify-center p-0"
                          :aria-label="`Preview ${resolveSongTitle(song, titleLanguage).primary}`"
                          @click.stop="openPreview(result, song)"
                        >
                          <PlayIcon class="h-4 w-4" />
                        </button>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </PickerResultsFrame>
        </div>
      </DialogContent>
    </DialogPortal>

    <SongPreviewDialog
      v-model:open="songPreview.open"
      :title="songPreview.title"
      :description="songPreview.description"
      :video-url="songPreview.videoUrl"
    />
  </DialogRoot>
</template>
