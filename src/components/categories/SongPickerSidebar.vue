<script setup lang="ts">
import { computed } from 'vue'

import {
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'

import type { AnimeThemesSong } from '@/api'
import CaretIcon from '@/components/icons/CaretIcon.vue'
import PlayIcon from '@/components/icons/PlayIcon.vue'
import { resolveAnimeTitle } from '@/lib/anime-title'
import { getSongSelectionKey, resolveSongTitle } from '@/lib/song-selection'
import type { AniListSearchResult, AnimeTitleLanguage, SongSelection } from '@/types'

const props = defineProps<{
  detailAnime: AniListSearchResult
  isCollapsed: boolean
  songs: AnimeThemesSong[]
  selectedSong?: SongSelection | null
  songFilterTypes: string[]
  songErrorMessage: string | null
  songStatus: 'idle' | 'loading' | 'ready' | 'error'
  titleLanguage: AnimeTitleLanguage
}>()

const emit = defineEmits<{
  clear: []
  collapseToggle: []
  previewSong: [song: AnimeThemesSong]
  retrySongs: []
  selectSong: [song: AnimeThemesSong]
}>()

const detailSongLabel = computed(() => {
  if (!props.selectedSong) {
    return null
  }

  return `${resolveSongTitle(props.selectedSong.song, props.titleLanguage).primary} by ${props.selectedSong.song.artist}`
})

const filteredSongs = computed(() => {
  if (props.songFilterTypes.length === 0) {
    return props.songs
  }

  return props.songs.filter((song) => props.songFilterTypes.includes(song.type))
})

const selectedSongKey = computed(() => props.selectedSong ? getSongSelectionKey(props.selectedSong) : null)
const detailPanelToggleLabel = computed(() => props.isCollapsed ? 'Show detail panel' : 'Hide detail panel')
const detailPanelToggleIconClass = computed(() => props.isCollapsed ? 'rotate-180' : '')
</script>

<template>
  <div class="absolute inset-y-0 right-0 z-20 flex w-[26rem] justify-end overflow-visible pointer-events-none">
    <button
      type="button"
      class="pointer-events-auto sticky top-4 z-30 mr-[-1.5rem] inline-flex h-10 w-10 items-center justify-center rounded-full border border-app-border/80 bg-app-surface text-app-text shadow-[0_14px_28px_rgba(15,23,42,0.24)] transition hover:border-app-accent/50"
      :aria-label="detailPanelToggleLabel"
      @click="emit('collapseToggle')"
    >
      <CaretIcon
        class="h-4 w-4 transition-transform duration-300"
        :class="detailPanelToggleIconClass"
      />
    </button>

    <aside
      class="pointer-events-auto h-full w-full rounded-[1.5rem] border border-app-border/70 bg-app-bg/95 p-4 shadow-[0_22px_50px_rgba(15,23,42,0.22)] backdrop-blur-sm transition-all duration-300 ease-out"
      :class="isCollapsed ? 'pointer-events-none translate-x-[calc(100%+1rem)] opacity-0' : 'translate-x-0 opacity-100'"
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
          <div class="grid shrink-0 grid-cols-[5rem_1fr] gap-4">
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
            </div>
            <p class="mt-2 text-sm leading-6 text-app-muted">
              {{ songFilterTypes.length > 0 ? `Showing ${songFilterTypes.join(', ')} themes.` : 'Showing all available theme types.' }}
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
                @click="emit('retrySongs')"
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
              class="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
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
                @click="emit('selectSong', song)"
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
                  @click.stop="emit('previewSong', song)"
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
</template>
