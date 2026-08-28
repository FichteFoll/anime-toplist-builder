<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'

import CaretIcon from '@/components/icons/CaretIcon.vue'
import { TemplateOrigin } from '@/types'
import type { Template } from '@/types'

defineProps<{
  activeTemplate: Template | null
}>()

const emit = defineEmits<{
  exportJson: []
  create: []
  importFile: []
  importRemote: []
  deleteTemplate: []
}>()
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="shell-button gap-2 px-4"
        :disabled="!activeTemplate"
        aria-label="Open template actions"
      >
        <span>Template actions</span>
        <CaretIcon class="h-4 w-4 rotate-90" />
      </button>
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent class="z-50 min-w-64 rounded-2xl border border-app-border/80 bg-app-surface p-2 shadow-shell">
        <DropdownMenuItem
          class="rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70"
          :disabled="!activeTemplate"
          @select="emit('exportJson')"
        >
          Export template JSON
        </DropdownMenuItem>

        <DropdownMenuSeparator class="my-2 h-px bg-app-border/70" />

        <DropdownMenuItem
          class="rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70"
          @select="emit('create')"
        >
          Create blank template
        </DropdownMenuItem>
        <DropdownMenuItem
          class="rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70"
          @select="emit('importFile')"
        >
          Import template from file
        </DropdownMenuItem>
        <DropdownMenuItem
          class="rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70"
          @select="emit('importRemote')"
        >
          Import template from URL
        </DropdownMenuItem>

        <DropdownMenuSeparator class="my-2 h-px bg-app-border/70" />

        <DropdownMenuItem
          class="rounded-xl px-3 py-2 text-sm text-red-200 outline-none transition hover:bg-red-500/10 data-[highlighted]:bg-red-500/10 disabled:pointer-events-none disabled:opacity-40"
          :disabled="!activeTemplate || activeTemplate.origin === TemplateOrigin.Predefined || activeTemplate.origin === TemplateOrigin.ImportedUrl"
          @select="emit('deleteTemplate')"
        >
          Delete template
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
