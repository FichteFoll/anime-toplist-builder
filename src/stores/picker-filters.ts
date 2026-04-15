import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { AniListListVisibility } from '@/types'

export const usePickerFiltersStore = defineStore('picker-filters', () => {
  const listVisibility = ref<AniListListVisibility | null>(null)

  const onlyOnList = computed(() => listVisibility.value === AniListListVisibility.Only)
  const hideOnList = computed(() => listVisibility.value === AniListListVisibility.Hide)

  const setListVisibility = (value: AniListListVisibility | null) => {
    listVisibility.value = value
  }

  const toggleListVisibility = (value: AniListListVisibility) => {
    listVisibility.value = listVisibility.value === value ? null : value
  }

  const resetListVisibility = () => {
    listVisibility.value = null
  }

  const initialize = () => {
    resetListVisibility()
  }

  return {
    listVisibility,
    onlyOnList,
    hideOnList,
    initialize,
    setListVisibility,
    toggleListVisibility,
    resetListVisibility,
  }
})
