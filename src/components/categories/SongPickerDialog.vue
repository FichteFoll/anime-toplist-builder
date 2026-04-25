<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTrigger,
} from 'reka-ui'
import { computed, ref, watch } from 'vue'

import { fetchAniListMediaById, fetchAnimeSongs, normalizeAnimeThemesError, type AnimeThemesSong } from '@/api'
import PickerDialogHeader from '@/components/categories/PickerDialogHeader.vue'
import SongPickerAnimeView from '@/components/categories/SongPickerAnimeView.vue'
import SongPreviewDialog from '@/components/categories/SongPreviewDialog.vue'
import SongPickerSongView from '@/components/categories/SongPickerSongView.vue'
import SongPickerStepper from '@/components/categories/SongPickerStepper.vue'
import { loadCachedAnimeSongs, saveCachedAnimeSongs } from '@/lib/song-cache'
import {
  createSongSelection,
  getSongContextLabel,
  resolveSongTitle,
} from '@/lib/song-selection'
import { useAniListAuthStore } from '@/stores/anilist-auth'
import { useSettingsStore } from '@/stores/settings'
import {
  type AniListSearchResult,
  type Category,
  type FilterState,
  type SongSelection,
} from '@/types'

type SongPickerView = 'anime' | 'song'

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
const activeView = ref<SongPickerView>('anime')
const focusedAnimeId = ref<number | null>(null)
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
const aniListAuthStore = useAniListAuthStore()
const settingsStore = useSettingsStore()

let activeSongRequestId = 0
const detailAnime = computed(() =>
  hydratedSelectedAnime.value?.id === focusedAnimeId.value
    ? hydratedSelectedAnime.value
    : null,
)
const hasSelectedAnime = computed(() => detailAnime.value !== null)
const canNavigateToSongView = computed(() => hasSelectedAnime.value)
const canOpenSongView = computed(() => canNavigateToSongView.value)
const isAnimeView = computed(() => activeView.value === 'anime')
const isSongView = computed(() => activeView.value === 'song')
const focusedSongs = computed(() => (focusedAnimeId.value ? songsByAnimeId.value[focusedAnimeId.value] ?? [] : []))

const resetState = () => {
  activeView.value = 'anime'
  songStatus.value = 'idle'
  songErrorMessage.value = null
  songsByAnimeId.value = {}
  hydratedSelectedAnime.value = createHydratedAnimePlaceholder()
  focusedAnimeId.value = props.selectedSong?.animeId ?? null
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
    if (hydratedSelectedAnime.value) {
      void loadSongsForAnime(hydratedSelectedAnime.value, { openSongView: false })
    }
  } catch (error) {
    aniListAuthStore.handleRequestAuthFailure(error)

    hydratedSelectedAnime.value = createHydratedAnimePlaceholder()
    focusedAnimeId.value = props.selectedSong.animeId
    if (hydratedSelectedAnime.value) {
      void loadSongsForAnime(hydratedSelectedAnime.value, { openSongView: false })
    }
  }
}

const loadSongsForAnime = async (result: AniListSearchResult, options?: { openSongView?: boolean }) => {
  const openSongView = options?.openSongView ?? true

  focusedAnimeId.value = result.id
  hydratedSelectedAnime.value = result
  if (openSongView) {
    setActiveView('song')
  }
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
  const songTitle = resolveSongTitle(songSelection.song, settingsStore.titleLanguage).primary;
  const artist = song.artist.trim()
  const title = artist ? `${songTitle} by ${artist}` : songTitle

  songPreview.value = {
    open: true,
    title,
    description: getSongContextLabel(songSelection, settingsStore.titleLanguage),
    videoUrl: song.videoLink,
    videoHeight: song.videoHeight ?? null,
  }
}

const setActiveView = (view: SongPickerView) => {
  if (view === 'song' && !canOpenSongView.value) {
    return
  }

  activeView.value = view
}

watch(open, (isOpen) => {
  if (isOpen) {
    resetState()
    void hydrateSelectedAnime()
    return
  }

  activeSongRequestId += 1
  songPreview.value.open = false
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
      <DialogContent class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(98vw,78rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell">
        <PickerDialogHeader
          eyebrow="Song picker"
          :title="category.name"
          :description="category.description"
        />

        <SongPickerStepper
          :active-view="activeView"
          :can-navigate-to-song-view="canNavigateToSongView"
          @update:active-view="setActiveView"
        />

        <div class="mt-5 flex min-h-0 flex-1">
          <SongPickerAnimeView
            v-show="isAnimeView"
            :open="open"
            :category="category"
            :global-filter="globalFilter"
            :focused-anime-id="focusedAnimeId"
            @select-anime="loadSongsForAnime"
            @clear="emit('clear')"
          />

          <SongPickerSongView
            v-if="detailAnime && isSongView"
            :detail-anime="detailAnime"
            :songs="focusedSongs"
            :song-error-message="songErrorMessage"
            :song-status="songStatus"
            :selected-song="selectedSong"
            :song-filter-types="category.songFilter.types"
            @clear="emit('clear')"
            @preview-song="openPreview(detailAnime, $event)"
            @retry-songs="loadSongsForAnime(detailAnime, { openSongView: false })"
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
