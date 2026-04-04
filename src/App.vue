<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ConfigProvider, TooltipProvider } from 'radix-vue'

import { fetchAniListMetadata } from '@/api'
import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import AppToastViewport from '@/components/AppToastViewport.vue'
import CategoryGrid from '@/components/categories/CategoryGrid.vue'
import PngExportDialog from '@/components/export/PngExportDialog.vue'
import GlobalFilterPopover from '@/components/filters/GlobalFilterPopover.vue'
import { resolveAnimeTitle } from '@/lib/anime-title'
import { sanitizeDownloadFilename } from '@/lib/export-filename'
import { countConfiguredFilterFields } from '@/lib/filter-editor'
import { createBlankCategory } from '@/lib/template-factories'
import { stringifyTemplateExportPayload, TemplateValidationError } from '@/lib/template-validation'
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

const fileInput = ref<HTMLInputElement | null>(null)
const remoteUrlInput = ref(templateStore.pendingStartupTemplateUrl ?? '')
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

const groupedTemplates = computed(() => [
  {
    title: 'Predefined',
    description: 'Built-in starter templates.',
    templates: templateStore.predefinedTemplates,
  },
  {
    title: 'My Templates',
    description: 'Your templates and file imports.',
    templates: templateStore.userTemplates,
  },
  {
    title: 'Remote Imports',
    description: 'Templates loaded from remote JSON URLs.',
    templates: templateStore.remoteTemplates,
  },
])

const globalFilterRuleCount = computed(() =>
  activeTemplate.value ? countConfiguredFilterFields(activeTemplate.value.globalFilter) : 0,
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

  const shouldReset = window.confirm(
    activeTemplate.value.origin === 'predefined'
      ? `Reopen the built-in template "${activeTemplate.value.name}"? Local selections stay untouched.`
      : `Reset "${activeTemplate.value.name}"? This removes the local template, but keeps stored selections for other templates.`,
  )

  if (!shouldReset) {
    return
  }

  if (!templateStore.resetActiveTemplate()) {
    toastStore.error('Template reset failed.')
    return
  }

  toastStore.success('Template reset complete.')
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
    filter: FilterState
  },
) => {
  templateStore.updateActiveTemplate((template) => {
    const category = template.categories.find((entry) => entry.id === categoryId)

    if (!category) {
      return
    }

    category.name = value.name
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
    const shouldDelete = window.confirm(
      `Delete "${category.name}"? This removes ${affectedParts.join(' and ')}.`,
    )

    if (!shouldDelete) {
      return
    }
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

const clearActiveSelections = () => {
  if (!activeTemplate.value || activeSelectionCount.value === 0) {
    return
  }

  const shouldClearSelections = window.confirm(
    `Clear all selections for "${activeTemplate.value.name}"?`,
  )

  if (!shouldClearSelections) {
    return
  }

  selectionsStore.clearSelectionsForTemplate(activeTemplate.value.id)
  toastStore.success('Selections cleared for the active template.')
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
            <section class="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
              <article class="rounded-3xl border border-app-border/70 bg-app-surface/90 p-5 shadow-shell backdrop-blur">
                <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
                  Filter workspace
                </p>
                <h2 class="mt-3 text-xl font-semibold tracking-tight">
                  Current template
                </h2>
                <p class="mt-3 text-3xl font-semibold tracking-tight">
                  {{ activeTemplate?.name ?? 'None' }}
                </p>
                <p class="mt-3 text-sm leading-6 text-app-muted">
                  Shared filters apply to the selected template.
                </p>
              </article>

              <article class="rounded-3xl border border-app-border/70 bg-app-surface/90 p-5 shadow-shell backdrop-blur">
                <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
                  Filter workspace
                </p>
                <h2 class="mt-3 text-xl font-semibold tracking-tight">
                  Global Rules
                </h2>
                <p class="mt-3 text-3xl font-semibold tracking-tight">
                  {{ globalFilterRuleCount }}
                </p>
                <p class="mt-3 text-sm leading-6 text-app-muted">
                  Template-wide constraints disable matching category fields when they are already fixed.
                </p>
              </article>

              <article class="rounded-3xl border border-app-border/70 bg-app-surface/90 p-5 shadow-shell backdrop-blur">
                <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
                  Filter workspace
                </p>
                <h2 class="mt-3 text-xl font-semibold tracking-tight">
                  Selected slots
                </h2>
                <p class="mt-3 text-3xl font-semibold tracking-tight">
                  {{ activeSelectionCount }}
                </p>
                <p class="mt-3 text-sm leading-6 text-app-muted">
                  Fill categories with one anime each.
                </p>
              </article>
            </section>

            <section class="mt-6 grid gap-4">
              <article class="rounded-[2rem] border border-app-border/70 bg-app-surface/90 p-6 shadow-shell backdrop-blur sm:p-7">
                <div class="flex flex-col gap-5 border-b border-app-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
                      Template Workspace
                    </p>
                    <h2 class="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                      {{ activeTemplate?.name ?? 'No active template' }}
                    </h2>
                    <p class="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
                      Template management and global filter editing stay available here while category cards handle the main toplist layout below.
                    </p>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <GlobalFilterPopover
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
                      @click="createTemplate"
                    >
                      Create
                    </button>
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
                      @click="triggerFileImport"
                    >
                      Import File
                    </button>
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

                <div class="mt-5 grid gap-4 rounded-[1.5rem] bg-app-bg/60 p-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <dt class="text-xs font-medium uppercase tracking-[0.25em] text-app-muted">
                      Categories
                    </dt>
                    <dd class="mt-2 text-sm text-app-text">
                      {{ activeTemplate?.categories.length ?? 0 }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium uppercase tracking-[0.25em] text-app-muted">
                      Filled slots
                    </dt>
                    <dd class="mt-2 text-sm text-app-text">
                      {{ activeSelectionCount }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium uppercase tracking-[0.25em] text-app-muted">
                      Status
                    </dt>
                    <dd class="mt-2 text-sm text-app-text">
                      {{ activeTemplate ? 'Open for editing' : 'Choose a template to begin' }}
                    </dd>
                  </div>
                </div>

                <div class="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="shell-button"
                    :disabled="!activeTemplate || activeSelectionCount === 0"
                    @click="clearActiveSelections"
                  >
                    Clear selections
                  </button>
                </div>

                <div class="mt-6 rounded-[1.5rem] border border-app-border/70 bg-app-bg/50 p-4 sm:p-5">
                  <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
                    Remote import
                  </p>
                  <h3 class="mt-3 text-lg font-semibold tracking-tight text-app-text">
                    Load a template from a URL
                  </h3>
                  <p class="mt-2 text-sm leading-6 text-app-muted">
                    Paste a remote template URL to load it.
                  </p>

                  <label class="mt-5 block text-sm font-medium text-app-text">
                    Remote template URL
                    <input
                      v-model="remoteUrlInput"
                      type="url"
                      inputmode="url"
                      placeholder="https://example.com/template.json"
                      class="mt-2 w-full rounded-2xl border border-app-border/80 bg-app-bg/70 px-4 py-3 text-sm text-app-text outline-none transition focus:border-app-accent/60 focus:ring-2 focus:ring-app-accent/20"
                    >
                  </label>

                  <div class="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="shell-button"
                      :disabled="isImportingRemote"
                      @click="importFromRemoteUrl()"
                    >
                      {{ isImportingRemote ? 'Loading...' : 'Import remote template' }}
                    </button>
                  </div>
                </div>

                <div class="mt-6 space-y-4">
                  <article
                    v-for="group in groupedTemplates"
                    :key="group.title"
                    class="rounded-[1.5rem] border border-app-border/70 bg-app-surface/70 p-4"
                  >
                    <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 class="text-lg font-semibold tracking-tight">
                          {{ group.title }}
                        </h3>
                        <p class="mt-1 text-sm text-app-muted">
                          {{ group.description }}
                        </p>
                      </div>
                      <span class="text-xs font-medium uppercase tracking-[0.25em] text-app-muted">
                        {{ group.templates.length }} templates
                      </span>
                    </div>

                    <div
                      v-if="group.templates.length > 0"
                      class="mt-4 grid gap-3"
                    >
                      <button
                        v-for="template in group.templates"
                        :key="template.id"
                        type="button"
                        class="rounded-[1.25rem] border border-app-border/70 px-4 py-4 text-left transition hover:border-app-accent/50 hover:bg-app-elevated/60"
                        :class="template.id === activeTemplate?.id ? 'border-app-accent/70 bg-app-accentSoft/60' : 'bg-app-bg/40'"
                        @click="openTemplate(template.id)"
                      >
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p class="text-base font-semibold text-app-text">
                              {{ template.name }}
                            </p>
                          </div>
                          <div class="text-right text-sm text-app-muted">
                            <p>{{ template.categories.length }} categories</p>
                            <p>{{ selectionsStore.getSelectionCount(template.id) }} selections</p>
                          </div>
                        </div>
                      </button>
                    </div>

                    <p
                      v-else
                      class="mt-4 rounded-[1.25rem] bg-app-bg/50 px-4 py-3 text-sm text-app-muted"
                    >
                      No templates in this section yet.
                    </p>
                  </article>
                </div>
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
              />
            </section>
          </main>

          <AppFooter />
        </div>
        <AppToastViewport />
      </div>
    </TooltipProvider>
  </ConfigProvider>
</template>
