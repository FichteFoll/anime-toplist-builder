<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'reka-ui'
import { computed, onMounted, ref } from 'vue'

import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import ImageExportDialog from '@/components/export/ImageExportDialog.vue'
import TemplateEditDialog from '@/components/templates/TemplateEditDialog.vue'
import { sanitizeDownloadFilename } from '@/lib/export-filename'
import { stringifyTemplateExportPayload, TemplateValidationError } from '@/lib/template-validation'
import { useConfirmationDialog } from '@/composables/useConfirmationDialog'
import { useAniListAuthStore } from '@/stores/anilist-auth'
import { useSelectionsStore } from '@/stores/selections'
import { useTemplateStore } from '@/stores/templates'
import { useToastStore } from '@/stores/toasts'
import { TemplateOrigin } from '@/types'
import type { FilterState } from '@/types'

const aniListAuthStore = useAniListAuthStore()
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
  const template = templateStore.createTemplate()
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
  if (!templateStore.pendingStartupTemplateUrl) {
    return
  }

  remoteUrlInput.value = templateStore.pendingStartupTemplateUrl
  await importFromRemoteUrl(templateStore.pendingStartupTemplateUrl)
})
</script>

<template>
  <section class="mt-6 grid gap-4">
    <article class="rounded-[2rem] border border-app-border/70 bg-app-surface/90 p-6 shadow-shell backdrop-blur sm:p-7">
      <div class="flex flex-col gap-5 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
            Template
          </p>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            {{ activeTemplate?.name ?? 'No active template' }}
          </h2>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
            {{ activeTemplate?.description || 'No description provided' }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <DropdownMenuRoot>
            <DropdownMenuTrigger as-child>
              <button
                type="button"
                class="shell-button"
              >
                Load template
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuPortal>
              <DropdownMenuContent class="z-50 min-w-72 rounded-2xl border border-app-border/80 bg-app-surface p-2 shadow-shell">
                <DropdownMenuLabel class="px-2 py-1 text-xs font-medium uppercase tracking-[0.25em] text-app-muted">
                  Load template
                </DropdownMenuLabel>

                <DropdownMenuSeparator class="my-2 h-px bg-app-border/70" />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger class="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70">
                    <span>Predefined</span>
                    <span class="text-xs text-app-muted">{{ templateStore.predefinedTemplates.length }}</span>
                  </DropdownMenuSubTrigger>

                  <DropdownMenuSubContent class="z-50 min-w-72 rounded-2xl border border-app-border/80 bg-app-surface p-2 shadow-shell">
                    <DropdownMenuLabel class="px-2 py-1 text-xs font-medium uppercase tracking-[0.25em] text-app-muted">
                      Built-in templates
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator class="my-2 h-px bg-app-border/70" />

                    <DropdownMenuItem
                      v-for="template in templateStore.predefinedTemplates"
                      :key="template.id"
                      class="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70"
                      @select="openTemplate(template.id)"
                    >
                      <span class="truncate">{{ template.name }}</span>
                      <span class="ml-4 shrink-0 text-xs text-app-muted">
                        {{ selectionsStore.getSelectionCount(template.id) }}/{{ template.categories.length }}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger class="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70">
                    <span>My templates</span>
                    <span class="text-xs text-app-muted">{{ templateStore.userTemplates.length + templateStore.remoteTemplates.length }}</span>
                  </DropdownMenuSubTrigger>

                  <DropdownMenuSubContent class="z-50 min-w-72 rounded-2xl border border-app-border/80 bg-app-surface p-2 shadow-shell">
                    <DropdownMenuLabel class="px-2 py-1 text-xs font-medium uppercase tracking-[0.25em] text-app-muted">
                      Local templates
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator class="my-2 h-px bg-app-border/70" />

                    <DropdownMenuItem
                      v-for="template in templateStore.userTemplates"
                      :key="template.id"
                      class="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70"
                      @select="openTemplate(template.id)"
                    >
                      <span class="truncate">{{ template.name }}</span>
                      <span class="ml-4 shrink-0 text-xs text-app-muted">
                        {{ selectionsStore.getSelectionCount(template.id) }}/{{ template.categories.length }}
                      </span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator
                      v-if="templateStore.userTemplates.length > 0 && templateStore.remoteTemplates.length > 0"
                      class="my-2 h-px bg-app-border/70"
                    />

                    <DropdownMenuLabel
                      v-if="templateStore.remoteTemplates.length > 0"
                      class="px-2 py-1 text-xs font-medium uppercase tracking-[0.25em] text-app-muted"
                    >
                      Remote imports
                    </DropdownMenuLabel>

                    <DropdownMenuItem
                      v-for="template in templateStore.remoteTemplates"
                      :key="template.id"
                      class="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70"
                      @select="openTemplate(template.id)"
                    >
                      <span class="truncate">{{ template.name }}</span>
                      <span class="ml-4 shrink-0 text-xs text-app-muted">
                        {{ selectionsStore.getSelectionCount(template.id) }}/{{ template.categories.length }}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator class="my-2 h-px bg-app-border/70" />

                <DropdownMenuItem
                  class="rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70"
                  @select="createTemplate"
                >
                  Create blank template
                </DropdownMenuItem>
                <DropdownMenuItem
                  class="rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70"
                  @select="triggerFileImport"
                >
                  Import template from file
                </DropdownMenuItem>
                <DropdownMenuItem
                  class="rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70"
                  @select="openRemoteImport"
                >
                  Import template from URL
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenuRoot>

          <TemplateEditDialog
            v-if="activeTemplate"
            :template="activeTemplate"
            @save="updateTemplateDetails"
            @delete="deleteActiveTemplate"
          />
          <button
            type="button"
            class="shell-button"
            :disabled="!activeTemplate"
            @click="exportActiveTemplate"
          >
            Export template
          </button>
          <ImageExportDialog
            :template="activeTemplate"
            :selection-by-category="activeTemplateSelections"
            :default-author="aniListAuthStore.username ?? undefined"
            :default-author-source="aniListAuthStore.isAuthenticated ? 'anilist' : 'manual'"
          />
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        class="hidden"
        @change="importFromFile"
      >
    </article>

    <ConfirmationDialog
      v-model:open="isConfirmationOpen"
      :title="confirmationState?.title ?? 'Confirm action'"
      :description="confirmationState?.description ?? ''"
      :confirm-label="confirmationState?.confirmLabel ?? 'Confirm'"
      @confirm="confirmAction"
    />

    <DialogRoot v-model:open="isRemoteImportOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(96vw,38rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell">
          <div class="shrink-0 flex items-start justify-between gap-4 border-b border-app-border/70 pb-5">
            <div class="space-y-2">
              <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
                Remote import
              </p>
              <h2 class="text-xl font-semibold tracking-tight text-app-text">
                Load a template from a URL
              </h2>
              <p class="text-sm leading-6 text-app-muted">
                Paste a remote template URL to load it.
              </p>
            </div>

            <DialogClose as-child>
              <button
                type="button"
                class="shell-button"
              >
                Close
              </button>
            </DialogClose>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto pr-1 pt-5">
            <label class="block space-y-2 text-sm font-medium text-app-text">
              <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
                Remote template URL
              </span>
              <input
                v-model="remoteUrlInput"
                type="url"
                inputmode="url"
                placeholder="https://example.com/template.json"
                class="shell-input"
              >
            </label>

            <div class="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                class="shell-button shell-button-active"
                :disabled="isImportingRemote"
                @click="importFromRemoteUrl()"
              >
                {{ isImportingRemote ? 'Loading...' : 'Import remote template' }}
              </button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </section>
</template>
