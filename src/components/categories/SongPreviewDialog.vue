<script setup lang="ts">
import {
  DialogContent,
  DialogDescription,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  description: string
  videoUrl: string
  videoHeight: number | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const failed = ref(false)
const viewportWidth = ref(0)
const viewportHeight = ref(0)

const updateViewportSize = () => {
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
}

const previewFrameStyle = computed(() => {
  if (!props.videoHeight || viewportWidth.value === 0 || viewportHeight.value === 0) {
    return undefined
  }

  const naturalHeight = props.videoHeight
  const naturalWidth = naturalHeight * (16 / 9)
  const maxWidth = Math.floor(viewportWidth.value * 0.94) - 40
  const maxHeight = viewportHeight.value - 220
  const scale = Math.min(1, maxWidth / naturalWidth, maxHeight / naturalHeight)

  return {
    width: `${Math.floor(naturalWidth * scale)}px`,
    height: `${Math.floor(naturalHeight * scale)}px`,
  }
})

watch(
  () => props.open,
  () => {
    failed.value = false
  },
)

onMounted(() => {
  updateViewportSize()
  window.addEventListener('resize', updateViewportSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportSize)
})
</script>

<template>
  <DialogRoot
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 w-fit max-w-[94vw] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell max-h-[calc(100dvh-2rem)] overflow-hidden">
        <div class="flex items-start justify-between gap-4">
          <div>
            <DialogTitle class="text-xl font-semibold tracking-tight text-app-text">
              {{ title }}
            </DialogTitle>
            <DialogDescription class="mt-2 text-sm leading-6 text-app-muted">
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

        <div
          class="mt-4 overflow-hidden"
          :style="previewFrameStyle"
        >
          <video
            v-if="!failed"
            :src="videoUrl"
            controls
            preload="metadata"
            class="h-full w-full bg-black object-contain"
            @error="failed = true"
          />
          <p
            v-else
            class="flex h-full items-center justify-center px-4 text-center text-sm leading-6 text-app-muted"
          >
            The preview video could not be loaded.
          </p>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
