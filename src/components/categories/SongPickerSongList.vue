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
import PlayIcon from '@/components/icons/PlayIcon.vue'
import { formatSongEpisodesHint, getSongSelectionKey, resolveSongTitle } from '@/lib/song-selection'
import { useSettingsStore } from '@/stores/settings'
import type { SongSelection, ThemeType } from '@/types'

const props = defineProps<{
  animeId: number
  songs: AnimeThemesSong[]
  selectedSong?: SongSelection | null
  songFilterTypes: ThemeType[]
}>()

const emit = defineEmits<{
  previewSong: [song: AnimeThemesSong]
  selectSong: [song: AnimeThemesSong]
}>()

const settingsStore = useSettingsStore()
const selectedSongKey = computed(() => props.selectedSong ? getSongSelectionKey(props.selectedSong) : null)
const filteredSongs = computed(() => {
  if (props.songFilterTypes.length === 0) {
    return props.songs
  }

  return props.songs.filter((song) => props.songFilterTypes.includes(song.type))
})
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="song in filteredSongs"
      :key="`${animeId}:${song.id}`"
      role="button"
      tabindex="0"
      class="grid w-full grid-cols-[2.5rem_1fr] items-start gap-3 rounded-[1rem] border px-3 py-3 text-left transition"
      :class="selectedSongKey === `${animeId}:${song.id}` ? 'border-app-accent bg-app-accent/10' : 'border-app-border/70 bg-app-surface/70 hover:border-app-accent/40'"
      :aria-pressed="selectedSongKey === `${animeId}:${song.id}`"
      @click="emit('selectSong', song)"
      @keydown.enter.prevent="emit('selectSong', song)"
      @keydown.space.prevent="emit('selectSong', song)"
    >
      <button
        v-if="song.videoLink"
        type="button"
        class="shell-button inline-flex h-10 w-10 shrink-0 items-center justify-center self-start p-0"
        :aria-label="`Preview ${resolveSongTitle(song, settingsStore.titleLanguage).primary}`"
        @click.stop="emit('previewSong', song)"
      >
        <PlayIcon class="h-5 w-5" />
      </button>
      <div
        v-else
        aria-hidden="true"
        class="h-10 w-10 shrink-0"
      />

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
    </div>
  </div>
</template>
