<script setup lang="ts">
import {
  PopoverArrow,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'radix-vue'

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
  <PopoverRoot>
    <PopoverTrigger as-child>
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
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        class="z-50 w-[min(92vw,68rem)] rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell"
        align="end"
        :side-offset="12"
      >
        <div class="mb-5 space-y-2">
          <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
            Template-wide filter
          </p>
          <h2 class="text-xl font-semibold tracking-tight text-app-text">
            Shared constraints for every category
          </h2>
          <p class="text-sm leading-6 text-app-muted">
            Category editors inherit these constraints and disable matching fields when they are already fixed here.
          </p>
        </div>

        <FilterEditor
          mode="global"
          :model-value="modelValue"
          :metadata="metadata"
          :metadata-status="metadataStatus"
          :metadata-error="metadataError"
          @update:model-value="emit('update:modelValue', $event)"
        />

        <PopoverArrow class="fill-app-surface" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
