<script setup lang="ts">
import { sanitizeAnimeDescriptionHtml } from '@/lib/anime-description'
import { resolveAnimeTitle } from '@/lib/anime-title'
import { formatAnimeFormatLabel } from '@/lib/format-label'
import { useSettingsStore } from '@/stores/settings'
import type { AniListSearchResult } from '@/types'

defineProps<{
  anime: AniListSearchResult
}>()

const settingsStore = useSettingsStore()
</script>

<template>
  <div class="picker-anime-detail rounded-[1.25rem] border border-app-border/70 bg-app-surface/70 p-4">
    <div class="flex min-h-0 flex-col">
      <div class="flex gap-4">
        <img
          :src="anime.coverImage.large"
          :alt="resolveAnimeTitle(anime.title, settingsStore.titleLanguage)"
          class="h-28 w-20 shrink-0 rounded-xl border border-app-border/70 object-cover"
          decoding="async"
        >

        <div class="min-w-0 space-y-2">
          <p class="min-w-0 break-words text-base font-semibold text-app-text">
            {{ resolveAnimeTitle(anime.title, settingsStore.titleLanguage) }}
          </p>

          <p class="text-sm text-app-muted">
            {{ anime.seasonYear ?? 'Unknown year' }}
            <span v-if="anime.format"> · {{ formatAnimeFormatLabel(anime.format) }}</span>
          </p>
        </div>
      </div>

      <p
        v-if="anime.description"
        class="mt-4 line-clamp-3 text-sm leading-6 text-app-muted lg:line-clamp-none"
      >
        <!-- eslint-disable vue/no-v-html -->
        <span v-html="sanitizeAnimeDescriptionHtml(anime.description)" />
      </p>
    </div>
  </div>
</template>
