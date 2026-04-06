import type { Pinia } from 'pinia'

import { useAniListAuthStore } from '@/stores/anilist-auth'
import { usePickerFiltersStore } from '@/stores/picker-filters'
import { useSelectionsStore } from '@/stores/selections'
import { useSettingsStore } from '@/stores/settings'
import { useTemplateStore } from '@/stores/templates'
import { useToastStore } from '@/stores/toasts'
import { predefinedTemplates } from '@/templates/predefined'

export const initializeAppStores = (pinia: Pinia) => {
  const settingsStore = useSettingsStore(pinia)
  const templateStore = useTemplateStore(pinia)
  const selectionsStore = useSelectionsStore(pinia)
  const toastStore = useToastStore(pinia)
  const pickerFiltersStore = usePickerFiltersStore(pinia)
  const aniListAuthStore = useAniListAuthStore(pinia)

  settingsStore.initialize()
  templateStore.initialize()
  templateStore.registerTemplates(predefinedTemplates)
  selectionsStore.initialize()
  selectionsStore.pruneSelectionsForTemplates(templateStore.templates)
  pickerFiltersStore.initialize()
  aniListAuthStore.initialize()

  return {
    settingsStore,
    templateStore,
    selectionsStore,
    toastStore,
    pickerFiltersStore,
    aniListAuthStore,
  }
}
