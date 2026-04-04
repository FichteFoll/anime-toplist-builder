import type { Pinia } from 'pinia'

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

  settingsStore.initialize()
  templateStore.initialize()
  templateStore.registerTemplates(predefinedTemplates)
  selectionsStore.initialize()
  selectionsStore.pruneSelectionsForTemplates(templateStore.templates)

  return {
    settingsStore,
    templateStore,
    selectionsStore,
    toastStore,
  }
}
