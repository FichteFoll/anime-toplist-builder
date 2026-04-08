<script setup lang="ts">
defineProps<{
  totalResults: number
  currentPage: number
  lastPage: number
  hasNextPage: boolean
  status: 'idle' | 'loading' | 'ready' | 'error'
  hasResults: boolean
  errorMessage?: string | null
  emptyMessage: string
}>()

const emit = defineEmits<{
  previous: []
  next: []
  retry: []
}>()
</script>

<template>
  <div class="mt-3 flex items-center justify-between gap-3 rounded-[1.25rem] bg-app-bg/50 px-4 py-3 text-sm text-app-muted">
    <p>
      {{ totalResults > 0 ? `${totalResults} matches` : 'No total reported yet' }}
    </p>
    <p>
      {{ status === 'loading' ? 'Loading...' : `Page ${currentPage} · 15 per page` }}
    </p>
  </div>

  <div class="mt-4 flex items-center justify-between gap-3 text-sm text-app-muted">
    <p>
      Page {{ currentPage }} of {{ lastPage }}
    </p>
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="shell-button"
        :disabled="currentPage <= 1 || status === 'loading'"
        @click="emit('previous')"
      >
        Previous
      </button>
      <button
        type="button"
        class="shell-button"
        :disabled="!hasNextPage || status === 'loading'"
        @click="emit('next')"
      >
        Next
      </button>
    </div>
  </div>

  <div class="mt-5 flex min-h-0 flex-1 flex-col rounded-[1.5rem] border border-app-border/70 bg-app-bg/40 p-4">
    <div
      v-if="status === 'loading' && !hasResults"
      class="grid min-h-[18rem] gap-3 overflow-y-auto md:grid-cols-2 xl:grid-cols-3"
    >
      <div
        v-for="index in 6"
        :key="index"
        class="grid grid-cols-[5rem_1fr] gap-4 rounded-[1.25rem] border border-app-border/60 bg-app-surface/80 p-3"
      >
        <div class="h-28 rounded-xl bg-app-elevated/70" />
        <div class="space-y-3 pt-1">
          <div class="h-4 w-4/5 rounded-full bg-app-elevated/70" />
          <div class="h-4 w-1/2 rounded-full bg-app-elevated/50" />
          <div class="h-10 rounded-2xl bg-app-elevated/50" />
        </div>
      </div>
    </div>

    <div
      v-else-if="status === 'error'"
      class="flex min-h-[18rem] flex-1 flex-col items-center justify-center gap-4 overflow-y-auto text-center"
    >
      <p class="max-w-lg text-sm leading-6 text-app-muted">
        {{ errorMessage }}
      </p>
      <button
        type="button"
        class="shell-button"
        @click="emit('retry')"
      >
        Retry search
      </button>
    </div>

    <div
      v-else-if="status === 'ready' && !hasResults"
      class="flex min-h-[18rem] flex-1 items-center justify-center overflow-y-auto text-center"
    >
      <p class="max-w-lg text-sm leading-6 text-app-muted">
        {{ emptyMessage }}
      </p>
    </div>

    <div
      v-else
      class="min-h-[18rem] flex-1 overflow-y-auto pr-1"
    >
      <slot />
    </div>
  </div>
</template>
