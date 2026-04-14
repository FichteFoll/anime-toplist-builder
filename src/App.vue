<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ConfigProvider, TooltipProvider } from 'reka-ui'

import { fetchAniListMetadata } from '@/api'
import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import AppToastViewport from '@/components/AppToastViewport.vue'
import CategoryGrid from '@/components/categories/CategoryGrid.vue'
import TemplateManagementSection from '@/components/templates/TemplateManagementSection.vue'
import { countConfiguredFilterFields } from '@/lib/filter-editor'
import { getSelectionDisplayLabel } from '@/lib/song-selection'
import { createBlankCategory } from '@/lib/template-factories'
import { useConfirmationDialog } from '@/composables/useConfirmationDialog'
import { useAniListAuthStore } from '@/stores/anilist-auth'
import { useSelectionsStore } from '@/stores/selections'
import { useSettingsStore } from '@/stores/settings'
import { useTemplateStore } from '@/stores/templates'
import { useToastStore } from '@/stores/toasts'
import { CategoryEntityKind, ThemeType, type AniListMetadata, type CategorySelection, type FilterState } from '@/types'

const settingsStore = useSettingsStore()
const templateStore = useTemplateStore()
const selectionsStore = useSelectionsStore()
const toastStore = useToastStore()
const aniListAuthStore = useAniListAuthStore()
const {
  isOpen: isConfirmationOpen,
  state: confirmationState,
  requestConfirmation,
  confirmAction,
} = useConfirmationDialog()
const activeTemplate = computed(() => templateStore.activeTemplate)
const activeTemplateSelections = computed(() =>
  selectionsStore.getTemplateSelections(templateStore.activeTemplateId),
)
const activeSelectionCount = computed(() =>
  selectionsStore.getSelectionCount(templateStore.activeTemplateId),
)
const metadata = ref<AniListMetadata | null>(null)
const metadataStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const metadataError = ref<string | null>(null)

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


const updateCategory = (
  categoryId: string,
  value: {
    name: string
    description: string
    filter: FilterState
    entityKind: CategoryEntityKind
    songFilter: { types: ThemeType[] }
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
    category.entityKind = value.entityKind
    category.songFilter = value.songFilter
  })

  selectionsStore.pruneSelectionsForTemplates(templateStore.templates)
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
        ? `the saved selection "${getSelectionDisplayLabel(selection, settingsStore.titleLanguage)}"`
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

const selectCategorySelection = (categoryId: string, selection: CategorySelection) => {
  if (!activeTemplate.value) {
    return
  }

  const category = activeTemplate.value.categories.find((entry) => entry.id === categoryId)

  if (!category) {
    return
  }

  selectionsStore.setCategorySelection(activeTemplate.value.id, categoryId, selection)
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
}

onMounted(async () => {
  await aniListAuthStore.completeOAuthCallback()
  await loadAniListMetadata()
})
</script>

<template>
  <ConfigProvider>
    <TooltipProvider :delay-duration="120">
      <div class="min-h-screen bg-app-bg text-app-text">
        <div class="mx-auto flex min-h-screen max-w-screen-2xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <AppHeader />

          <main class="flex-1 py-8">
            <TemplateManagementSection />

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
                @add-category="addCategory"
                @update-category="updateCategory"
                @delete-category="deleteCategory"
                @reorder-categories="reorderCategories"
                @select-selection="selectCategorySelection"
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
      </div>
    </TooltipProvider>
  </ConfigProvider>
</template>
