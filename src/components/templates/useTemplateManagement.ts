import { computed, onMounted, ref } from 'vue'

import { sanitizeDownloadFilename } from '@/lib/export-filename'
import { stringifyTemplateExportPayload, TemplateValidationError } from '@/lib/template-validation'
import { useConfirmationDialog } from '@/composables/useConfirmationDialog'
import { useSelectionsStore } from '@/stores/selections'
import { useTemplateStore } from '@/stores/templates'
import { useToastStore } from '@/stores/toasts'
import { TemplateOrigin } from '@/types'
import type { FilterState } from '@/types'

let didHydrateStartupTemplate = false

export const useTemplateManagement = () => {
  const templateStore = useTemplateStore()
  const selectionsStore = useSelectionsStore()
  const toastStore = useToastStore()
  const {
    isOpen: isConfirmationOpen,
    state: confirmationState,
    requestConfirmation,
    confirmAction,
  } = useConfirmationDialog()

  const fileInput = ref<HTMLInputElement | null>(null)
  const remoteUrlInput = ref(templateStore.pendingStartupTemplateUrl ?? '')
  const isRemoteImportOpen = ref(false)
  const isImportingRemote = ref(false)

  const activeTemplate = computed(() => templateStore.activeTemplate)
  const activeTemplateSelections = computed(() =>
    selectionsStore.getTemplateSelections(templateStore.activeTemplateId),
  )

  const showError = (error: unknown) => {
    if (error instanceof TemplateValidationError) {
      toastStore.error('Template action failed.', error.message)
      return
    }

    if (error instanceof Error) {
      toastStore.error('Template action failed.', error.message)
      return
    }

    toastStore.error('Template action failed.')
  }

  const createTemplate = () => {
    templateStore.createTemplate()
  }

  const openRemoteImport = () => {
    isRemoteImportOpen.value = true
  }

  const openTemplate = (templateId: string) => {
    templateStore.setActiveTemplate(templateId)
  }

  const exportActiveTemplate = async () => {
    if (!activeTemplate.value) {
      toastStore.error('No active template to export.')
      return
    }

    const payload = stringifyTemplateExportPayload(activeTemplate.value)

    const blob = new Blob([payload], { type: 'application/json' })
    const downloadUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const safeName = sanitizeDownloadFilename(activeTemplate.value.name, 'template')

    anchor.href = downloadUrl
    anchor.download = `${safeName}.json`
    anchor.click()

    URL.revokeObjectURL(downloadUrl)
  }

  const triggerFileImport = () => {
    fileInput.value?.click()
  }

  const importFromFile = async (event: Event) => {
    const input = event.target as HTMLInputElement | null
    const file = input?.files?.[0]

    if (!file) {
      return
    }

    try {
      const fileContents = await file.text()
      const template = templateStore.importTemplate(fileContents, TemplateOrigin.ImportedFile)

      toastStore.success('Imported template from file.', template.name)
    } catch (error) {
      showError(error)
    } finally {
      if (input) {
        input.value = ''
      }
    }
  }

  const importFromRemoteUrl = async (urlOverride?: string) => {
    const remoteUrl = (urlOverride ?? remoteUrlInput.value).trim()

    if (remoteUrl.length === 0) {
      toastStore.error('Enter an http or https template URL.')
      return
    }

    isImportingRemote.value = true

    try {
      const template = await templateStore.importTemplateFromRemoteUrl(remoteUrl)

      remoteUrlInput.value = remoteUrl
      isRemoteImportOpen.value = false
      toastStore.success('Imported remote template.', template.name)
    } catch (error) {
      showError(error)
    } finally {
      isImportingRemote.value = false
    }
  }

  const updateTemplateDetails = (value: { name: string, description: string, filter: FilterState }) => {
    templateStore.updateActiveTemplate((template) => {
      template.name = value.name
      template.description = value.description
      template.globalFilter = value.filter
    })
  }

  const deleteActiveTemplate = () => {
    if (!activeTemplate.value) {
      toastStore.error('No active template to delete.')
      return
    }

    const templateId = activeTemplate.value.id
    const templateName = activeTemplate.value.name

    requestConfirmation({
      title: 'Delete template',
      description: `Delete "${templateName}"? This removes the local template and its stored selections.`,
      confirmLabel: 'Delete template',
      onConfirm: () => {
        if (!templateStore.removeLocalTemplate(templateId)) {
          toastStore.error('Template delete failed.')
          return
        }

        selectionsStore.pruneSelectionsForTemplates(templateStore.templates)
      },
    })
  }

  onMounted(async () => {
    if (didHydrateStartupTemplate || !templateStore.pendingStartupTemplateUrl) {
      return
    }

    didHydrateStartupTemplate = true
    remoteUrlInput.value = templateStore.pendingStartupTemplateUrl
    await importFromRemoteUrl(templateStore.pendingStartupTemplateUrl)
  })

  return {
    activeTemplate,
    activeTemplateSelections,
    confirmationState,
    confirmAction,
    createTemplate,
    deleteActiveTemplate,
    exportActiveTemplate,
    fileInput,
    importFromFile,
    importFromRemoteUrl,
    isConfirmationOpen,
    isImportingRemote,
    isRemoteImportOpen,
    openRemoteImport,
    openTemplate,
    remoteUrlInput,
    triggerFileImport,
    updateTemplateDetails,
  }
}
