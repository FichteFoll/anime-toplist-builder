import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  defaultAnimeTitleLanguage,
  defaultThemePreference,
  type AnimeTitleLanguage,
  type ThemePreference,
} from '@/types'

import { loadStoredSettings, saveStoredSettings } from '@/lib/persistence'

export const useSettingsStore = defineStore('settings', () => {
  const themePreference = ref<ThemePreference>(defaultThemePreference)
  const titleLanguage = ref<AnimeTitleLanguage>(defaultAnimeTitleLanguage)
  const lastOpenedTemplateId = ref<string | null>(null)
  const exportImageAuthor = ref('')
  const exportImageHideAuthor = ref(false)
  const lastShownChangelogVersion = ref<string | null>(null)
  const isHydrated = ref(false)

  const persist = () => {
    if (!isHydrated.value) {
      return
    }

    saveStoredSettings({
      themePreference: themePreference.value,
      titleLanguage: titleLanguage.value,
      lastOpenedTemplateId: lastOpenedTemplateId.value ?? undefined,
      exportImageAuthor: exportImageAuthor.value,
      exportImageHideAuthor: exportImageHideAuthor.value,
      lastShownChangelogVersion: lastShownChangelogVersion.value ?? undefined,
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
    exportImageAuthor.value = storedSettings.exportImageAuthor ?? ''
    exportImageHideAuthor.value = storedSettings.exportImageHideAuthor ?? false
    lastShownChangelogVersion.value = storedSettings.lastShownChangelogVersion ?? null
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

  const setExportImageAuthor = (value: string) => {
    exportImageAuthor.value = value
    persist()
  }

  const setExportImageHideAuthor = (value: boolean) => {
    exportImageHideAuthor.value = value
    persist()
  }

  const setLastShownChangelogVersion = (value: string | null) => {
    lastShownChangelogVersion.value = value
    persist()
  }

  return {
    themePreference,
    titleLanguage,
    lastOpenedTemplateId,
    exportImageAuthor,
    exportImageHideAuthor,
    lastShownChangelogVersion,
    isHydrated,
    initialize,
    setThemePreference,
    setTitleLanguage,
    setLastOpenedTemplateId,
    setExportImageAuthor,
    setExportImageHideAuthor,
    setLastShownChangelogVersion,
  }
})
