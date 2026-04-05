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
import { computed, ref, watch } from 'vue'

import type { Template } from '@/types'
import { isNonBlankName } from '@/lib/filter-editor'

const props = defineProps<{
  template: Template
}>()

const emit = defineEmits<{
  save: [value: { name: string, description: string }]
}>()

const open = ref(false)
const draftName = ref(props.template.name)
const draftDescription = ref(props.template.description)

const hasValidName = computed(() => isNonBlankName(draftName.value))

const resetDraft = () => {
  draftName.value = props.template.name
  draftDescription.value = props.template.description
}

watch(open, (isOpen) => {
  if (isOpen) {
    resetDraft()
  }
})

watch(
  () => props.template,
  () => {
    if (!open.value) {
      resetDraft()
    }
  },
  { deep: true },
)

const save = () => {
  const nextName = draftName.value.trim()
  const nextDescription = draftDescription.value.trim()

  if (!isNonBlankName(nextName)) {
    return
  }

  emit('save', {
    name: nextName,
    description: nextDescription,
  })
  open.value = false
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger as-child>
      <button
        type="button"
        class="shell-button"
        :disabled="!template"
        :aria-label="`Edit template ${template.name}`"
      >
        Edit template
      </button>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(96vw,42rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell">
        <div class="shrink-0 space-y-2 border-b border-app-border/70 pb-5">
          <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
            Template editor
          </p>
          <DialogTitle class="text-xl font-semibold tracking-tight text-app-text">
            {{ template.name }}
          </DialogTitle>
          <DialogDescription class="text-sm leading-6 text-app-muted">
            Update the template title and summary.
          </DialogDescription>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto pr-1 pt-5">
          <label class="mb-5 block space-y-2">
            <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
              Template name
            </span>
            <input
              v-model="draftName"
              type="text"
              required
              class="shell-input"
              placeholder="My template"
            >
          </label>

          <label class="mb-5 block space-y-2">
            <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
              Description
            </span>
            <textarea
              v-model="draftDescription"
              rows="3"
              class="shell-input min-h-0 resize-none"
              placeholder="Short context for this template"
            />
          </label>

          <div class="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="shell-button"
              @click="resetDraft"
            >
              Reset draft
            </button>
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
              class="shell-button shell-button-active"
              :disabled="!hasValidName"
              @click="save"
            >
              Save template
            </button>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
