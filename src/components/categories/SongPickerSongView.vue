<script setup lang="ts">
import { computed } from 'vue'

import type { AnimeThemesSong } from '@/api'
import SongPickerSongList from '@/components/categories/SongPickerSongList.vue'
import { sanitizeAnimeDescriptionHtml } from '@/lib/anime-description'
import { resolveAnimeTitle } from '@/lib/anime-title'
import { formatAnimeFormatLabel } from '@/lib/format-label'
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

const settingsStore = useSettingsStore()
const filteredSongCount = computed(() => {
  if (props.songFilterTypes.length === 0) {
    return props.songs.length
  }

  return props.songs.filter((song) => props.songFilterTypes.includes(song.type)).length
})
const songFilterSummary = computed(() => props.songFilterTypes.length > 0
  ? `Showing ${props.songFilterTypes.join(', ')} themes.`
  : 'Showing all available theme types.')
</script>

<template>
  <section class="min-h-0 flex-1 overflow-y-auto flex flex-col gap-4">
    <div class="flex items-center justify-between gap-3">
      <p class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
        Select Song
      </p>

      <button
        v-if="selectedSong"
        type="button"
        class="shell-button"
        @click="emit('clear')"
      >
        Clear song
      </button>
    </div>

    <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div class="rounded-[1.25rem] border border-app-border/70 bg-app-surface/70 p-4">
        <div class="flex min-h-0 flex-col">
          <div class="flex gap-4">
            <img
              :src="detailAnime.coverImage.large"
              :alt="resolveAnimeTitle(detailAnime.title, settingsStore.titleLanguage)"
              class="h-28 w-20 shrink-0 rounded-xl border border-app-border/70 object-cover"
            >

            <div class="min-w-0 space-y-2">
              <p class="min-w-0 break-words text-base font-semibold text-app-text">
                {{ resolveAnimeTitle(detailAnime.title, settingsStore.titleLanguage) }}
              </p>

              <p class="text-sm text-app-muted">
                {{ detailAnime.seasonYear ?? 'Unknown year' }}
                <span v-if="detailAnime.format"> · {{ formatAnimeFormatLabel(detailAnime.format) }}</span>
              </p>
            </div>
          </div>

          <p
            v-if="detailAnime.description"
            class="mt-4 line-clamp-3 text-sm leading-6 text-app-muted lg:line-clamp-none"
          >
            <!-- eslint-disable vue/no-v-html -->
            <span v-html="sanitizeAnimeDescriptionHtml(detailAnime.description)" />
          </p>
        </div>
      </div>

      <div class="flex min-h-0 min-w-0 flex-col">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
              Songs
            </p>
            <p class="mt-2 text-sm leading-6 text-app-muted">
              {{ songFilterSummary }}
            </p>
          </div>

          <p
            v-if="songStatus === 'ready'"
            class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted"
          >
            {{ filteredSongCount }} result{{ filteredSongCount === 1 ? '' : 's' }}
          </p>
        </div>

        <div class="mt-4 min-h-0 flex-1 pr-1">
          <div
            v-if="songStatus === 'loading'"
            class="text-sm text-app-muted"
          >
            Loading songs...
          </div>
          <div
            v-else-if="songStatus === 'error'"
            class="space-y-3"
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
            v-else-if="songStatus === 'ready' && filteredSongCount === 0"
            class="text-sm leading-6 text-app-muted"
          >
            No songs matched the current theme filter.
          </div>
          <SongPickerSongList
            v-else
            :anime-id="detailAnime.id"
            :songs="songs"
            :selected-song="selectedSong"
            :song-filter-types="songFilterTypes"
            @preview-song="emit('previewSong', $event)"
            @select-song="emit('selectSong', $event)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
