<script setup lang="ts">
import {
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'

import type { AniListCharacterCredit, AniListVoiceActorCredit } from '@/api'
import { formatCharacterRoleLabel } from '@/lib/format-label'
import { resolveRelationName } from '@/lib/relation-selection'
import { useSettingsStore } from '@/stores/settings'

// One row per (character, voice actor) pair; the dialog flattens and filters.
interface VoiceActorCreditRow {
  credit: AniListCharacterCredit
  voiceActor: AniListVoiceActorCredit
}

defineProps<{
  rows: Array<VoiceActorCreditRow>
  selectedVoiceActorId?: number | null
  selectedCharacterId?: number | null
}>()

const emit = defineEmits<{
  select: [row: VoiceActorCreditRow]
}>()

const settingsStore = useSettingsStore()

const resolveVoiceActorName = ({ voiceActor }: VoiceActorCreditRow) =>
  resolveRelationName(
    { name: voiceActor.name, nativeName: voiceActor.nativeName },
    settingsStore.titleLanguage,
  )

const resolveCharacterName = ({ credit }: VoiceActorCreditRow) =>
  resolveRelationName({ name: credit.name, nativeName: credit.nativeName }, settingsStore.titleLanguage).primary

const resolveMetaLine = (row: VoiceActorCreditRow) => [
  row.credit.role ? formatCharacterRoleLabel(row.credit.role) : null,
  row.voiceActor.language,
]
  .filter((part) => part)
  .join(' · ')
</script>

<template>
  <div class="space-y-2">
    <button
      v-for="row in rows"
      :key="`${row.credit.characterId}-${row.voiceActor.voiceActorId}`"
      type="button"
      class="credit-row grid w-full grid-cols-[3rem_1fr] items-start gap-3 rounded-[1rem] border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/60"
      :class="selectedVoiceActorId === row.voiceActor.voiceActorId && selectedCharacterId === row.credit.characterId
        ? 'border-app-accent bg-app-accent/10'
        : 'border-app-border/70 bg-app-surface/70 hover:border-app-accent/40'"
      :aria-pressed="selectedVoiceActorId === row.voiceActor.voiceActorId && selectedCharacterId === row.credit.characterId"
      @click="emit('select', row)"
    >
      <img
        :src="row.voiceActor.image.large"
        :alt="resolveVoiceActorName(row).primary"
        class="h-16 w-12 shrink-0 rounded-lg border border-app-border/70 object-cover"
      >

      <span class="block min-w-0">
        <TooltipRoot v-if="resolveVoiceActorName(row).tooltip">
          <TooltipTrigger as-child>
            <span class="block break-words font-medium text-app-text decoration-dashed underline decoration-app-border underline-offset-4">
              {{ resolveVoiceActorName(row).primary }}
            </span>
          </TooltipTrigger>

          <TooltipPortal>
            <TooltipContent
              class="z-[60] rounded-2xl border border-app-border/80 bg-app-surface px-3 py-2 text-xs leading-5 text-app-text shadow-shell"
              :side-offset="8"
            >
              {{ resolveVoiceActorName(row).tooltip }}
              <TooltipArrow class="fill-app-surface" />
            </TooltipContent>
          </TooltipPortal>
        </TooltipRoot>
        <span
          v-else
          class="block break-words font-medium text-app-text"
        >
          {{ resolveVoiceActorName(row).primary }}
        </span>

        <span class="mt-1 block break-words text-sm text-app-text/80">
          as {{ resolveCharacterName(row) }}
        </span>

        <span
          v-if="resolveMetaLine(row)"
          class="mt-1 block text-sm text-app-muted"
        >
          {{ resolveMetaLine(row) }}
        </span>
      </span>
    </button>
  </div>
</template>
