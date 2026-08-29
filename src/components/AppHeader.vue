<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  ToolbarRoot,
} from 'reka-ui'
import { computed, onMounted, ref } from 'vue'

import AppAccountMenu from '@/components/AppAccountMenu.vue'
import ChangelogDialog from '@/components/ChangelogDialog.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import ToolbarIconButton from '@/components/ToolbarIconButton.vue'
import ImageExportDialog from '@/components/export/ImageExportDialog.vue'
import CameraIcon from '@/components/icons/CameraIcon.vue'
import MenuIcon from '@/components/icons/MenuIcon.vue'
import DialogCloseButton from '@/components/DialogCloseButton.vue'
import TemplateActionsMenu from '@/components/templates/TemplateActionsMenu.vue'
import TemplateRemoteImportDialog from '@/components/templates/TemplateRemoteImportDialog.vue'
import TemplateSwitcherMenu from '@/components/templates/TemplateSwitcherMenu.vue'
import { changelogEntries, latestChangelogVersion } from '@/config/changelog'
import { resolveChangelogAutoOpen } from '@/lib/changelog'
import { useAniListAuthStore } from '@/stores/anilist-auth'
import { useSettingsStore } from '@/stores/settings'
import { useTemplateManagement } from '@/components/templates/useTemplateManagement'

const aniListAuthStore = useAniListAuthStore()
const settingsStore = useSettingsStore()
const {
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
  remoteUrlInput,
  triggerFileImport,
} = useTemplateManagement()

const isMobileMenuOpen = ref(false)
const isImageExportOpen = ref(false)
const isChangelogOpen = ref(false)

// Captured before anything marks the changelog as seen,
// so the `New` badges stay visible for the rest of the session.
const seenChangelogVersion = ref(settingsStore.lastShownChangelogVersion)

const activeTemplateName = computed(() => activeTemplate.value?.name ?? 'No active template')

const recordChangelogVersion = (version: string | null) => {
  if (version === null) {
    return
  }

  settingsStore.setLastShownChangelogVersion(version)
}

const openChangelog = () => {
  recordChangelogVersion(latestChangelogVersion)
  isChangelogOpen.value = true
}

// Startup records through `resolveChangelogAutoOpen` alone,
// so opening the popup automatically does not record a second time.
onMounted(() => {
  const { shouldOpen, versionToRecord } = resolveChangelogAutoOpen(
    changelogEntries,
    seenChangelogVersion.value,
  )

  recordChangelogVersion(versionToRecord)

  if (shouldOpen) {
    isChangelogOpen.value = true
  }
})
</script>

<template>
  <header class="sticky top-0 z-30">
    <ToolbarRoot
      as="div"
      class="rounded-b-[2rem] rounded-t-none border border-t-0 border-app-border/70 bg-app-surface/85 px-6 py-3 shadow-shell backdrop-blur-xl sm:px-7"
    >
      <div class="flex items-center gap-2 lg:hidden">
        <button
          type="button"
          class="shell-button inline-flex h-11 w-11 shrink-0 items-center justify-center p-0"
          aria-label="Open toolbar menu"
          @click="isMobileMenuOpen = true"
        >
          <MenuIcon class="h-5 w-5" />
        </button>

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold tracking-tight text-app-text">
            {{ activeTemplateName }}
          </p>
        </div>

        <ToolbarIconButton
          label="Export image"
          :disabled="!activeTemplate"
          @click="isImageExportOpen = true"
        >
          <CameraIcon class="h-5 w-5" />
        </ToolbarIconButton>

        <AppAccountMenu @show-changelog="openChangelog" />
      </div>

      <div class="hidden items-center gap-3 lg:flex">
        <div class="min-w-0 shrink-0 max-w-64">
          <p class="truncate text-base font-semibold tracking-tight text-app-text">
            Anime Toplist Builder
          </p>
        </div>

        <TemplateSwitcherMenu
          class="min-w-0"
          @create="createTemplate"
          @import-file="triggerFileImport"
          @import-remote="openRemoteImport"
        />

        <TemplateActionsMenu
          :active-template="activeTemplate"
          @export-json="exportActiveTemplate"
          @create="createTemplate"
          @import-file="triggerFileImport"
          @import-remote="openRemoteImport"
          @delete-template="deleteActiveTemplate"
        />

        <div class="ml-auto flex items-center gap-2">
          <ToolbarIconButton
            label="Export image"
            :disabled="!activeTemplate"
            @click="isImageExportOpen = true"
          >
            <CameraIcon class="h-5 w-5" />
          </ToolbarIconButton>

          <AppAccountMenu @show-changelog="openChangelog" />
        </div>
      </div>
    </ToolbarRoot>

    <ImageExportDialog
      v-model:open="isImageExportOpen"
      :template="activeTemplate"
      :selection-by-category="activeTemplateSelections"
      :default-author="aniListAuthStore.username ?? undefined"
      :default-author-source="aniListAuthStore.isAuthenticated ? 'anilist' : 'manual'"
      hide-trigger
    />

    <ChangelogDialog
      v-model:open="isChangelogOpen"
      :entries="changelogEntries"
      :seen-version="seenChangelogVersion"
    />

    <input
      ref="fileInput"
      type="file"
      accept="application/json,.json"
      class="hidden"
      @change="importFromFile"
    >

    <TemplateRemoteImportDialog
      v-model:open="isRemoteImportOpen"
      :remote-url="remoteUrlInput"
      :is-importing="isImportingRemote"
      @update:remote-url="remoteUrlInput = $event"
      @submit="importFromRemoteUrl()"
    />

    <DialogRoot v-model:open="isMobileMenuOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden" />
        <DialogContent class="fixed inset-y-0 left-0 z-50 flex w-[min(88vw,24rem)] flex-col border-r border-app-border/80 bg-app-surface p-5 shadow-shell lg:hidden">
          <DialogCloseButton />

          <div class="pr-14">
            <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
              Anime Toplist Builder
            </p>
            <h2 class="mt-3 text-xl font-semibold tracking-tight text-app-text">
              {{ activeTemplateName }}
            </h2>
          </div>

          <div class="mt-6 flex flex-col gap-3">
            <TemplateSwitcherMenu
              @create="createTemplate(); isMobileMenuOpen = false"
              @import-file="triggerFileImport(); isMobileMenuOpen = false"
              @import-remote="openRemoteImport(); isMobileMenuOpen = false"
            />

            <button
              type="button"
              class="shell-button justify-start"
              :disabled="!activeTemplate"
              @click="exportActiveTemplate(); isMobileMenuOpen = false"
            >
              Export template JSON
            </button>
            <button
              type="button"
              class="shell-button justify-start"
              :disabled="!activeTemplate"
              @click="isImageExportOpen = true; isMobileMenuOpen = false"
            >
              Export image
            </button>
            <button
              type="button"
              class="shell-button justify-start"
              @click="createTemplate(); isMobileMenuOpen = false"
            >
              Create blank template
            </button>
            <button
              type="button"
              class="shell-button justify-start"
              @click="triggerFileImport(); isMobileMenuOpen = false"
            >
              Import template from file
            </button>
            <button
              type="button"
              class="shell-button justify-start"
              @click="openRemoteImport(); isMobileMenuOpen = false"
            >
              Import template from URL
            </button>
            <button
              type="button"
              class="shell-button justify-start border-red-500/40 bg-red-500/10 text-app-text hover:border-red-400/60 hover:bg-red-500/20"
              :disabled="!activeTemplate"
              @click="deleteActiveTemplate(); isMobileMenuOpen = false"
            >
              Delete template
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <ConfirmationDialog
      v-model:open="isConfirmationOpen"
      :title="confirmationState?.title ?? 'Confirm action'"
      :description="confirmationState?.description ?? ''"
      :confirm-label="confirmationState?.confirmLabel ?? 'Confirm'"
      @confirm="confirmAction"
    />
  </header>
</template>
