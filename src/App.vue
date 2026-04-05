<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ConfigProvider,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
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
  TooltipProvider,
} from 'reka-ui'

import { fetchAniListMetadata } from '@/api'
import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import AppToastViewport from '@/components/AppToastViewport.vue'
import CategoryGrid from '@/components/categories/CategoryGrid.vue'
import PngExportDialog from '@/components/export/PngExportDialog.vue'
import GlobalFilterDialog from '@/components/filters/GlobalFilterDialog.vue'
import { resolveAnimeTitle } from '@/lib/anime-title'
import { sanitizeDownloadFilename } from '@/lib/export-filename'
import { countConfiguredFilterFields } from '@/lib/filter-editor'
import { createBlankCategory } from '@/lib/template-factories'
import { stringifyTemplateExportPayload, TemplateValidationError } from '@/lib/template-validation'
import { useConfirmationDialog } from '@/composables/useConfirmationDialog'
import { useTheme } from '@/composables/useTheme'
import { useSelectionsStore } from '@/stores/selections'
import { useSettingsStore } from '@/stores/settings'
import { useTemplateStore } from '@/stores/templates'
import { useToastStore } from '@/stores/toasts'
import type { AniListMetadata, AnimeSelection, FilterState } from '@/types'

const settingsStore = useSettingsStore()
const templateStore = useTemplateStore()
const selectionsStore = useSelectionsStore()
const toastStore = useToastStore()
const { resolvedTheme, theme } = useTheme()
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
const metadata = ref<AniListMetadata | null>(null)
const metadataStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const metadataError = ref<string | null>(null)

const activeTemplate = computed(() => templateStore.activeTemplate)
const activeTemplateSelections = computed(() =>
  selectionsStore.getTemplateSelections(templateStore.activeTemplateId),
)
const activeSelectionCount = computed(() =>
  selectionsStore.getSelectionCount(templateStore.activeTemplateId),
)

const loadAniListMetadata = async () => {
  metadataStatus.value = 'loading'
  metadataError.value = null

  try {
    metadata.value = await fetchAniListMetadata()
    metadataStatus.value = 'ready'
  } catch (error) {
    metadataStatus.value = 'error'
    metadataError.value = error instanceof Error ? error.message : 'Failed to load AniList metadata.'
    toastStore.error('AniList metadata failed to load.', metadataError.value)
  }
}

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

  toastStore.success('Created local template.', template.name)
}

const openRemoteImport = () => {
  isRemoteImportOpen.value = true
}

const openTemplate = (templateId: string) => {
  templateStore.setActiveTemplate(templateId)
  toastStore.success('Template switched.')
}

const exportActiveTemplate = async () => {
  if (!activeTemplate.value) {
    toastStore.error('No active template to export.')
    return
  }

  const payload = stringifyTemplateExportPayload(activeTemplate.value)

  try {
    await navigator.clipboard.writeText(payload)
    toastStore.success('Template JSON copied to the clipboard.')
  } catch {
    toastStore.info('Clipboard copy blocked.', 'Downloading template JSON instead.')
  }

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
    const template = templateStore.importTemplate(fileContents, 'imported-file')

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
    toastStore.success('Imported remote template.', template.name)
  } catch (error) {
    showError(error)
  } finally {
    isImportingRemote.value = false
  }
}

const resetActiveTemplate = () => {
  if (!activeTemplate.value) {
    toastStore.error('No active template to reset.')
    return
  }

  requestConfirmation({
    title: 'Reset template',
    description:
      activeTemplate.value.origin === 'predefined'
        ? `Reopen the built-in template "${activeTemplate.value.name}"? Local selections stay untouched.`
        : `Reset "${activeTemplate.value.name}"? This removes the local template, but keeps stored selections for other templates.`,
    confirmLabel: 'Reset template',
    onConfirm: () => {
      if (!templateStore.resetActiveTemplate()) {
        toastStore.error('Template reset failed.')
        return
      }

      toastStore.success('Template reset complete.')
    },
  })
}

const updateGlobalFilter = (filter: FilterState) => {
  templateStore.updateActiveTemplate((template) => {
    template.globalFilter = filter
  })
}

const updateCategory = (
  categoryId: string,
  value: {
    name: string
    description: string
    filter: FilterState
  },
) => {
  templateStore.updateActiveTemplate((template) => {
    const category = template.categories.find((entry) => entry.id === categoryId)

    if (!category) {
      return
    }

    category.name = value.name
    category.description = value.description
    category.filter = value.filter
  })
}

const addCategory = (name: string) => {
  templateStore.updateActiveTemplate((template) => {
    template.categories.push(createBlankCategory(name))
  })

  toastStore.success('Added category.', name)
}

const deleteCategory = (categoryId: string) => {
  if (!activeTemplate.value) {
    return
  }

  const category = activeTemplate.value.categories.find((entry) => entry.id === categoryId)

  if (!category) {
    return
  }

  const selection = activeTemplateSelections.value[categoryId] ?? null
  const customRuleCount = countConfiguredFilterFields(category.filter)
  const needsConfirmation = selection !== null || customRuleCount > 0

  if (needsConfirmation) {
    const affectedParts = [
      customRuleCount > 0
        ? `${customRuleCount} custom rule${customRuleCount === 1 ? '' : 's'}`
        : null,
      selection
        ? `the saved selection "${resolveAnimeTitle(selection.title, settingsStore.titleLanguage)}"`
        : null,
    ].filter((value): value is string => value !== null)

    requestConfirmation({
      title: 'Delete category',
      description: `Delete "${category.name}"? This removes ${affectedParts.join(' and ')}.`,
      confirmLabel: 'Delete category',
      onConfirm: () => {
        templateStore.updateActiveTemplate((template) => {
          template.categories = template.categories.filter((entry) => entry.id !== categoryId)
        })
        selectionsStore.pruneSelectionsForTemplates(templateStore.templates)
        toastStore.success('Deleted category.', category.name)
      },
    })

    return
  }

  templateStore.updateActiveTemplate((template) => {
    template.categories = template.categories.filter((entry) => entry.id !== categoryId)
  })
  selectionsStore.pruneSelectionsForTemplates(templateStore.templates)
  toastStore.success('Deleted category.', category.name)
}

const reorderCategories = ({ fromIndex, toIndex }: { fromIndex: number, toIndex: number }) => {
  templateStore.updateActiveTemplate((template) => {
    const nextCategories = [...template.categories]
    const [movedCategory] = nextCategories.splice(fromIndex, 1)

    if (!movedCategory) {
      return
    }

    nextCategories.splice(toIndex, 0, movedCategory)
    template.categories = nextCategories
  })
}

const clearAllSelections = () => {
  if (!activeTemplate.value || activeSelectionCount.value === 0) {
    return
  }

  const templateId = activeTemplate.value.id

  requestConfirmation({
    title: 'Clear all selections',
    description: `Clear all selections for "${activeTemplate.value.name}"?`,
    confirmLabel: 'Clear all selections',
    onConfirm: () => {
      selectionsStore.clearSelectionsForTemplate(templateId)
      toastStore.success('All selections cleared for the active template.')
    },
  })
}

const selectCategoryAnime = (categoryId: string, selection: AnimeSelection) => {
  if (!activeTemplate.value) {
    return
  }

  const category = activeTemplate.value.categories.find((entry) => entry.id === categoryId)

  if (!category) {
    return
  }

  selectionsStore.setCategorySelection(activeTemplate.value.id, categoryId, selection)
  toastStore.success(
    'Anime saved to category.',
    `${resolveAnimeTitle(selection.title, settingsStore.titleLanguage)} -> ${category.name}`,
  )
}

const clearCategorySelection = (categoryId: string) => {
  if (!activeTemplate.value) {
    return
  }

  const category = activeTemplate.value.categories.find((entry) => entry.id === categoryId)
  const selection = activeTemplateSelections.value[categoryId] ?? null

  if (!category || !selection) {
    return
  }

  selectionsStore.setCategorySelection(activeTemplate.value.id, categoryId, null)
  toastStore.success(
    'Cleared category selection.',
    `${resolveAnimeTitle(selection.title, settingsStore.titleLanguage)} <- ${category.name}`,
  )
}

onMounted(async () => {
  await loadAniListMetadata()

  if (!templateStore.pendingStartupTemplateUrl) {
    return
  }

  remoteUrlInput.value = templateStore.pendingStartupTemplateUrl
  await importFromRemoteUrl(templateStore.pendingStartupTemplateUrl)
})
</script>

<template>
  <ConfigProvider>
    <TooltipProvider :delay-duration="120">
      <div class="min-h-screen bg-app-bg text-app-text">
        <div class="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <AppHeader
            v-model="theme"
            v-model:title-language="settingsStore.titleLanguage"
            :resolved-theme="resolvedTheme"
          />

          <main class="flex-1 py-8">
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

                    <GlobalFilterDialog
                      v-if="activeTemplate"
                      :model-value="activeTemplate.globalFilter"
                      :metadata="metadata"
                      :metadata-status="metadataStatus"
                      :metadata-error="metadataError"
                      @update:model-value="updateGlobalFilter"
                    />
                    <button
                      type="button"
                      class="shell-button"
                      :disabled="!activeTemplate"
                      @click="exportActiveTemplate"
                    >
                      Export JSON
                    </button>
                    <PngExportDialog
                      :template="activeTemplate"
                      :selection-by-category="activeTemplateSelections"
                      :resolved-theme="resolvedTheme"
                      :title-language="settingsStore.titleLanguage"
                    />
                    <button
                      type="button"
                      class="shell-button"
                      :disabled="!activeTemplate"
                      @click="resetActiveTemplate"
                    >
                      Reset
                    </button>
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
            </section>

            <section class="mt-6">
              <div
                v-if="!activeTemplate"
                class="rounded-[2rem] border border-dashed border-app-border/70 bg-app-surface/70 p-6 text-sm text-app-muted"
              >
                No active template is available yet.
              </div>

              <CategoryGrid
                v-else
                :categories="activeTemplate.categories"
                :selection-by-category="activeTemplateSelections"
                :global-filter="activeTemplate.globalFilter"
                :metadata="metadata"
                :metadata-status="metadataStatus"
                :metadata-error="metadataError"
                :title-language="settingsStore.titleLanguage"
                @add-category="addCategory"
                @update-category="updateCategory"
                @delete-category="deleteCategory"
                @reorder-categories="reorderCategories"
                @select-anime="selectCategoryAnime"
                @clear-selection="clearCategorySelection"
                @clear-all-selections="clearAllSelections"
              />
            </section>
          </main>

          <AppFooter />
        </div>
        <AppToastViewport />

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
                  <DialogTitle class="text-xl font-semibold tracking-tight text-app-text">
                    Load a template from a URL
                  </DialogTitle>
                  <DialogDescription class="text-sm leading-6 text-app-muted">
                    Paste a remote template URL to load it.
                  </DialogDescription>
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
      </div>
    </TooltipProvider>
  </ConfigProvider>
</template>
