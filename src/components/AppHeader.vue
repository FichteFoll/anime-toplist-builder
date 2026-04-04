<script setup lang="ts">
import SettingsDialog from '@/components/SettingsDialog.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import type { AnimeTitleLanguage, ThemePreference } from '@/types'

defineProps<{
  resolvedTheme: 'light' | 'dark'
}>()

const currentTheme = defineModel<ThemePreference>({ required: true })
const titleLanguage = defineModel<AnimeTitleLanguage>('titleLanguage', { required: true })
</script>

<template>
  <header
    class="rounded-[2rem] border border-app-border/70 bg-gradient-to-br from-app-surface via-app-surface to-app-elevated/80 p-6 shadow-shell sm:p-8"
  >
    <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-3xl">
        <p class="text-sm font-medium uppercase tracking-[0.35em] text-app-muted">
          Anime Toplist
        </p>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Build ranked anime lists from AniList data.
        </h1>
        <p class="mt-4 max-w-2xl text-sm leading-6 text-app-muted sm:text-base">
          Manage templates, edit shared filters, and prepare category-specific constraints before anime selection.
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:items-end">
        <div class="flex flex-wrap gap-2 sm:justify-end">
          <SettingsDialog v-model="titleLanguage" />
        </div>
        <ThemeToggle v-model="currentTheme" />
      </div>
    </div>
  </header>
</template>
