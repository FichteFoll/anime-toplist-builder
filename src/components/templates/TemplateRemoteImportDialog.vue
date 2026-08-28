<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
} from 'reka-ui'

import DialogCloseButton from '@/components/DialogCloseButton.vue'

const open = defineModel<boolean>('open', { required: true })

defineProps<{
  remoteUrl: string
  isImporting: boolean
}>()

const emit = defineEmits<{
  'update:remoteUrl': [value: string]
  submit: []
}>()

const updateRemoteUrl = (event: Event) => {
  emit('update:remoteUrl', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(96vw,38rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell">
        <DialogCloseButton />

        <div class="shrink-0 border-b border-app-border/70 pb-5 pr-24">
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
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto pr-1 pt-5">
          <label class="block space-y-2 text-sm font-medium text-app-text">
            <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
              Remote template URL
            </span>
            <input
              :value="remoteUrl"
              type="url"
              inputmode="url"
              placeholder="https://example.com/template.json"
              class="shell-input"
              @input="updateRemoteUrl"
            >
          </label>

          <div class="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              class="shell-button shell-button-active"
              :disabled="isImporting"
              @click="emit('submit')"
            >
              {{ isImporting ? 'Loading...' : 'Import remote template' }}
            </button>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
