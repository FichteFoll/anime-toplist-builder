<script setup lang="ts">
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  description: string
  videoUrl: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const failed = ref(false)

watch(
  () => props.open,
  () => {
    failed.value = false
  },
)
</script>

<template>
  <DialogRoot
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[min(94vw,56rem)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell">
        <DialogTitle class="text-xl font-semibold tracking-tight text-app-text">
          {{ title }}
        </DialogTitle>
        <DialogDescription class="mt-2 text-sm leading-6 text-app-muted">
          {{ description }}
        </DialogDescription>

        <div class="mt-4 overflow-hidden rounded-[1.25rem] border border-app-border/70 bg-app-bg/60 p-3">
          <video
            v-if="!failed"
            :src="videoUrl"
            controls
            preload="metadata"
            class="max-h-[70vh] w-full rounded-[1rem] bg-black"
            @error="failed = true"
          />
          <p
            v-else
            class="px-4 py-12 text-center text-sm leading-6 text-app-muted"
          >
            The preview video could not be loaded.
          </p>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
