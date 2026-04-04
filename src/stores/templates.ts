import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { appConfig } from '@/config/app'
import { loadStoredTemplates, saveStoredTemplates } from '@/lib/persistence'
import {
  parseStartupTemplateReference,
  replaceWindowTemplateHash,
} from '@/lib/template-fragment'
import {
  cloneTemplate,
  createBlankTemplate,
  forkTemplate,
  isProtectedTemplateOrigin,
} from '@/lib/template-factories'
import {
  normalizeImportedTemplate,
  parseTemplateImportJson,
} from '@/lib/template-validation'
import type { Template, TemplateId } from '@/types'

import { useSelectionsStore } from './selections'
import { useSettingsStore } from './settings'

export const useTemplateStore = defineStore('templates', () => {
  const localTemplates = ref<Template[]>([])
  const registeredTemplates = ref<Template[]>([])
  const activeTemplateId = ref<TemplateId | null>(null)
  const pendingStartupTemplateUrl = ref<string | null>(null)
  const remoteTemplateUrls = ref<Record<string, string>>({})
  const isHydrated = ref(false)

  const templatesById = computed(() => {
    const templateMap = new Map<TemplateId, Template>()

    for (const template of registeredTemplates.value) {
      templateMap.set(template.id, template)
    }

    for (const template of localTemplates.value) {
      templateMap.set(template.id, template)
    }

    return templateMap
  })

  const templates = computed(() => [...templatesById.value.values()])

  const activeTemplate = computed(() => {
    if (!activeTemplateId.value) {
      return null
    }

    return templatesById.value.get(activeTemplateId.value) ?? null
  })

  const predefinedTemplates = computed(() =>
    registeredTemplates.value.filter((template) => template.origin === 'predefined'),
  )

  const userTemplates = computed(() =>
    localTemplates.value.filter((template) => template.origin !== 'imported-url'),
  )

  const remoteTemplates = computed(() =>
    localTemplates.value.filter((template) => template.origin === 'imported-url'),
  )

  const persistLocalTemplates = () => {
    if (!isHydrated.value) {
      return
    }

    saveStoredTemplates(localTemplates.value, remoteTemplateUrls.value)
  }

  const upsertLocalTemplate = (template: Template) => {
    const templateIndex = localTemplates.value.findIndex((entry) => entry.id === template.id)

    if (templateIndex === -1) {
      localTemplates.value = [...localTemplates.value, template]
    } else {
      localTemplates.value = localTemplates.value.map((entry, index) =>
        index === templateIndex ? template : entry,
      )
    }

    persistLocalTemplates()
  }

  const setActiveTemplateId = (templateId: TemplateId | null) => {
    const settingsStore = useSettingsStore()

    activeTemplateId.value = templateId
    settingsStore.setLastOpenedTemplateId(templateId)

    if (!templateId) {
      replaceWindowTemplateHash(null)
      return
    }

    const template = templatesById.value.get(templateId)

    if (!template) {
      replaceWindowTemplateHash(null)
      return
    }

    const remoteTemplateUrl = remoteTemplateUrls.value[templateId]

    replaceWindowTemplateHash(
      template.origin === 'imported-url' && remoteTemplateUrl
        ? {
            kind: 'url',
            url: remoteTemplateUrl,
          }
        : {
            kind: 'id',
            templateId,
          },
    )
  }

  const ensureFallbackTemplate = () => {
    if (templatesById.value.size > 0) {
      return
    }

    localTemplates.value = [createBlankTemplate()]
  }

  const resolveStartupTemplateId = () => {
    const settingsStore = useSettingsStore()
    const startupReference = parseStartupTemplateReference(
      typeof window === 'undefined' ? undefined : window.location.hash,
    )

    pendingStartupTemplateUrl.value = startupReference?.kind === 'url' ? startupReference.url : null

    if (startupReference?.kind === 'url') {
      const existingRemoteTemplateId = Object.entries(remoteTemplateUrls.value).find(
        ([, remoteUrl]) => remoteUrl === startupReference.url,
      )?.[0]

      if (existingRemoteTemplateId && templatesById.value.has(existingRemoteTemplateId)) {
        setActiveTemplateId(existingRemoteTemplateId)
        return
      }
    }

    const candidateTemplateIds = [
      startupReference?.kind === 'id' ? startupReference.templateId : null,
      settingsStore.lastOpenedTemplateId,
      appConfig.defaultTemplateId || null,
    ]

    for (const candidateTemplateId of candidateTemplateIds) {
      if (!candidateTemplateId) {
        continue
      }

      if (templatesById.value.has(candidateTemplateId)) {
        setActiveTemplateId(candidateTemplateId)
        return
      }
    }

    setActiveTemplateId(templates.value[0]?.id ?? null)
  }

  const initialize = () => {
    if (isHydrated.value) {
      return
    }

    const storedTemplates = loadStoredTemplates()

    localTemplates.value = storedTemplates.templates
    remoteTemplateUrls.value = storedTemplates.remoteTemplateUrls
    ensureFallbackTemplate()
    isHydrated.value = true
    persistLocalTemplates()
    resolveStartupTemplateId()
  }

  const registerTemplates = (templatesToRegister: Template[]) => {
    registeredTemplates.value = templatesToRegister.map(cloneTemplate)

    if (activeTemplateId.value && templatesById.value.has(activeTemplateId.value)) {
      return
    }

    resolveStartupTemplateId()
  }

  const setActiveTemplate = (templateId: TemplateId) => {
    if (!templatesById.value.has(templateId)) {
      return false
    }

    setActiveTemplateId(templateId)

    return true
  }

  const createTemplate = (name?: string) => {
    const template = createBlankTemplate(name)

    upsertLocalTemplate(template)
    setActiveTemplateId(template.id)

    return template
  }

  const saveLocalTemplate = (template: Template) => {
    upsertLocalTemplate(template)
    return template
  }

  const importTemplate = (
    payloadJson: string,
    origin: 'imported-file' | 'imported-url',
    remoteUrl?: string,
  ) => {
    const parsedPayload = parseTemplateImportJson(payloadJson)
    const importedTemplate = normalizeImportedTemplate(parsedPayload, origin)

    if (origin === 'imported-url' && remoteUrl) {
      const existingTemplateId = Object.entries(remoteTemplateUrls.value).find(
        ([, storedRemoteUrl]) => storedRemoteUrl === remoteUrl,
      )?.[0]

      if (existingTemplateId) {
        importedTemplate.id = existingTemplateId
      }

      remoteTemplateUrls.value = {
        ...remoteTemplateUrls.value,
        [importedTemplate.id]: remoteUrl,
      }
    }

    upsertLocalTemplate(importedTemplate)

    if (origin === 'imported-url') {
      pendingStartupTemplateUrl.value = remoteUrl ?? null
    }

    setActiveTemplateId(importedTemplate.id)

    return importedTemplate
  }

  const importTemplateFromRemoteUrl = async (url: string) => {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Remote template request failed with status ${response.status}.`)
    }

    const payloadText = await response.text()
    const importedTemplate = importTemplate(payloadText, 'imported-url', url)

    pendingStartupTemplateUrl.value = url
    replaceWindowTemplateHash({ kind: 'url', url })

    return importedTemplate
  }

  const hydratePendingStartupTemplateUrl = async () => {
    if (!pendingStartupTemplateUrl.value) {
      return null
    }

    return importTemplateFromRemoteUrl(pendingStartupTemplateUrl.value)
  }

  const removeLocalTemplate = (templateId: TemplateId) => {
    const localTemplate = localTemplates.value.find((template) => template.id === templateId)

    if (!localTemplate) {
      return false
    }

    localTemplates.value = localTemplates.value.filter((template) => template.id !== templateId)

    if (Object.hasOwn(remoteTemplateUrls.value, templateId)) {
      const { [templateId]: removedRemoteUrl, ...remainingRemoteUrls } = remoteTemplateUrls.value

      void removedRemoteUrl
      remoteTemplateUrls.value = remainingRemoteUrls
    }

    persistLocalTemplates()

    if (activeTemplateId.value === templateId) {
      resolveStartupTemplateId()
    }

    return true
  }

  const resetActiveTemplate = () => {
    const template = activeTemplate.value

    if (!template) {
      return false
    }

    if (template.origin === 'predefined') {
      return true
    }

    const wasRemoved = removeLocalTemplate(template.id)

    if (!wasRemoved) {
      return false
    }

    return true
  }

  const ensureEditableTemplate = (templateId = activeTemplateId.value) => {
    if (!templateId) {
      return null
    }

    const currentTemplate = templatesById.value.get(templateId)

    if (!currentTemplate) {
      return null
    }

    if (!isProtectedTemplateOrigin(currentTemplate.origin)) {
      return currentTemplate
    }

    const selectionsStore = useSelectionsStore()
    const forkedTemplate = forkTemplate(currentTemplate)

    upsertLocalTemplate(forkedTemplate)
    selectionsStore.duplicateTemplateSelections(currentTemplate.id, forkedTemplate.id)
    setActiveTemplateId(forkedTemplate.id)

    return forkedTemplate
  }

  const updateActiveTemplate = (updater: (template: Template) => void) => {
    const editableTemplate = ensureEditableTemplate()

    if (!editableTemplate) {
      return null
    }

    const nextTemplate = cloneTemplate(editableTemplate)

    updater(nextTemplate)
    upsertLocalTemplate(nextTemplate)

    return nextTemplate
  }

  return {
    localTemplates,
    registeredTemplates,
    activeTemplateId,
    pendingStartupTemplateUrl,
    remoteTemplateUrls,
    isHydrated,
    templates,
    activeTemplate,
    predefinedTemplates,
    userTemplates,
    remoteTemplates,
    initialize,
    registerTemplates,
    setActiveTemplate,
    createTemplate,
    saveLocalTemplate,
    importTemplate,
    importTemplateFromRemoteUrl,
    hydratePendingStartupTemplateUrl,
    removeLocalTemplate,
    resetActiveTemplate,
    ensureEditableTemplate,
    updateActiveTemplate,
  }
})
