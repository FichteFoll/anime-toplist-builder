<script setup lang="ts">
import {
  StepperIndicator,
  StepperItem,
  StepperRoot,
  StepperTitle,
  StepperTrigger,
} from 'reka-ui'

import type { PropType } from 'vue'

const props = defineProps({
  steps: {
    type: Array as PropType<Array<{ key: string, label: string }>>,
    required: true,
  },
  disabledKeys: {
    type: Array as PropType<Array<string>>,
    required: true,
  },
})

const activeKey = defineModel<string>('activeKey', { required: true })

const keyToStep = (key: string) => props.steps.findIndex((step) => step.key === key) + 1
const stepToKey = (step: number): string => props.steps[step - 1]?.key ?? props.steps[0].key

const updateStep = (step: number | undefined) => {
  if (!step) {
    return
  }

  const nextKey = stepToKey(step)

  if (props.disabledKeys.includes(nextKey)) {
    return
  }

  activeKey.value = nextKey
}
</script>

<template>
  <StepperRoot
    class="flex flex-col gap-3 sm:relative sm:grid sm:grid-cols-2 sm:items-center sm:gap-x-[clamp(2rem,6vw,6rem)] sm:after:absolute sm:after:left-1/2 sm:after:top-1/2 sm:after:block sm:after:h-px sm:after:w-[clamp(2rem,6vw,6rem)] sm:after:-translate-x-1/2 sm:after:-translate-y-1/2 sm:after:bg-app-border/70 sm:after:content-['']"
    :model-value="keyToStep(activeKey)"
    orientation="horizontal"
    :linear="false"
    @update:model-value="updateStep"
  >
    <StepperItem
      v-for="(step, index) in steps"
      :key="step.key"
      :step="index + 1"
      :disabled="disabledKeys.includes(step.key)"
      class="w-full min-w-0"
    >
      <StepperTrigger class="group flex min-w-0 w-full items-center gap-3 rounded-[1rem] border border-app-border/70 bg-app-surface/60 px-4 py-3 text-left transition data-[state=active]:border-app-accent data-[state=active]:bg-app-accent/10 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60">
        <StepperIndicator class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-app-border/70 text-sm font-semibold text-app-text transition group-data-[state=active]:border-app-accent group-data-[state=active]:bg-app-accent/15">
          {{ index + 1 }}
        </StepperIndicator>
        <div class="min-w-0">
          <p class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
            Step {{ index + 1 }}
          </p>
          <StepperTitle class="block break-words text-sm font-semibold text-app-text">
            {{ step.label }}
          </StepperTitle>
        </div>
      </StepperTrigger>
    </StepperItem>
  </StepperRoot>
</template>
