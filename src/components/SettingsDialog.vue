<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'

import { animeTitleLanguages, type AnimeTitleLanguage } from '@/types'

const titleLanguageLabels: Record<AnimeTitleLanguage, string> = {
  userPreferred: 'User preferred',
  romaji: 'Romaji',
  english: 'English',
  native: 'Native',
}

const model = defineModel<AnimeTitleLanguage>({ required: true })
</script>

<template>
  <DialogRoot>
    <DialogTrigger as-child>
      <button
        type="button"
        class="shell-button"
        aria-label="Open settings"
      >
        Settings
      </button>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-app-border/80 bg-app-surface p-6 shadow-shell"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <DialogTitle class="text-2xl font-semibold tracking-tight text-app-text">
              Settings
            </DialogTitle>
            <DialogDescription class="mt-2 text-sm leading-6 text-app-muted">
              Keep global display preferences here so search results and saved selections use the same title language.
            </DialogDescription>
          </div>

          <DialogClose
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-app-border/70 bg-app-bg/60 text-app-muted transition hover:border-app-accent/50 hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent/40"
            aria-label="Close settings"
          >
            <span aria-hidden="true">×</span>
          </DialogClose>
        </div>

        <section class="mt-6 space-y-3">
          <div>
            <h3 class="text-sm font-medium text-app-text">
              Anime title language
            </h3>
            <p class="mt-1 text-sm leading-6 text-app-muted">
              Applies across the app and will be reused by image export.
            </p>
          </div>

          <div class="grid gap-2">
            <label
              v-for="language in animeTitleLanguages"
              :key="language"
              class="flex cursor-pointer items-start gap-3 rounded-[1.25rem] border border-app-border/70 bg-app-bg/40 p-4 transition hover:border-app-accent/40 hover:bg-app-elevated/50"
            >
              <input
                v-model="model"
                type="radio"
                name="title-language"
                :value="language"
                class="mt-1 h-4 w-4 border-app-border text-app-accent focus:ring-app-accent"
              >
              <div>
                <p class="text-sm font-medium text-app-text">{{ titleLanguageLabels[language] }}</p>
                <p class="mt-1 text-sm leading-6 text-app-muted">
                  {{ language === 'userPreferred' ? 'Use AniList\'s preferred title ordering for each anime.' : `Prefer the ${titleLanguageLabels[language].toLowerCase()} title when available.` }}
                </p>
              </div>
            </label>
          </div>
        </section>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
