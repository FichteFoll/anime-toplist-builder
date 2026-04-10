<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { createPngExportFilename } from '@/lib/export-filename'
import {
  CATEGORIES_PER_ROW_LANDSCAPE,
  CATEGORIES_PER_ROW_PORTRAIT,
  renderTemplatePng,
} from '@/lib/export-image'
import { useAniListAuthStore } from '@/stores/anilist-auth'
import { useSettingsStore } from '@/stores/settings'
import {
  ExportImageLayout,
  type AnimeTitleLanguage,
  type CategorySelectionMap,
  type Template,
} from '@/types'
import { ResolvedTheme } from '@/lib/theme'

const props = defineProps<{
  template: Template | null
  selectionByCategory: CategorySelectionMap
  resolvedTheme: ResolvedTheme
  titleLanguage: AnimeTitleLanguage
  defaultAuthor?: string
  defaultAuthorSource?: 'anilist' | 'manual'
}>()

const aniListAuthStore = useAniListAuthStore()
const settingsStore = useSettingsStore()
const isOpen = ref(false)
const author = ref('')
const hideAuthor = ref(false)
const layout = ref<ExportImageLayout>(ExportImageLayout.Portrait)
const previewUrl = ref<string | null>(null)
const previewBlob = ref<Blob | null>(null)
const isRendering = ref(false)
const renderError = ref<string | null>(null)

let renderRequestId = 0

const defaultAuthor = computed(() => props.defaultAuthor?.trim() || 'Anonymous')
const resolvedAuthor = computed(() => author.value.trim() || defaultAuthor.value)
const defaultLayout = computed<ExportImageLayout>(() =>
  props.template && props.template.categories.length >= 12
    ? ExportImageLayout.Landscape
    : ExportImageLayout.Portrait,
)
const showAniListBadge = computed(
  () =>
    !hideAuthor.value &&
    props.defaultAuthorSource === 'anilist' &&
    aniListAuthStore.isAuthenticated &&
    resolvedAuthor.value === defaultAuthor.value,
)

const filename = computed(() =>
  props.template
    ? createPngExportFilename(props.template.name, hideAuthor.value ? undefined : resolvedAuthor.value)
    : 'anime-toplist.png',
)

const resetExportForm = () => {
  author.value = settingsStore.exportImageAuthor || ''
  hideAuthor.value = settingsStore.exportImageHideAuthor
  layout.value = defaultLayout.value
}

const revokePreviewUrl = () => {
  if (!previewUrl.value) {
    return
  }

  URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
}

const generatePreview = async () => {
  if (!isOpen.value || !props.template) {
    return
  }

  const currentRequestId = ++renderRequestId

  isRendering.value = true
  renderError.value = null

  try {
    const renderedImage = await renderTemplatePng({
      template: props.template,
      selectionByCategory: props.selectionByCategory,
      theme: props.resolvedTheme,
      titleLanguage: props.titleLanguage,
      layout: layout.value,
      author: hideAuthor.value ? '' : resolvedAuthor.value,
      hideAuthor: hideAuthor.value,
      showAniListBadge: showAniListBadge.value,
    })

    if (currentRequestId !== renderRequestId) {
      return
    }

    revokePreviewUrl()
    previewBlob.value = renderedImage.blob
    previewUrl.value = URL.createObjectURL(renderedImage.blob)
  } catch (error) {
    if (currentRequestId !== renderRequestId) {
      return
    }

    previewBlob.value = null
    revokePreviewUrl()
    renderError.value = error instanceof Error ? error.message : 'Image export failed.'
  } finally {
    if (currentRequestId === renderRequestId) {
      isRendering.value = false
    }
  }
}

const downloadPreview = () => {
  if (!previewBlob.value) {
    return
  }

  const downloadUrl = URL.createObjectURL(previewBlob.value)
  const anchor = document.createElement('a')

  anchor.href = downloadUrl
  anchor.download = filename.value
  anchor.click()

  URL.revokeObjectURL(downloadUrl)
}

watch(isOpen, (open) => {
  if (!open) {
    return
  }

  resetExportForm()
  void generatePreview()
})

watch(author, (value) => {
  settingsStore.setExportImageAuthor(value)
})

watch(hideAuthor, (value) => {
  settingsStore.setExportImageHideAuthor(value)
})

watch(
  () => [
    props.template,
    props.selectionByCategory,
    props.resolvedTheme,
    props.titleLanguage,
    layout.value,
    author.value,
    hideAuthor.value,
    showAniListBadge.value,
  ],
  () => {
    if (!isOpen.value) {
      return
    }

    void generatePreview()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  revokePreviewUrl()
})
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <DialogTrigger as-child>
      <button
        type="button"
        class="shell-button"
        :disabled="!template"
      >
        Export image
      </button>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(96vw,76rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[2rem] border border-app-border/80 bg-app-surface p-6 shadow-shell sm:p-7"
      >
        <div class="flex flex-col gap-4 border-b border-app-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
              Image Export
            </p>
            <DialogTitle class="mt-3 text-2xl font-semibold tracking-tight text-app-text">
              Generate toplist selection image
            </DialogTitle>
            <DialogDescription class="mt-2 text-sm leading-6 text-app-muted">
              Set the author name, choose a layout, preview the rendered image, and download the final export.
            </DialogDescription>
          </div>

          <DialogClose as-child>
            <button
              type="button"
              class="shell-button self-start"
            >
              Close
            </button>
          </DialogClose>
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div class="space-y-4">
            <article class="rounded-[1.5rem] border border-app-border/70 bg-app-bg/50 p-4">
              <h3 class="text-lg font-semibold tracking-tight text-app-text">
                Export details
              </h3>
              <label class="mt-4 block space-y-2">
                <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
                  Author name
                </span>
                <input
                  v-model="author"
                  type="text"
                  maxlength="80"
                  class="shell-input"
                  :placeholder="defaultAuthor"
                  :disabled="hideAuthor"
                >
              </label>

              <label class="mt-4 flex items-center gap-3 rounded-[1rem] border border-app-border/70 bg-app-surface/70 px-3 py-3 text-sm text-app-text">
                <input
                  v-model="hideAuthor"
                  type="checkbox"
                  class="h-4 w-4 rounded border-app-border bg-app-bg"
                >
                <span>Hide author in exported image</span>
              </label>

              <p
                v-if="showAniListBadge"
                class="mt-3 text-sm leading-6 text-app-muted"
              >
                The export will mark this author as your connected AniList account.
              </p>

              <div class="mt-4 space-y-2">
                <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
                  Image layout
                </span>
                <div class="grid gap-2 sm:grid-cols-2">
                  <label class="flex cursor-pointer items-start gap-3 rounded-[1rem] border border-app-border/70 bg-app-surface/70 p-3 text-sm text-app-text transition hover:border-app-accent/40 hover:bg-app-elevated/40">
                    <input
                      v-model="layout"
                      value="portrait"
                      type="radio"
                      name="image-layout"
                      class="mt-1 h-4 w-4 border-app-border text-app-accent focus:ring-app-accent"
                    >
                    <div>
                      <p class="font-medium text-app-text">Portrait</p>
                      <p class="mt-1 text-sm leading-6 text-app-muted">
                        {{ `${CATEGORIES_PER_ROW_PORTRAIT} columns, better for shorter templates.` }}
                      </p>
                    </div>
                  </label>

                  <label class="flex cursor-pointer items-start gap-3 rounded-[1rem] border border-app-border/70 bg-app-surface/70 p-3 text-sm text-app-text transition hover:border-app-accent/40 hover:bg-app-elevated/40">
                    <input
                      v-model="layout"
                      value="landscape"
                      type="radio"
                      name="image-layout"
                      class="mt-1 h-4 w-4 border-app-border text-app-accent focus:ring-app-accent"
                    >
                    <div>
                      <p class="font-medium text-app-text">Landscape</p>
                      <p class="mt-1 text-sm leading-6 text-app-muted">
                        {{ `${CATEGORIES_PER_ROW_LANDSCAPE} columns, better for larger templates.` }}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <dl class="mt-4 space-y-3 text-sm text-app-muted">
                <div>
                  <dt class="font-medium text-app-text">
                    Output file
                  </dt>
                  <dd class="mt-1 break-all">
                    {{ filename }}
                  </dd>
                </div>
              </dl>
            </article>

            <article class="rounded-[1.5rem] border border-app-border/70 bg-app-bg/50 p-4">
              <h3 class="text-lg font-semibold tracking-tight text-app-text">
                Copy guidance
              </h3>
              <p class="mt-3 text-sm leading-6 text-app-muted">
                To copy the image to your clipboard, open the browser context menu and select <span class="font-medium text-app-text">Copy Image</span>.
              </p>
            </article>

            <p
              v-if="renderError"
              class="rounded-[1.25rem] border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              {{ renderError }}
            </p>
          </div>

          <article class="rounded-[1.5rem] border border-app-border/70 bg-app-bg/50 p-4">
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-lg font-semibold tracking-tight text-app-text">
                Preview
              </h3>
            </div>

            <div
              v-if="previewUrl"
              class="mt-4 overflow-hidden rounded-[1rem] border border-app-border/70 bg-app-bg/60"
            >
              <img
                :src="previewUrl"
                :alt="template ? `${template.name} image preview` : 'Image preview'"
                class="block h-auto w-full"
              >
            </div>

            <div
              v-else
              class="mt-4 flex min-h-72 items-center justify-center rounded-[1rem] border border-dashed border-app-border/70 bg-app-bg/40 px-6 py-12 text-center text-sm leading-6 text-app-muted"
            >
              {{ isRendering ? 'Rendering the image preview...' : 'The image preview updates automatically.' }}
            </div>
          </article>
        </div>

        <div class="sticky bottom-0 -mx-6 mt-6 border-t border-app-border/70 bg-app-surface/95 px-6 pb-6 pt-4 backdrop-blur-sm">
          <div class="flex justify-end">
            <button
              type="button"
              class="shell-button shell-button-active"
              :disabled="!previewBlob || isRendering"
              @click="downloadPreview"
            >
              Download image
            </button>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
