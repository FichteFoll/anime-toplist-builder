import { computed, ref, watch } from 'vue'

import type { ThemePreference } from '@/types'

import { ResolvedTheme, resolveThemePreference } from '@/lib/theme'
import { useSettingsStore } from '@/stores/settings'

const systemTheme = ref<ResolvedTheme>(ResolvedTheme.Light)

let isInitialized = false

const syncDocumentTheme = (value: ResolvedTheme) => {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.classList.toggle('dark', value === ResolvedTheme.Dark)
  document.documentElement.dataset.theme = value
  document.documentElement.style.colorScheme = value
}

const ensureInitialized = () => {
  if (isInitialized) {
    return
  }

  isInitialized = true
  const settingsStore = useSettingsStore()
  const resolvedTheme = computed<ResolvedTheme>(() =>
    resolveThemePreference(settingsStore.themePreference, systemTheme.value),
  )

  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemTheme = (matches: boolean) => {
      systemTheme.value = matches ? ResolvedTheme.Dark : ResolvedTheme.Light
    }

    updateSystemTheme(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      updateSystemTheme(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
  }

  watch(resolvedTheme, syncDocumentTheme, { immediate: true })
}

export const useTheme = () => {
  ensureInitialized()
  const settingsStore = useSettingsStore()
  const theme = computed<ThemePreference>({
    get: () => settingsStore.themePreference,
    set: (value) => settingsStore.setThemePreference(value),
  })
  const resolvedTheme = computed<ResolvedTheme>(() =>
    resolveThemePreference(theme.value, systemTheme.value),
  )

  return {
    theme,
    resolvedTheme,
    systemTheme: computed(() => systemTheme.value),
  }
}
