<script setup lang="ts">
import {
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'

defineOptions({ inheritAttrs: false })

defineProps<{
  label: string
}>()
</script>

<template>
  <!--
    The tooltip portal lives inside the button so this component keeps a single
    root element. That lets callers such as `DropdownMenuTrigger` use `as-child`
    and still resolve the button as their popper anchor. Attributes are bound
    explicitly for the same reason: fall-through would stop at the fragment.
  -->
  <TooltipRoot>
    <TooltipTrigger as-child>
      <button
        type="button"
        class="shell-button inline-flex h-11 w-11 shrink-0 items-center justify-center p-0"
        :aria-label="label"
        v-bind="$attrs"
      >
        <slot />

        <TooltipPortal>
          <TooltipContent
            class="z-50 rounded-2xl border border-app-border/80 bg-app-surface px-3 py-2 text-xs leading-5 text-app-text shadow-shell"
            :side-offset="8"
          >
            {{ label }}
            <TooltipArrow class="fill-app-surface" />
          </TooltipContent>
        </TooltipPortal>
      </button>
    </TooltipTrigger>
  </TooltipRoot>
</template>
