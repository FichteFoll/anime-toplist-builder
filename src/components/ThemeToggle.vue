<script setup lang="ts">
import type { ThemePreference } from '@/types'

const themeOptions: Array<{ label: string; value: ThemePreference }> = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

const model = defineModel<ThemePreference>({ required: true })
</script>

<template>
  <div class="inline-flex rounded-full border border-app-border/80 bg-app-bg/70 p-1">
    <button
      v-for="themeOption in themeOptions"
      :key="themeOption.value"
      type="button"
      class="shell-button border-transparent bg-transparent px-4 py-2 text-xs uppercase tracking-[0.2em] text-app-muted shadow-none"
      :class="{
        'shell-button-active border-app-border/0 text-app-text': model === themeOption.value,
      }"
      :aria-pressed="model === themeOption.value"
      :aria-label="`Switch to ${themeOption.label.toLowerCase()} theme`"
      @click="model = themeOption.value"
    >
      {{ themeOption.label }}
    </button>
  </div>
</template>
