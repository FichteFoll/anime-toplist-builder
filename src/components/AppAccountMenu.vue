<script setup lang="ts">
import {
  AvatarFallback,
  AvatarImage,
  AvatarRoot,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
import { computed } from 'vue'

import ToolbarIconButton from '@/components/ToolbarIconButton.vue'
import AniListIcon from '@/components/icons/AniListIcon.vue'
import CogIcon from '@/components/icons/CogIcon.vue'
import { useTheme } from '@/composables/useTheme'
import { useAniListAuthStore } from '@/stores/anilist-auth'
import { useSettingsStore } from '@/stores/settings'
import {
  AnimeTitleLanguage,
  ThemePreference,
  type AnimeTitleLanguage as AnimeTitleLanguageType,
} from '@/types'

const aniListAuthStore = useAniListAuthStore()
const settingsStore = useSettingsStore()
const { theme } = useTheme()

const titleLanguageLabels: Record<AnimeTitleLanguageType, string> = {
  [AnimeTitleLanguage.Romaji]: 'Romaji',
  [AnimeTitleLanguage.English]: 'English',
  [AnimeTitleLanguage.Native]: 'Native',
}

const themeLabels: Record<ThemePreference, string> = {
  [ThemePreference.System]: 'System',
  [ThemePreference.Light]: 'Light',
  [ThemePreference.Dark]: 'Dark',
}

const emit = defineEmits<{
  'show-changelog': []
}>()

const triggerLabel = computed(() => aniListAuthStore.username ?? 'Settings')
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <ToolbarIconButton
        class="overflow-hidden"
        :label="triggerLabel"
        :aria-label="aniListAuthStore.isAuthenticated ? 'Open account and preferences' : 'Open settings and AniList actions'"
      >
        <AvatarRoot
          v-if="aniListAuthStore.isAuthenticated"
          class="inline-flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-app-elevated"
        >
          <AvatarImage
            v-if="aniListAuthStore.avatarUrl"
            :src="aniListAuthStore.avatarUrl"
            :alt="aniListAuthStore.username ?? 'AniList avatar'"
            class="h-full w-full object-cover"
          />
          <AvatarFallback class="inline-flex h-full w-full items-center justify-center bg-app-accentSoft text-sm font-semibold text-app-text">
            {{ aniListAuthStore.username?.slice(0, 1).toUpperCase() ?? 'A' }}
          </AvatarFallback>
        </AvatarRoot>
        <CogIcon
          v-else
          class="h-5 w-5"
        />
      </ToolbarIconButton>
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent class="z-50 min-w-72 rounded-2xl border border-app-border/80 bg-app-surface p-2 shadow-shell">
        <DropdownMenuLabel class="px-2 py-1 text-xs font-medium uppercase tracking-[0.25em] text-app-muted">
          Account and preferences
        </DropdownMenuLabel>

        <DropdownMenuSeparator class="my-2 h-px bg-app-border/70" />

        <DropdownMenuItem
          class="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70"
          @select="emit('show-changelog')"
        >
          <span>What's new</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator class="my-2 h-px bg-app-border/70" />

        <DropdownMenuItem
          class="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70 disabled:pointer-events-none disabled:opacity-40"
          :disabled="!aniListAuthStore.isConfigured || aniListAuthStore.status === 'connecting'"
          @select="aniListAuthStore.isAuthenticated ? aniListAuthStore.disconnect() : aniListAuthStore.connect()"
        >
          <AniListIcon class="h-4 w-4" />
          <span>
            {{ aniListAuthStore.isAuthenticated ? 'Disconnect AniList' : aniListAuthStore.status === 'connecting' ? 'Connecting...' : 'Connect AniList' }}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator class="my-2 h-px bg-app-border/70" />

        <DropdownMenuLabel class="px-2 py-1 text-xs font-medium uppercase tracking-[0.25em] text-app-muted">
          Title language
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          :model-value="settingsStore.titleLanguage"
          @update:model-value="settingsStore.setTitleLanguage($event as AnimeTitleLanguageType)"
        >
          <DropdownMenuRadioItem
            v-for="language in Object.values(AnimeTitleLanguage)"
            :key="language"
            :value="language"
            class="relative rounded-xl px-8 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70"
          >
            <DropdownMenuItemIndicator class="absolute left-3 top-1/2 -translate-y-1/2 text-app-accent">
              •
            </DropdownMenuItemIndicator>
            {{ titleLanguageLabels[language] }}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator class="my-2 h-px bg-app-border/70" />

        <DropdownMenuLabel class="px-2 py-1 text-xs font-medium uppercase tracking-[0.25em] text-app-muted">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          :model-value="theme"
          @update:model-value="theme = $event as ThemePreference"
        >
          <DropdownMenuRadioItem
            v-for="themeOption in Object.values(ThemePreference)"
            :key="themeOption"
            :value="themeOption"
            class="relative rounded-xl px-8 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70"
          >
            <DropdownMenuItemIndicator class="absolute left-3 top-1/2 -translate-y-1/2 text-app-accent">
              •
            </DropdownMenuItemIndicator>
            {{ themeLabels[themeOption] }}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
