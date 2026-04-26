<script setup lang="ts">
import {
  DialogDescription,
  DialogTitle,
} from 'reka-ui'

withDefaults(defineProps<{
  eyebrow?: string | null
  title: string
  description?: string | null
}>(), {
  eyebrow: null,
  description: null,
})
</script>

<template>
  <div class="shrink-0 flex flex-col gap-5">
    <div>
      <p
        v-if="eyebrow"
        class="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-app-muted"
      >
        {{ eyebrow }}
      </p>
      <DialogTitle class="text-xl font-semibold tracking-tight text-app-text">
        {{ title }}
      </DialogTitle>
      <DialogDescription
        v-if="description"
        class="mt-2 max-w-2xl text-sm leading-6 text-app-muted"
      >
        {{ description }}
      </DialogDescription>
    </div>
  </div>
</template>
