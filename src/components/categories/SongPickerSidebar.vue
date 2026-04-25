<script setup lang="ts">
import { computed, ref, watch } from 'vue'

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
import { sanitizeAnimeDescriptionHtml } from '@/lib/anime-description'
import { resolveAnimeTitle } from '@/lib/anime-title'
import { formatAnimeFormatLabel } from '@/lib/format-label'
import { formatSongEpisodesHint, getSongSelectionKey, resolveSongTitle } from '@/lib/song-selection'
import { useSettingsStore } from '@/stores/settings'
import type { AniListSearchResult, SongSelection, ThemeType } from '@/types'

const props = defineProps<{
  detailAnime: AniListSearchResult
  songs: AnimeThemesSong[]
  selectedSong?: SongSelection | null
  songFilterTypes: ThemeType[]
  songErrorMessage: string | null
  songStatus: 'idle' | 'loading' | 'ready' | 'error'
}>()

const emit = defineEmits<{
  clear: []
  previewSong: [song: AnimeThemesSong]
  retrySongs: []
  selectSong: [song: AnimeThemesSong]
}>()

const isCollapsed = ref(!props.detailAnime.id)
watch(
  () => props.detailAnime.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      isCollapsed.value = false
    }
  },
)

const filteredSongs = computed(() => {
  if (props.songFilterTypes.length === 0) {
    return props.songs
  }

  return props.songs.filter((song) => props.songFilterTypes.includes(song.type))
})

const settingsStore = useSettingsStore()
const selectedSongKey = computed(() => props.selectedSong ? getSongSelectionKey(props.selectedSong) : null)
const detailPanelToggleLabel = computed(() => isCollapsed.value ? 'Show detail panel' : 'Hide detail panel')
const detailPanelToggleIconClass = computed(() => isCollapsed.value ? 'rotate-180' : '')
</script>

<template>
  <div
    class="flex overflow-hidden transition-[width] duration-300 ease-out"
    :class="isCollapsed ? 'w-[2rem]' : 'w-[28rem]'"
  >
    <div class="flex w-[28rem] overflow-hidden transition-[width] duration-300 ease-out">
      <button
        type="button"
        class="z-30 inline-flex w-[2rem] shrink-0 items-center justify-center bg-app-surface text-app-text hover:bg-app-accent/10"
        :aria-label="detailPanelToggleLabel"
        @click="isCollapsed = !isCollapsed"
      >
        <CaretIcon
          class="h-4 w-4 transition-transform duration-300"
          :class="detailPanelToggleIconClass"
        />
      </button>

      <aside class="flex h-full w-[26rem] min-w-[26rem] flex-col gap-4 overflow-hidden rounded-[1.25rem] border border-app-border/70 bg-app-bg/95 p-4 backdrop-blur-sm">
        <div class="grid shrink-0 grid-cols-[5rem_1fr] gap-4 p-4 border-app-border/70 bg-app-surface/70 rounded-[1rem] border">
          <img
            :src="detailAnime.coverImage.large"
            :alt="resolveAnimeTitle(detailAnime.title, settingsStore.titleLanguage)"
            class="h-28 w-20 rounded-xl border border-app-border/70 object-cover"
          >

          <div class="min-w-0 space-y-2">
            <p class="min-w-0 break-words text-base font-semibold text-app-text">
              {{ resolveAnimeTitle(detailAnime.title, settingsStore.titleLanguage) }}
            </p>

            <p class="text-sm text-app-muted">
              {{ detailAnime.seasonYear ?? 'Unknown year' }}
              <span v-if="detailAnime.format"> · {{ formatAnimeFormatLabel(detailAnime.format) }}</span>
            </p>

            <p
              v-if="detailAnime.description"
              class="line-clamp-3 text-sm leading-6 text-app-muted"
            >
              <!-- eslint-disable vue/no-v-html -->
              <span v-html="sanitizeAnimeDescriptionHtml(detailAnime.description)" />
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
          <!-- TODO fix overflow-y-auto -->
          <div
            v-else
            class="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
          >
            <div
              v-for="song in filteredSongs"
              :key="`${detailAnime.id}:${song.id}`"
              role="button"
              tabindex="0"
              class="flex w-full items-start justify-between gap-3 rounded-[1rem] border px-3 py-3 text-left transition"
              :class="selectedSongKey === `${detailAnime.id}:${song.id}` ? 'border-app-accent bg-app-accent/10' : 'border-app-border/70 bg-app-surface/70 hover:border-app-accent/40'"
              :aria-pressed="selectedSongKey === `${detailAnime.id}:${song.id}`"
              @click="emit('selectSong', song)"
              @keydown.enter.prevent="emit('selectSong', song)"
              @keydown.space.prevent="emit('selectSong', song)"
            >
              <div class="min-w-0">
                <TooltipRoot v-if="resolveSongTitle(song, settingsStore.titleLanguage).tooltip">
                  <TooltipTrigger as-child>
                    <p class="break-words font-medium text-app-text decoration-dashed underline decoration-app-border underline-offset-4">
                      {{ resolveSongTitle(song, settingsStore.titleLanguage).primary }}
                    </p>
                  </TooltipTrigger>
                  <TooltipPortal>
                    <TooltipContent
                      class="z-[60] rounded-2xl border border-app-border/80 bg-app-surface px-3 py-2 text-xs leading-5 text-app-text shadow-shell"
                      :side-offset="8"
                    >
                      {{ resolveSongTitle(song, settingsStore.titleLanguage).tooltip }}
                      <TooltipArrow class="fill-app-surface" />
                    </TooltipContent>
                  </TooltipPortal>
                </TooltipRoot>
                <p
                  v-else
                  class="break-words font-medium text-app-text"
                >
                  {{ resolveSongTitle(song, settingsStore.titleLanguage).primary }}
                </p>
                <p
                  v-if="song.artist.trim()"
                  class="mt-1 text-sm text-app-muted"
                >
                  by {{ song.artist.trim() }}
                </p>
                <p class="mt-1 text-xs leading-5 text-app-muted">
                  {{ song.slug }}<span v-if="formatSongEpisodesHint(song.episodes)"> ({{ formatSongEpisodesHint(song.episodes) }})</span>
                </p>
              </div>

              <button
                v-if="song.videoLink"
                type="button"
                class="shell-button inline-flex h-10 w-10 shrink-0 items-center justify-center p-0"
                :aria-label="`Preview ${resolveSongTitle(song, settingsStore.titleLanguage).primary}`"
                @click.stop="emit('previewSong', song)"
              >
                <PlayIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
