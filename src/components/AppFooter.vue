<script setup lang="ts">
import { appConfig } from '@/config/app'
</script>

<template>
  <footer class="mt-10 border-t border-app-border/70 py-6 text-sm text-app-muted">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="leading-6">
        Powered by
        <a
          :href="appConfig.anilistUrl"
          class="font-medium text-app-text underline decoration-app-border underline-offset-4 transition hover:decoration-app-accent"
          target="_blank"
          rel="noreferrer"
        >
          AniList
        </a>
        data.
      </p>

      <p class="leading-6">
        Open source on
        <a
          :href="appConfig.repositoryUrl"
          class="font-medium text-app-text underline decoration-app-border underline-offset-4 transition hover:decoration-app-accent"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        .
        AniList is not affiliated with this project.
      </p>
    </div>
  </footer>
</template>
