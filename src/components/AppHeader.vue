<script setup lang="ts">
import { computed } from 'vue'
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'

import AniListIcon from '@/components/icons/AniListIcon.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useAniListAuthStore } from '@/stores/anilist-auth'
import { useSettingsStore } from '@/stores/settings'
import { useTheme } from '@/composables/useTheme'

const aniListAuthStore = useAniListAuthStore()
const settingsStore = useSettingsStore()
const { theme } = useTheme()

const connectionLabel = computed(() => {
  if (aniListAuthStore.isAuthenticated && aniListAuthStore.username) {
    return aniListAuthStore.username
  }

  return ''
})
</script>

<template>
  <header
    class="rounded-[2rem] border border-app-border/70 bg-gradient-to-br from-app-surface via-app-surface to-app-elevated/80 p-6 shadow-shell sm:p-8"
  >
    <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-3xl">
        <h1 class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Award-style Anime Toplist Builder
        </h1>
        <p class="mt-4 max-w-2xl text-sm leading-6 text-app-muted sm:text-base">
          Use a predefined template or make your own, adjust common and category-specific filters, and select your anime for each category.
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:items-end">
        <div class="flex flex-wrap gap-2 sm:justify-end">
          <div
            v-if="aniListAuthStore.isAuthenticated"
            class="inline-flex items-center gap-2 rounded-full border border-app-border/80 bg-app-bg/50 px-3 py-2 text-sm text-app-muted"
          >
            <AniListIcon class="h-4 w-4 shrink-0" />
            <span class="max-w-48 truncate">{{ connectionLabel }}</span>
          </div>
          <TooltipRoot v-if="aniListAuthStore.isConfigured && !aniListAuthStore.isAuthenticated">
            <TooltipTrigger as-child>
              <span class="inline-flex">
                <button
                  type="button"
                  class="shell-button"
                  :disabled="aniListAuthStore.status === 'connecting'"
                  @click="aniListAuthStore.connect()"
                >
                  {{ aniListAuthStore.status === 'connecting' ? 'Connecting...' : 'Connect AniList' }}
                </button>
              </span>
            </TooltipTrigger>

            <TooltipPortal>
              <TooltipContent
                class="max-w-xs rounded-2xl border border-app-border/80 bg-app-surface px-3 py-2 text-xs leading-5 text-app-text shadow-shell"
                :side-offset="8"
              >
                Connect your AniList account
                to narrow search results to your anime list
                and show your verified account name in image exports.
                <TooltipArrow class="fill-app-surface" />
              </TooltipContent>
            </TooltipPortal>
          </TooltipRoot>
          <button
            v-else-if="aniListAuthStore.isAuthenticated"
            type="button"
            class="shell-button"
            @click="aniListAuthStore.disconnect()"
          >
            Disconnect AniList
          </button>
          <SettingsDialog v-model="settingsStore.titleLanguage" />
        </div>
        <ThemeToggle v-model="theme" />
      </div>
    </div>
  </header>
</template>
