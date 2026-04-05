<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'

const open = defineModel<boolean>('open', { required: true })

defineProps<{
  title: string
  description: string
  confirmLabel: string
}>()

const emit = defineEmits<{
  confirm: []
}>()
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-app-border/80 bg-app-surface p-6 shadow-shell">
        <DialogTitle class="text-2xl font-semibold tracking-tight text-app-text">
          {{ title }}
        </DialogTitle>
        <DialogDescription class="mt-3 text-sm leading-6 text-app-muted">
          {{ description }}
        </DialogDescription>

        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <DialogClose as-child>
            <button
              type="button"
              class="shell-button"
            >
              Cancel
            </button>
          </DialogClose>
          <button
            type="button"
            class="shell-button border-red-500/40 bg-red-500/10 text-red-100 hover:border-red-400/60 hover:bg-red-500/20"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
