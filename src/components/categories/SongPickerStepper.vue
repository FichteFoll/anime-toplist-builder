<script setup lang="ts">
import {
  StepperIndicator,
  StepperItem,
  StepperRoot,
  StepperTitle,
  StepperTrigger,
} from 'reka-ui'

import type { PropType } from 'vue'

type SongPickerView = 'anime' | 'song'

const props = defineProps({
  activeView: {
    type: String as PropType<SongPickerView>,
    required: true,
  },
  canNavigateToSongView: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits<{
  'update:activeView': [value: SongPickerView]
}>()

const viewToStep = (view: SongPickerView) => view === 'anime' ? 1 : 2
const stepToView = (step: number): SongPickerView => step === 2 ? 'song' : 'anime'

const updateStep = (step: number | undefined) => {
  if (!step) {
    return
  }

  const nextView = stepToView(step)

  if (nextView === 'song' && !props.canNavigateToSongView) {
    return
  }

  emit('update:activeView', nextView)
}
</script>

<template>
  <StepperRoot
    class="relative mt-5 flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:items-center sm:gap-x-[clamp(2rem,6vw,6rem)] sm:after:absolute sm:after:left-1/2 sm:after:top-1/2 sm:after:block sm:after:h-px sm:after:w-[clamp(2rem,6vw,6rem)] sm:after:-translate-x-1/2 sm:after:-translate-y-1/2 sm:after:bg-app-border/70 sm:after:content-['']"
    :model-value="viewToStep(activeView)"
    orientation="horizontal"
    :linear="false"
    @update:model-value="updateStep"
  >
    <StepperItem
      :step="1"
      class="w-full min-w-0"
    >
      <StepperTrigger class="group flex min-w-0 w-full items-center gap-3 rounded-[1rem] border border-app-border/70 bg-app-surface/60 px-4 py-3 text-left transition data-[state=active]:border-app-accent data-[state=active]:bg-app-accent/10">
        <StepperIndicator class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-app-border/70 text-sm font-semibold text-app-text transition group-data-[state=active]:border-app-accent group-data-[state=active]:bg-app-accent/15">
          1
        </StepperIndicator>
        <div class="min-w-0">
          <p class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
            Step 1
          </p>
          <StepperTitle class="block break-words text-sm font-semibold text-app-text">
            Select Anime
          </StepperTitle>
        </div>
      </StepperTrigger>
    </StepperItem>

    <StepperItem
      :step="2"
      :disabled="!canNavigateToSongView"
      class="w-full min-w-0"
    >
      <StepperTrigger class="group flex w-full items-center gap-3 rounded-[1rem] border border-app-border/70 bg-app-surface/60 px-4 py-3 text-left transition data-[state=active]:border-app-accent data-[state=active]:bg-app-accent/10 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60">
        <StepperIndicator class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-app-border/70 text-sm font-semibold text-app-text transition group-data-[state=active]:border-app-accent group-data-[state=active]:bg-app-accent/15">
          2
        </StepperIndicator>
        <div class="min-w-0">
          <p class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
            Step 2
          </p>
          <StepperTitle class="block break-words text-sm font-semibold text-app-text">
            Select Song
          </StepperTitle>
        </div>
      </StepperTrigger>
    </StepperItem>
  </StepperRoot>
</template>
