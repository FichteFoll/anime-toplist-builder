import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { AnimeTitleLanguage, ThemePreference } from '@/types'

import { loadStoredSettings, saveStoredSettings } from '@/lib/persistence'

export const useSettingsStore = defineStore('settings', () => {
  const themePreference = ref<ThemePreference>('system')
  const titleLanguage = ref<AnimeTitleLanguage>('userPreferred')
  const lastOpenedTemplateId = ref<string | null>(null)
  const isHydrated = ref(false)

  const persist = () => {
    if (!isHydrated.value) {
      return
    }

    saveStoredSettings({
      themePreference: themePreference.value,
      titleLanguage: titleLanguage.value,
      lastOpenedTemplateId: lastOpenedTemplateId.value ?? undefined,
    })
  }

  const initialize = () => {
    if (isHydrated.value) {
      return
    }

    const storedSettings = loadStoredSettings()

    themePreference.value = storedSettings.themePreference
    titleLanguage.value = storedSettings.titleLanguage
    lastOpenedTemplateId.value = storedSettings.lastOpenedTemplateId ?? null
    isHydrated.value = true
  }

  const setThemePreference = (value: ThemePreference) => {
    themePreference.value = value
    persist()
  }

  const setTitleLanguage = (value: AnimeTitleLanguage) => {
    titleLanguage.value = value
    persist()
  }

  const setLastOpenedTemplateId = (value: string | null) => {
    lastOpenedTemplateId.value = value
    persist()
  }

  return {
    themePreference,
    titleLanguage,
    lastOpenedTemplateId,
    isHydrated,
    initialize,
    setThemePreference,
    setTitleLanguage,
    setLastOpenedTemplateId,
  }
})
