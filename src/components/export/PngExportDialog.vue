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

import { appConfig } from '@/config/app'
import { createPngExportFilename } from '@/lib/export-filename'
import {
  EXPORT_CATEGORIES_PER_ROW,
  EXPORT_FONT_SIZE_BODY,
  EXPORT_FONT_SIZE_CATEGORY_TITLE,
  EXPORT_FONT_SIZE_TEMPLATE_TITLE,
  EXPORT_IMAGE_WIDTH,
  renderTemplatePng,
} from '@/lib/export-image'
import type {
  AnimeTitleLanguage,
  CategorySelectionMap,
  Template,
} from '@/types'

const props = defineProps<{
  template: Template | null
  selectionByCategory: CategorySelectionMap
  resolvedTheme: 'light' | 'dark'
  titleLanguage: AnimeTitleLanguage
}>()

const isOpen = ref(false)
const author = ref('Anonymous')
const previewUrl = ref<string | null>(null)
const previewBlob = ref<Blob | null>(null)
const previewWidth = ref(0)
const previewHeight = ref(0)
const isRendering = ref(false)
const renderError = ref<string | null>(null)

let renderRequestId = 0

const layoutSummary = computed(
  () =>
    `${EXPORT_IMAGE_WIDTH}px wide, ${EXPORT_CATEGORIES_PER_ROW} categories per row, title ${EXPORT_FONT_SIZE_TEMPLATE_TITLE}px, card titles ${EXPORT_FONT_SIZE_CATEGORY_TITLE}px, body ${EXPORT_FONT_SIZE_BODY}px.`,
)

const filename = computed(() =>
  props.template ? createPngExportFilename(props.template.name) : 'anime-toplist.png',
)

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
      author: author.value,
    })

    if (currentRequestId !== renderRequestId) {
      return
    }

    revokePreviewUrl()
    previewBlob.value = renderedImage.blob
    previewUrl.value = URL.createObjectURL(renderedImage.blob)
    previewWidth.value = renderedImage.width
    previewHeight.value = renderedImage.height
  } catch (error) {
    if (currentRequestId !== renderRequestId) {
      return
    }

    previewBlob.value = null
    revokePreviewUrl()
    renderError.value = error instanceof Error ? error.message : 'PNG export failed.'
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

  void generatePreview()
})

watch(
  () => [props.template, props.selectionByCategory, props.resolvedTheme, props.titleLanguage, author.value],
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
        Export PNG
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
              PNG Export
            </p>
            <DialogTitle class="mt-3 text-2xl font-semibold tracking-tight text-app-text">
              Render the current toplist
            </DialogTitle>
            <DialogDescription class="mt-3 max-w-3xl text-sm leading-6 text-app-muted">
              The preview uses browser-side canvas rendering,
              so it stays compatible with static hosting while matching the current category order.
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
                  placeholder="Anonymous"
                >
              </label>

              <dl class="mt-4 space-y-3 text-sm text-app-muted">
                <div>
                  <dt class="font-medium text-app-text">
                    Output file
                  </dt>
                  <dd class="mt-1 break-all">
                    {{ filename }}
                  </dd>
                </div>
                <div>
                  <dt class="font-medium text-app-text">
                    Layout rules
                  </dt>
                  <dd class="mt-1">
                    {{ layoutSummary }}
                  </dd>
                </div>
                <div>
                  <dt class="font-medium text-app-text">
                    Watermark
                  </dt>
                  <dd class="mt-1">
                    Generated with {{ appConfig.exportSiteUrl }}
                  </dd>
                </div>
                <div>
                  <dt class="font-medium text-app-text">
                    Preview size
                  </dt>
                  <dd class="mt-1">
                    {{ previewWidth > 0 ? `${previewWidth} × ${previewHeight}` : 'Generate a preview to inspect dimensions.' }}
                  </dd>
                </div>
              </dl>
            </article>

            <article class="rounded-[1.5rem] border border-app-border/70 bg-app-bg/50 p-4">
              <h3 class="text-lg font-semibold tracking-tight text-app-text">
                Copy guidance
              </h3>
              <p class="mt-3 text-sm leading-6 text-app-muted">
                Use <span class="font-medium text-app-text">Download PNG</span> for the reliable sharing path.
                Browser support for copying an image directly from a preview varies,
                so manual download is the safe option.
              </p>
              <p class="mt-3 text-sm leading-6 text-app-muted">
                If a cover image cannot be loaded,
                the renderer keeps the slot size and replaces it with a themed placeholder so the grid stays aligned.
              </p>
            </article>

            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="shell-button"
                :disabled="isRendering"
                @click="generatePreview"
              >
                {{ isRendering ? 'Rendering...' : 'Refresh preview' }}
              </button>
              <button
                type="button"
                class="shell-button shell-button-active"
                :disabled="!previewBlob || isRendering"
                @click="downloadPreview"
              >
                Download PNG
              </button>
            </div>

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
                Generated preview
              </h3>
            </div>

            <div class="mt-4 rounded-[1.25rem] border border-app-border/70 bg-app-surface/80 p-3">
              <div
                v-if="previewUrl"
                class="overflow-hidden rounded-[1rem] border border-app-border/70 bg-app-bg/60"
              >
                <img
                  :src="previewUrl"
                  :alt="template ? `${template.name} PNG preview` : 'PNG preview'"
                  class="block h-auto w-full"
                >
              </div>

              <div
                v-else
                class="flex min-h-72 items-center justify-center rounded-[1rem] border border-dashed border-app-border/70 bg-app-bg/40 px-6 py-12 text-center text-sm leading-6 text-app-muted"
              >
                {{ isRendering ? 'Rendering the PNG preview...' : 'Open the export dialog to generate a preview.' }}
              </div>
            </div>
          </article>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
