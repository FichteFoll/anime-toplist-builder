<script setup lang="ts">
import {
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'

defineProps<{
  primary: string
  tooltip?: string | null
  textClass?: string
}>()
</script>

<template>
  <!--
    The trigger has to shrink-wrap its text. A block-level trigger spans the
    whole row, and the tooltip then centres itself over the row rather than
    over the name it belongs to.
  -->
  <span
    v-if="!tooltip"
    class="inline-block max-w-full break-words"
    :class="textClass"
  >{{ primary }}</span>

  <TooltipRoot v-else>
    <TooltipTrigger as-child>
      <span
        class="inline-block max-w-full break-words decoration-dashed underline decoration-app-border underline-offset-4"
        :class="textClass"
      >{{ primary }}</span>
    </TooltipTrigger>

    <TooltipPortal>
      <TooltipContent
        class="z-[60] rounded-2xl border border-app-border/80 bg-app-surface px-3 py-2 text-xs leading-5 text-app-text shadow-shell"
        :side-offset="8"
      >
        {{ tooltip }}
        <TooltipArrow class="fill-app-surface" />
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>
