import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { loadStoredSelections, saveStoredSelections } from '@/lib/persistence'
import type { CategorySelection, Template, TemplateId, TemplateSelectionsMap } from '@/types'

export const useSelectionsStore = defineStore('selections', () => {
  const selections = ref<TemplateSelectionsMap>({})
  const isHydrated = ref(false)

  const cloneTemplateSelections = (templateSelections: TemplateSelectionsMap[string]) => {
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(templateSelections)
      } catch {
        // Persisted selection data is plain JSON-compatible state.
        // Vue proxies in tests can still trip structuredClone.
      }
    }

    return JSON.parse(JSON.stringify(templateSelections)) as TemplateSelectionsMap[string]
  }

  const persist = () => {
    if (!isHydrated.value) {
      return
    }

    saveStoredSelections(selections.value)
  }

  const initialize = () => {
    if (isHydrated.value) {
      return
    }

    selections.value = loadStoredSelections()
    isHydrated.value = true
  }

  const getTemplateSelections = (templateId: TemplateId | null) => {
    if (!templateId) {
      return {}
    }

    return selections.value[templateId] ?? {}
  }

  const getCategorySelection = (templateId: TemplateId, categoryId: string) =>
    selections.value[templateId]?.[categoryId] ?? null

  const setCategorySelection = (
    templateId: TemplateId,
    categoryId: string,
    selection: CategorySelection | null,
  ) => {
    const nextTemplateSelections = {
      ...(selections.value[templateId] ?? {}),
      [categoryId]: selection,
    }

    selections.value = {
      ...selections.value,
      [templateId]: nextTemplateSelections,
    }

    persist()
  }

  const clearSelectionsForTemplate = (templateId: TemplateId | null) => {
    if (!templateId || !Object.hasOwn(selections.value, templateId)) {
      return false
    }

    const { [templateId]: removedTemplateSelections, ...remainingSelections } = selections.value

    void removedTemplateSelections

    selections.value = remainingSelections
    persist()

    return true
  }

  const duplicateTemplateSelections = (
    sourceTemplateId: TemplateId,
    targetTemplateId: TemplateId,
  ) => {
    if (sourceTemplateId === targetTemplateId) {
      return false
    }

    const sourceSelections = selections.value[sourceTemplateId]

    if (!sourceSelections || Object.hasOwn(selections.value, targetTemplateId)) {
      return false
    }

    selections.value = {
      ...selections.value,
      [targetTemplateId]: cloneTemplateSelections(sourceSelections),
    }

    persist()

    return true
  }

  const pruneSelectionsForTemplates = (templates: Template[]) => {
    const nextSelections: TemplateSelectionsMap = {}

    for (const template of templates) {
      const templateSelections = selections.value[template.id]

      if (!templateSelections) {
        continue
      }

      const allowedCategoryIds = new Set(template.categories.map((category) => category.id))
      const categoriesById = new Map(template.categories.map((category) => [category.id, category]))
      const nextCategorySelections = Object.fromEntries(
        Object.entries(templateSelections).filter(([categoryId, selection]) => {
          if (!allowedCategoryIds.has(categoryId)) {
            return false
          }

          if (selection === null) {
            return true
          }

          const category = categoriesById.get(categoryId)

          return category ? category.entityKind === selection.kind : false
        }),
      )

      if (Object.keys(nextCategorySelections).length > 0) {
        nextSelections[template.id] = nextCategorySelections
      }
    }

    const hasChanged = JSON.stringify(nextSelections) !== JSON.stringify(selections.value)

    if (!hasChanged) {
      return
    }

    selections.value = nextSelections
    persist()
  }

  const getSelectionCount = (templateId: TemplateId | null) =>
    Object.values(getTemplateSelections(templateId)).filter((selection) => selection !== null).length

  const totalSelectionCount = computed(() =>
    Object.values(selections.value).reduce(
      (count, templateSelections) =>
        count + Object.values(templateSelections).filter((selection) => selection !== null).length,
      0,
    ),
  )

  return {
    selections,
    isHydrated,
    totalSelectionCount,
    initialize,
    getTemplateSelections,
    getCategorySelection,
    setCategorySelection,
    clearSelectionsForTemplate,
    duplicateTemplateSelections,
    pruneSelectionsForTemplates,
    getSelectionCount,
  }
})
