<script setup lang="ts">
import {
  ToastClose,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport,
} from 'reka-ui'

import { useToastStore } from '@/stores/toasts'

const toastStore = useToastStore()

const toneClasses = {
  success: 'border-emerald-400/50 bg-emerald-500/10',
  error: 'border-rose-400/50 bg-rose-500/10',
  info: 'border-app-border/80 bg-app-surface/95',
} as const
</script>

<template>
  <ToastProvider>
    <ToastRoot
      v-for="toast in toastStore.items"
      :key="toast.id"
      :open="toast.open"
      :duration="toast.duration"
      :class="[
        'pointer-events-auto rounded-[1.5rem] border p-4 shadow-shell backdrop-blur',
        toneClasses[toast.tone],
      ]"
      @update:open="(open) => !open && toastStore.dismiss(toast.id)"
      @escape-key-down="toastStore.dismiss(toast.id)"
      @swipe-end="toastStore.dismiss(toast.id)"
      @pause="undefined"
      @resume="undefined"
      @close="toastStore.remove(toast.id)"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 space-y-1">
          <ToastTitle class="text-sm font-semibold text-app-text">
            {{ toast.title }}
          </ToastTitle>
          <ToastDescription
            v-if="toast.description"
            class="text-sm leading-6 text-app-muted"
          >
            {{ toast.description }}
          </ToastDescription>
        </div>

        <ToastClose
          class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-app-border/70 bg-app-bg/60 text-app-muted transition hover:border-app-accent/50 hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent/40"
          aria-label="Dismiss notification"
        >
          <span aria-hidden="true">×</span>
        </ToastClose>
      </div>
    </ToastRoot>

    <ToastPortal>
      <ToastViewport
        class="fixed bottom-4 right-4 z-[100] flex w-[min(92vw,24rem)] max-w-full flex-col gap-3 outline-none"
      />
    </ToastPortal>
  </ToastProvider>
</template>
