<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'reka-ui'
import { computed } from 'vue'

import CaretIcon from '@/components/icons/CaretIcon.vue'
import { useSelectionsStore } from '@/stores/selections'
import { useTemplateStore } from '@/stores/templates'

const emit = defineEmits<{
  create: []
  importFile: []
  importRemote: []
}>()

const templateStore = useTemplateStore()
const selectionsStore = useSelectionsStore()

const activeTemplateLabel = computed(() => templateStore.activeTemplate?.name ?? 'No active template')

const getSelectionSummary = (templateId: string, categoryCount: number) =>
  `${selectionsStore.getSelectionCount(templateId)}/${categoryCount}`
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="shell-button min-w-0 max-w-full justify-between gap-2 px-4"
        :title="activeTemplateLabel"
        aria-label="Load template"
      >
        <span class="min-w-0 truncate text-left">{{ activeTemplateLabel }}</span>
        <CaretIcon class="h-4 w-4 shrink-0 rotate-90" />
      </button>
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent class="z-50 min-w-72 rounded-2xl border border-app-border/80 bg-app-surface p-2 shadow-shell">
        <DropdownMenuLabel class="px-2 py-1 text-xs font-medium uppercase tracking-[0.25em] text-app-muted">
          Load template
        </DropdownMenuLabel>

        <DropdownMenuSeparator class="my-2 h-px bg-app-border/70" />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger class="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70">
            <span>Predefined</span>
            <span class="text-xs text-app-muted">{{ templateStore.predefinedTemplates.length }}</span>
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent class="z-50 min-w-72 rounded-2xl border border-app-border/80 bg-app-surface p-2 shadow-shell">
            <DropdownMenuLabel class="px-2 py-1 text-xs font-medium uppercase tracking-[0.25em] text-app-muted">
              Built-in templates
            </DropdownMenuLabel>

            <DropdownMenuSeparator class="my-2 h-px bg-app-border/70" />

            <DropdownMenuItem
              v-for="template in templateStore.predefinedTemplates"
              :key="template.id"
              class="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70"
              @select="templateStore.setActiveTemplate(template.id)"
            >
              <span class="truncate">{{ template.name }}</span>
              <span class="ml-4 shrink-0 text-xs text-app-muted">
                {{ getSelectionSummary(template.id, template.categories.length) }}
              </span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger class="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70">
            <span>My templates</span>
            <span class="text-xs text-app-muted">{{ templateStore.userTemplates.length + templateStore.remoteTemplates.length }}</span>
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent class="z-50 min-w-72 rounded-2xl border border-app-border/80 bg-app-surface p-2 shadow-shell">
            <DropdownMenuLabel class="px-2 py-1 text-xs font-medium uppercase tracking-[0.25em] text-app-muted">
              Local templates
            </DropdownMenuLabel>

            <DropdownMenuSeparator class="my-2 h-px bg-app-border/70" />

            <DropdownMenuItem
              v-for="template in templateStore.userTemplates"
              :key="template.id"
              class="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70"
              @select="templateStore.setActiveTemplate(template.id)"
            >
              <span class="truncate">{{ template.name }}</span>
              <span class="ml-4 shrink-0 text-xs text-app-muted">
                {{ getSelectionSummary(template.id, template.categories.length) }}
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator
              v-if="templateStore.userTemplates.length > 0 && templateStore.remoteTemplates.length > 0"
              class="my-2 h-px bg-app-border/70"
            />

            <DropdownMenuLabel
              v-if="templateStore.remoteTemplates.length > 0"
              class="px-2 py-1 text-xs font-medium uppercase tracking-[0.25em] text-app-muted"
            >
              Remote imports
            </DropdownMenuLabel>

            <DropdownMenuItem
              v-for="template in templateStore.remoteTemplates"
              :key="template.id"
              class="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-app-text outline-none transition hover:bg-app-elevated/70 data-[highlighted]:bg-app-elevated/70"
              @select="templateStore.setActiveTemplate(template.id)"
            >
              <span class="truncate">{{ template.name }}</span>
              <span class="ml-4 shrink-0 text-xs text-app-muted">
                {{ getSelectionSummary(template.id, template.categories.length) }}
              </span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

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
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
