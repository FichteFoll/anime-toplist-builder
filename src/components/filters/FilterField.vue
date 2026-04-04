<script setup lang="ts">
import {
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from 'radix-vue'

defineProps<{
  label: string
  description?: string
  disabledReason?: string
}>()
</script>

<template>
  <section class="space-y-3">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-sm font-medium text-app-text">
          {{ label }}
        </h3>
        <p
          v-if="description"
          class="mt-1 text-xs leading-5 text-app-muted"
        >
          {{ description }}
        </p>
      </div>

      <TooltipRoot v-if="disabledReason">
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded-full border border-app-border/80 bg-app-bg/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-app-muted"
            aria-label="Inherited filter field"
          >
            Inherited
          </button>
        </TooltipTrigger>

        <TooltipPortal>
          <TooltipContent
            class="max-w-xs rounded-2xl border border-app-border/80 bg-app-surface px-3 py-2 text-xs leading-5 text-app-text shadow-shell"
            :side-offset="8"
          >
            {{ disabledReason }}
            <TooltipArrow class="fill-app-surface" />
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </div>

    <slot />
  </section>
</template>
