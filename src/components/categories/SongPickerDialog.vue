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

import { fetchAniListMediaById, fetchAnimeSongs, normalizeAnimeThemesError, searchAnimeMedia, type AnimeThemesSong } from '@/api'
import AnimePickerResultCard from '@/components/categories/AnimePickerResultCard.vue'
import PickerDialogHeader from '@/components/categories/PickerDialogHeader.vue'
import PickerFilterSummary from '@/components/categories/PickerFilterSummary.vue'
import PickerResultsFrame from '@/components/categories/PickerResultsFrame.vue'
import PickerSearchToolbar from '@/components/categories/PickerSearchToolbar.vue'
import SongPreviewDialog from '@/components/categories/SongPreviewDialog.vue'
import CaretIcon from '@/components/icons/CaretIcon.vue'
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
import { resolveAnimeTitle } from '@/lib/anime-title'
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
const detailSongLabel = computed(() => {
  if (!props.selectedSong) {
    return null
  }

  return `${resolveSongTitle(props.selectedSong.song, props.titleLanguage).primary} by ${props.selectedSong.song.artist}`
})
const isDetailPanelOpen = computed(() => !isDetailCollapsed.value && detailAnime.value !== null)
const detailPanelToggleLabel = computed(() => isDetailCollapsed.value ? 'Show detail panel' : 'Hide detail panel')
const detailPanelToggleIconClass = computed(() => isDetailCollapsed.value ? 'rotate-180' : '')
const filteredSongs = computed(() => {
  const songs = focusedAnimeId.value ? songsByAnimeId.value[focusedAnimeId.value] ?? [] : []
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
  songsByAnimeId.value = {}
  hydratedSelectedAnime.value = createHydratedAnimePlaceholder()
  localSortField.value = currentCategorySort.value?.field ?? ''
  localSortDirection.value = currentCategorySort.value?.direction ?? 'desc'
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
      source: null,
      genres: [],
      tags: [],
      popularity: null,
      averageScore: null,
      countryOfOrigin: null,
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
  const title = `${resolveSongTitle(songSelection.song, props.titleLanguage).primary} by ${song.artist}`

  songPreview.value = {
    open: true,
    title,
    description: getSongContextLabel(songSelection, props.titleLanguage),
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
            :has-results="(searchResponse?.results?.length ?? 0) > 0"
            :error-message="errorMessage"
            empty-message="No anime matched the current effective filters and search term."
            @previous="currentPage -= 1"
            @next="currentPage += 1"
            @retry="loadResults(debouncedSearch, currentPage)"
          >
            <div class="relative min-h-[24rem] overflow-hidden">
              <div
                class="grid gap-3 md:grid-cols-2 xl:grid-cols-3 transition-[padding-right] duration-300 ease-out"
                :class="isDetailPanelOpen ? 'lg:pr-[28rem]' : 'lg:pr-0'"
              >
                <AnimePickerResultCard
                  v-for="result in searchResponse?.results ?? []"
                  :key="result.id"
                  :result="result"
                  :title-language="titleLanguage"
                  :is-selected="focusedAnimeId === result.id"
                  @select="loadSongsForAnime"
                  @clear="emit('clear')"
                />
              </div>

              <button
                v-if="detailAnime"
                type="button"
                class="absolute right-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-app-border/80 bg-app-surface text-app-text shadow-shell transition hover:border-app-accent/50"
                :aria-label="detailPanelToggleLabel"
                @click="isDetailCollapsed ? expandDetailPanel() : collapseDetailPanel()"
              >
                <CaretIcon
                  class="h-4 w-4 transition-transform duration-300"
                  :class="detailPanelToggleIconClass"
                />
              </button>

              <aside
                v-if="detailAnime"
                class="absolute right-0 top-0 z-20 h-full w-full max-w-[26rem] rounded-[1.5rem] border border-app-border/70 bg-app-bg/95 p-4 shadow-shell backdrop-blur-sm transition-all duration-300 ease-out"
                :class="isDetailCollapsed ? 'translate-x-[calc(100%+1rem)] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'"
              >
                <div class="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
                        Focused anime
                      </p>
                      <p class="mt-2 text-sm leading-6 text-app-muted">
                        {{ detailSongLabel ? detailSongLabel : 'Pick a song from the focused anime.' }}
                      </p>
                    </div>
                    <span class="h-10 w-10" />
                  </div>

                  <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.25rem] border border-app-border/70 bg-app-surface/70 p-4">
                    <div class="grid grid-cols-[5rem_1fr] gap-4 shrink-0">
                      <img
                        :src="detailAnime.coverImage.large"
                        :alt="resolveAnimeTitle(detailAnime.title, titleLanguage)"
                        class="h-28 w-20 rounded-xl border border-app-border/70 object-cover"
                      >

                      <div class="min-w-0 space-y-2">
                        <p class="min-w-0 break-words text-base font-semibold text-app-text">
                          {{ resolveAnimeTitle(detailAnime.title, titleLanguage) }}
                        </p>

                        <p class="text-sm text-app-muted">
                          {{ detailAnime.seasonYear ?? 'Unknown year' }}
                          <span v-if="detailAnime.format"> · {{ detailAnime.format }}</span>
                        </p>

                        <p
                          v-if="detailAnime.description"
                          class="line-clamp-3 text-sm leading-6 text-app-muted"
                        >
                          {{ detailAnime.description }}
                        </p>
                      </div>
                    </div>

                    <div class="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
                      <div class="flex items-center justify-between gap-3">
                        <p class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
                          Songs
                        </p>
                        <button
                          type="button"
                          class="shell-button"
                          @click="loadSongsForAnime(detailAnime)"
                        >
                          Reload
                        </button>
                      </div>
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
                          @click="loadSongsForAnime(detailAnime)"
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
                        class="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 space-y-2"
                      >
                        <div
                          v-if="detailSongLabel"
                          class="rounded-[1rem] border border-app-border/70 bg-app-bg/60 px-3 py-2 text-sm text-app-muted"
                        >
                          Selected: {{ detailSongLabel }}
                          <button
                            type="button"
                            class="ml-3 text-app-text underline decoration-dashed underline-offset-4"
                            @click="emit('clear')"
                          >
                            Unselect
                          </button>
                        </div>

                        <button
                          v-for="song in filteredSongs"
                          :key="`${detailAnime.id}:${song.id}`"
                          type="button"
                          class="flex w-full items-start justify-between gap-3 rounded-[1rem] border px-3 py-3 text-left transition"
                          :class="selectedSongKey === `${detailAnime.id}:${song.id}` ? 'border-app-accent bg-app-accent/10' : 'border-app-border/70 bg-app-surface/70 hover:border-app-accent/40'"
                          @click="selectSong(detailAnime, song)"
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
                            @click.stop="openPreview(detailAnime, song)"
                          >
                            <PlayIcon class="h-5 w-5" />
                          </button>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
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
      :video-height="songPreview.videoHeight"
    />
  </DialogRoot>
</template>
