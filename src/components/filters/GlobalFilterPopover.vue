<script setup lang="ts">
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'

import FilterEditor from '@/components/filters/FilterEditor.vue'
import { countConfiguredFilterFields } from '@/lib/filter-editor'
import type { AniListMetadata, FilterState } from '@/types'

const props = defineProps<{
  modelValue: FilterState
  metadata: AniListMetadata | null
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterState]
}>()
</script>

<template>
  <DialogRoot>
    <DialogTrigger as-child>
      <button
        type="button"
        class="shell-button"
        aria-label="Open template-wide filter editor"
      >
        Template filter
        <span class="ml-2 rounded-full bg-app-accentSoft px-2 py-1 text-xs text-app-text">
        {{ countConfiguredFilterFields(props.modelValue) }} rule{{ countConfiguredFilterFields(props.modelValue) === 1 ? '' : 's' }}
      </span>
    </button>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(96vw,68rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell overflow-hidden">
        <div class="shrink-0 space-y-2 border-b border-app-border/70 pb-5">
          <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
            Template-wide filter
          </p>
          <DialogTitle class="text-xl font-semibold tracking-tight text-app-text">
            Shared constraints for every category
          </DialogTitle>
          <DialogDescription class="text-sm leading-6 text-app-muted">
            Category editors inherit these constraints automatically.
          </DialogDescription>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto pr-1 pt-5">
          <FilterEditor
            mode="global"
            :model-value="modelValue"
            :metadata="metadata"
            :metadata-status="metadataStatus"
            :metadata-error="metadataError"
            @update:model-value="emit('update:modelValue', $event)"
          />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
