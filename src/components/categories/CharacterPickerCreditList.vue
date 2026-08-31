<script setup lang="ts">
import type { AniListCharacterCredit } from '@/api'
import NameWithTooltip from '@/components/categories/NameWithTooltip.vue'
import { formatCharacterRoleLabel } from '@/lib/format-label'
import { resolveRelationName } from '@/lib/relation-selection'
import { useSettingsStore } from '@/stores/settings'

defineProps<{
  credits: Array<AniListCharacterCredit>
  selectedCharacterId?: number | null
}>()

const emit = defineEmits<{
  select: [credit: AniListCharacterCredit]
}>()

const settingsStore = useSettingsStore()

const resolveCreditName = (credit: AniListCharacterCredit) =>
  resolveRelationName({ name: credit.name, nativeName: credit.nativeName }, settingsStore.titleLanguage)
</script>

<template>
  <div class="space-y-2">
    <button
      v-for="credit in credits"
      :key="credit.characterId"
      type="button"
      class="credit-row grid w-full grid-cols-[3rem_1fr] items-start gap-3 rounded-[1rem] border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/60"
      :class="selectedCharacterId === credit.characterId ? 'border-app-accent bg-app-accent/10' : 'border-app-border/70 bg-app-surface/70 hover:border-app-accent/40'"
      :aria-pressed="selectedCharacterId === credit.characterId"
      @click="emit('select', credit)"
    >
      <img
        :src="credit.image.large"
        :alt="resolveCreditName(credit).primary"
        class="h-16 w-12 shrink-0 rounded-lg border border-app-border/70 object-cover"
      >

      <span class="block min-w-0">
        <NameWithTooltip
          :primary="resolveCreditName(credit).primary"
          :tooltip="resolveCreditName(credit).tooltip"
          text-class="font-medium text-app-text"
        />

        <span
          v-if="credit.role"
          class="mt-1 block text-sm text-app-muted"
        >
          {{ formatCharacterRoleLabel(credit.role) }}
        </span>
      </span>
    </button>
  </div>
</template>
