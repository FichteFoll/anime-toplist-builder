<script setup lang="ts">
import {
  DialogClose,
  DialogDescription,
  DialogTitle,
} from 'reka-ui'

defineProps<{
  eyebrow: string
  title: string
  description?: string | null
}>()
</script>

<template>
  <div class="shrink-0 flex flex-col gap-5 border-b border-app-border/70 pb-5 lg:flex-row lg:items-start lg:justify-between">
    <div>
      <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
        {{ eyebrow }}
      </p>
      <DialogTitle class="mt-3 text-xl font-semibold tracking-tight text-app-text">
        {{ title }}
      </DialogTitle>
      <DialogDescription
        v-if="description"
        class="mt-2 max-w-2xl text-sm leading-6 text-app-muted"
      >
        {{ description }}
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
</template>
