<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { sanitizeAnimeDescriptionHtml } from '@/lib/anime-description'
import { resolveAnimeTitle } from '@/lib/anime-title'
import ExternalLinkIcon from '@/components/icons/ExternalLinkIcon.vue'
import type { AniListSearchResult, AnimeTitleLanguage } from '@/types'

defineProps<{
  result: AniListSearchResult
  titleLanguage: AnimeTitleLanguage
  isSelected: boolean
}>()

const emit = defineEmits<{
  select: [result: AniListSearchResult]
  clear: []
}>()
</script>

<template>
  <article
    class="flex h-full flex-col rounded-[1.25rem] border bg-app-surface/85 p-3 transition"
    :class="isSelected ? 'border-app-accent/80 hover:border-app-accent' : 'border-app-border/70 hover:border-app-accent/60'"
  >
    <button
      type="button"
      class="flex flex-1 cursor-pointer flex-col gap-4 text-left"
      :aria-label="`Select ${resolveAnimeTitle(result.title, titleLanguage)}`"
      @click="emit('select', result)"
    >
      <div class="grid grid-cols-[5rem_1fr] gap-4">
        <img
          :src="result.coverImage.large"
          :alt="resolveAnimeTitle(result.title, titleLanguage)"
          class="h-28 w-20 rounded-xl border border-app-border/70 object-cover"
        >

        <div class="min-w-0 space-y-2">
          <p class="min-w-0 break-words text-base font-semibold text-app-text">
            {{ resolveAnimeTitle(result.title, titleLanguage) }}
          </p>

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
        v-if="isSelected"
        type="button"
        class="shell-button"
        @click="emit('clear')"
      >
        Unselect
      </button>
    </div>
  </article>
</template>
