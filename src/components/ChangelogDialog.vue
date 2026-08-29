<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
} from 'reka-ui'
import { computed } from 'vue'

import DialogCloseButton from '@/components/DialogCloseButton.vue'
import DialogHeader from '@/components/DialogHeader.vue'
import { findUnseenVersions } from '@/lib/changelog'
import type { ChangelogEntry } from '@/types'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  entries: Array<ChangelogEntry>
  seenVersion: string | null
}>()

const unseenVersions = computed(() => new Set(findUnseenVersions(props.entries, props.seenVersion)))
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(92vw,40rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell">
        <DialogCloseButton />

        <div class="border-b border-app-border/70 pb-5 pr-24">
          <DialogHeader
            eyebrow="Changelog"
            title="What's new"
            description="Recent user-facing changes to the app."
          />
        </div>

        <div class="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
          <p
            v-if="entries.length === 0"
            class="text-sm leading-6 text-app-muted"
          >
            No changelog entries yet.
          </p>

          <section
            v-for="entry in entries"
            :key="entry.version"
            :data-changelog-version="entry.version"
            class="border-b border-app-border/60 py-4 first:pt-0 last:border-b-0 last:pb-0"
          >
            <div class="flex items-center gap-2">
              <h3 class="text-base font-semibold tracking-tight text-app-text">
                {{ entry.version }}
              </h3>
              <span
                v-if="unseenVersions.has(entry.version)"
                data-testid="changelog-new-badge"
                class="rounded-full border border-app-accent/40 bg-app-accentSoft px-2 py-0.5 text-xs font-medium uppercase tracking-[0.2em] text-app-accent"
              >
                New
              </span>
            </div>

            <ul class="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm leading-6 text-app-muted marker:text-app-border">
              <li
                v-for="(item, itemIndex) in entry.items"
                :key="itemIndex"
              >
                <template
                  v-for="(span, spanIndex) in item.spans"
                  :key="spanIndex"
                >
                  <code
                    v-if="span.kind === 'code'"
                    class="rounded bg-app-elevated/70 px-1 py-0.5 font-mono text-[0.85em] text-app-text"
                  >{{ span.text }}</code>
                  <a
                    v-else-if="span.kind === 'link'"
                    :href="span.href"
                    class="font-medium text-app-text underline decoration-app-border underline-offset-4 transition hover:text-app-accent"
                    target="_blank"
                    rel="noreferrer noopener"
                  >{{ span.text }}</a>
                  <strong
                    v-else-if="span.kind === 'strong'"
                    class="font-semibold text-app-text"
                  >{{ span.text }}</strong>
                  <em v-else-if="span.kind === 'emphasis'">{{ span.text }}</em>
                  <span v-else>{{ span.text }}</span>
                </template>
              </li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
