<script setup lang="ts">
defineProps<{
  activeFilterSummary: string[]
  canUseListFilters: boolean
  onlyOnList: boolean
  hideOnList: boolean
}>()

const emit = defineEmits<{
  toggleListVisibility: [mode: 'only' | 'hide']
}>()
</script>

<template>
  <div class="mt-4 rounded-[1.25rem] border border-app-border/70 bg-app-bg/35 px-4 py-3 text-sm text-app-muted">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-2">
        <p class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
          Active filters
        </p>
        <div
          v-if="activeFilterSummary.length > 0"
          class="flex flex-wrap gap-2"
        >
          <span
            v-for="item in activeFilterSummary"
            :key="item"
            class="max-w-full rounded-full border border-app-border/70 bg-app-surface/80 px-3 py-1 leading-5"
          >
            {{ item }}
          </span>
        </div>
        <p v-else>
          No picker filters are active.
        </p>
      </div>

      <div
        v-if="canUseListFilters"
        class="flex flex-wrap gap-2 lg:justify-end"
      >
        <button
          type="button"
          class="rounded-full border px-3 py-1 text-xs font-medium transition"
          :class="onlyOnList ? 'border-app-accent bg-app-accent/15 text-app-text' : 'border-app-border/70 bg-app-surface/80 text-app-muted hover:text-app-text'"
          :aria-pressed="onlyOnList"
          :aria-label="onlyOnList ? 'Turn off only my anime filter' : 'Show only my anime'"
          @click="emit('toggleListVisibility', 'only')"
        >
          Only my anime
        </button>
        <button
          type="button"
          class="rounded-full border px-3 py-1 text-xs font-medium transition"
          :class="hideOnList ? 'border-app-accent bg-app-accent/15 text-app-text' : 'border-app-border/70 bg-app-surface/80 text-app-muted hover:text-app-text'"
          :aria-pressed="hideOnList"
          :aria-label="hideOnList ? 'Turn off hide my anime filter' : 'Hide my anime'"
          @click="emit('toggleListVisibility', 'hide')"
        >
          Hide my anime
        </button>
      </div>
    </div>
  </div>
</template>
