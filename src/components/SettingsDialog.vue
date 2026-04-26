<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTrigger,
} from 'reka-ui'

import DialogCloseButton from '@/components/DialogCloseButton.vue'
import DialogHeader from '@/components/DialogHeader.vue'
import { animeTitleLanguages, type AnimeTitleLanguage } from '@/types'

const titleLanguageLabels: Record<AnimeTitleLanguage, string> = {
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
        <DialogCloseButton
          aria-label="Close settings"
          button-class="h-10 w-10 rounded-full border border-app-border/70 bg-app-bg/60 p-0 text-app-muted transition hover:border-app-accent/50 hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent/40"
        />

        <div class="pr-24">
          <DialogHeader
            title="Settings"
            description="Keep global display preferences here so search results and saved selections use the same title language."
          />
        </div>

        <section class="mt-6 space-y-3">
          <h2 class="text-sm font-medium uppercase tracking-[0.2em] text-app-muted">
            Anime title language
          </h2>
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
                  {{ `Prefer the ${titleLanguageLabels[language].toLowerCase()} title when available.` }}
                </p>
              </div>
            </label>
          </div>
        </section>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
