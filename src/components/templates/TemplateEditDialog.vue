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

import FilterEditor from '@/components/filters/FilterEditor.vue'
import { countConfiguredFilterFields, isNonBlankName } from '@/lib/filter-editor'
import type { FilterState, Template } from '@/types'

const props = defineProps<{
  template: Template
}>()

const emit = defineEmits<{
  save: [value: { name: string, description: string, filter: FilterState }]
  delete: []
}>()

const open = ref(false)
const draftName = ref(props.template.name)
const draftDescription = ref(props.template.description)
const draftFilter = ref(cloneFilter(props.template.globalFilter))

const hasValidName = computed(() => isNonBlankName(draftName.value))
const configuredFilterCount = computed(() => countConfiguredFilterFields(draftFilter.value))
const canDeleteTemplate = computed(() => props.template.origin !== 'predefined' && props.template.origin !== 'imported-url')

function cloneFilter(filter: FilterState): FilterState {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(filter)
    } catch {
      // Vue props can be proxies, which structuredClone rejects.
      // Fall back to JSON cloning for this plain filter state.
    }
  }

  return JSON.parse(JSON.stringify(filter)) as FilterState
}

const resetDraft = () => {
  draftName.value = props.template.name
  draftDescription.value = props.template.description
  draftFilter.value = cloneFilter(props.template.globalFilter)
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
    filter: cloneFilter(draftFilter.value),
  })
  open.value = false
}

const requestDelete = () => {
  open.value = false
  emit('delete')
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger as-child>
      <button
        type="button"
        class="shell-button"
        :disabled="!template"
        :aria-label="`Open template editor for ${template.name}`"
      >
        Edit template
        <span class="ml-2 rounded-full bg-app-accentSoft px-2 py-1 text-xs text-app-text">
          {{ configuredFilterCount }} rule{{ configuredFilterCount === 1 ? '' : 's' }}
        </span>
      </button>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(96vw,72rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell">
        <div class="shrink-0 flex items-start justify-between gap-4 border-b border-app-border/70 pb-5">
          <div class="space-y-2">
            <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
              Edit Template
            </p>
            <DialogTitle class="text-xl font-semibold tracking-tight text-app-text">
              {{ template.name }}
            </DialogTitle>
            <DialogDescription class="text-sm leading-6 text-app-muted">
              Update the template title, summary, and shared filter rules.
            </DialogDescription>
          </div>

          <DialogClose as-child>
            <button
              type="button"
              class="shell-button"
            >
              Close
            </button>
          </DialogClose>
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

          <div class="my-5 border-t border-app-border/70" />

          <FilterEditor
            v-model="draftFilter"
            mode="global"
            :metadata="null"
            metadata-status="idle"
          />

          <div class="mt-6 flex flex-wrap justify-end gap-2">
            <button
              v-if="canDeleteTemplate"
              type="button"
              class="shell-button border-red-500/40 bg-red-500/10 text-app-text hover:border-red-400/60 hover:bg-red-500/20"
              @click="requestDelete"
            >
              Delete template
            </button>
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
