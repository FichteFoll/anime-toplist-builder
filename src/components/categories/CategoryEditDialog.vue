<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'
import { computed, ref, watch } from 'vue'

import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import DialogCloseButton from '@/components/DialogCloseButton.vue'
import FilterEditor from '@/components/filters/FilterEditor.vue'
import EditIcon from '@/components/icons/EditIcon.vue'
import { voiceActorLanguageOptions } from '@/config/app'
import {
  getCategoryFilterDisabledReasons,
  isNonBlankName,
} from '@/lib/filter-editor'
import { formatCharacterRoleLabel, formatThemeTypeLabel } from '@/lib/format-label'
import { getSelectionDisplayLabel } from '@/lib/song-selection'
import { useSettingsStore } from '@/stores/settings'
import {
  CategoryEntityKind,
  ThemeType,
  characterRoles,
  type AniListMetadata,
  type Category,
  type CategorySelection,
  type CharacterFilterState,
  type CharacterRole,
  type FilterState,
  type SongFilterState,
  type VoiceActorFilterState,
} from '@/types'

const props = defineProps<{
  category: Category
  selection: CategorySelection | null
  globalFilter: FilterState
  metadata: AniListMetadata | null
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
}>()

const emit = defineEmits<{
  save: [value: {
    name: string
    description: string
    filter: FilterState
    entityKind: CategoryEntityKind
    songFilter: SongFilterState
    characterFilter: CharacterFilterState
    voiceActorFilter: VoiceActorFilterState
  }]
}>()

const settingsStore = useSettingsStore()

const open = ref(false)
const isDiscardConfirmationOpen = ref(false)
const draftName = ref(props.category.name)
const draftDescription = ref(props.category.description)
const draftFilter = ref<FilterState>(cloneDraft(props.category.filter))
const draftEntityKind = ref<CategoryEntityKind>(props.category.entityKind)
const draftSongFilter = ref<SongFilterState>(cloneDraft(props.category.songFilter))
const draftCharacterFilter = ref<CharacterFilterState>(cloneDraft(props.category.characterFilter))
const draftVoiceActorFilter = ref<VoiceActorFilterState>(cloneDraft(props.category.voiceActorFilter))

function cloneDraft<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch {
      // Vue props can be proxies, which structuredClone rejects.
      // Fall back to JSON cloning for these plain state objects.
    }
  }

  return JSON.parse(JSON.stringify(value)) as T
}

const disabledFields = computed(() => getCategoryFilterDisabledReasons(props.globalFilter))
const hasValidName = computed(() => isNonBlankName(draftName.value))

const resetDraft = () => {
  draftName.value = props.category.name
  draftDescription.value = props.category.description
  draftFilter.value = cloneDraft(props.category.filter)
  draftEntityKind.value = props.category.entityKind
  draftSongFilter.value = cloneDraft(props.category.songFilter)
  draftCharacterFilter.value = cloneDraft(props.category.characterFilter)
  draftVoiceActorFilter.value = cloneDraft(props.category.voiceActorFilter)
  // Reopening the dialog must never show a confirmation left over from before.
  isDiscardConfirmationOpen.value = false
}

watch(open, (isOpen) => {
  if (isOpen) {
    resetDraft()
  }
})

watch(
  () => props.category,
  () => {
    if (!open.value) {
      resetDraft()
    }
  },
  { deep: true },
)

const emitSave = () => {
  emit('save', {
    name: draftName.value.trim(),
    description: draftDescription.value.trim(),
    filter: cloneDraft(draftFilter.value),
    entityKind: draftEntityKind.value,
    songFilter: cloneDraft(draftSongFilter.value),
    characterFilter: cloneDraft(draftCharacterFilter.value),
    voiceActorFilter: cloneDraft(draftVoiceActorFilter.value),
  })
  open.value = false
}

const save = () => {
  if (!isNonBlankName(draftName.value.trim())) {
    return
  }

  // A stored selection cannot be converted to another entity kind,
  // so the discard is confirmed before it happens.
  if (draftEntityKind.value !== props.category.entityKind && props.selection !== null) {
    isDiscardConfirmationOpen.value = true

    return
  }

  emitSave()
}

const confirmDiscardSelection = () => {
  isDiscardConfirmationOpen.value = false
  emitSave()
}

const entityKindOptions = [
  {
    value: CategoryEntityKind.Anime,
    label: 'Anime',
    description: 'Pick one anime directly from AniList results.',
  },
  {
    value: CategoryEntityKind.Song,
    label: 'Song',
    description: 'Pick an anime first, then choose a song tied to it.',
  },
  {
    value: CategoryEntityKind.Character,
    label: 'Character',
    description: 'Pick an anime first, then a character from it.',
  },
  {
    value: CategoryEntityKind.VoiceActor,
    label: 'Voice actor',
    description: 'Pick an anime first, then one of its voice credits.',
  },
] as const

const formatEntityKindLabel = (kind: CategoryEntityKind) =>
  entityKindOptions.find((option) => option.value === kind)?.label ?? kind

const discardConfirmationDescription = computed(() => {
  if (!props.selection) {
    return ''
  }

  const selectionLabel = getSelectionDisplayLabel(props.selection, settingsStore.titleLanguage)
  const currentKind = formatEntityKindLabel(props.category.entityKind)
  const nextKind = formatEntityKindLabel(draftEntityKind.value)

  return `Changing this category from ${currentKind} to ${nextKind}`
    + ` discards the saved selection "${selectionLabel}". It cannot be converted.`
})

const songTypeOptions = [
  { value: ThemeType.OP, label: 'Opening' },
  { value: ThemeType.IN, label: 'Insert' },
  { value: ThemeType.ED, label: 'Ending' },
] as const

const toggleValue = <T extends string>(values: Array<T>, value: T): Array<T> => {
  const nextValues = values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value]

  return [...new Set(nextValues)].sort()
}

const isSongTypeSelected = (value: SongFilterState['types'][number]) =>
  draftSongFilter.value.types.includes(value)

const toggleSongType = (value: SongFilterState['types'][number]) => {
  draftSongFilter.value = {
    types: toggleValue(draftSongFilter.value.types, value),
  }
}

const isCharacterRoleSelected = (value: CharacterRole) =>
  draftCharacterFilter.value.roles.includes(value)

const toggleCharacterRole = (value: CharacterRole) => {
  draftCharacterFilter.value = {
    roles: toggleValue(draftCharacterFilter.value.roles, value),
  }
}

const isVoiceActorLanguageSelected = (value: string) =>
  draftVoiceActorFilter.value.languages.includes(value)

const toggleVoiceActorLanguage = (value: string) => {
  draftVoiceActorFilter.value = {
    languages: toggleValue(draftVoiceActorFilter.value.languages, value),
  }
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <TooltipRoot>
      <DialogTrigger as-child>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="shell-button inline-flex h-10 w-10 items-center justify-center p-0"
            :aria-label="`Edit category ${props.category.name}`"
          >
            <EditIcon class="h-4 w-4" />
          </button>
        </TooltipTrigger>
      </DialogTrigger>

      <TooltipPortal>
        <TooltipContent
          class="rounded-2xl border border-app-border/80 bg-app-surface px-3 py-2 text-xs leading-5 text-app-text shadow-shell"
          :side-offset="8"
        >
          Edit
          <TooltipArrow class="fill-app-surface" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(96vw,80rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell overflow-hidden">
        <DialogCloseButton />

        <div class="shrink-0 border-b border-app-border/70 pb-5 pr-24">
          <div class="max-w-3xl space-y-2">
            <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
              Edit Category
            </p>
            <DialogTitle class="text-xl font-semibold tracking-tight text-app-text">
              {{ props.category.name }}
            </DialogTitle>
            <p class="text-sm leading-6 text-app-muted">
              Update the category name, description, and filters for this card.
            </p>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto pr-1 pt-5">
          <label class="mb-5 block space-y-2">
            <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
              Category name
            </span>
            <input
              v-model="draftName"
              type="text"
              required
              class="shell-input"
              placeholder="Best opener"
            >
          </label>

          <label class="mb-5 block space-y-2">
            <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
              Description
            </span>
            <textarea
              v-model="draftDescription"
              rows="2"
              class="shell-input min-h-0 resize-none"
              placeholder="Short context for this category"
            />
            <span class="text-xs leading-5 text-app-muted">
              Optional. Keep it short so it fits beside the category title.
            </span>
          </label>

          <div class="my-5 border-t border-app-border/70" />

          <div class="mb-5 space-y-3">
            <span class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
              Category type
            </span>
            <div class="grid gap-2 sm:grid-cols-2">
              <label
                v-for="option in entityKindOptions"
                :key="option.value"
                class="flex cursor-pointer items-start gap-3 rounded-[1rem] border border-app-border/70 bg-app-surface/70 p-3 text-sm text-app-text transition hover:border-app-accent/40"
              >
                <input
                  v-model="draftEntityKind"
                  :value="option.value"
                  type="radio"
                  class="mt-1 h-4 w-4"
                >
                <div>
                  <p class="font-medium text-app-text">{{ option.label }}</p>
                  <p class="mt-1 text-xs leading-5 text-app-muted">
                    {{ option.description }}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div
            v-if="draftEntityKind === CategoryEntityKind.Song"
            class="mb-5 rounded-[1.5rem] border border-app-border/70 bg-app-bg/50 p-4"
          >
            <p class="text-sm font-medium text-app-text">
              Song type
            </p>
            <p class="mt-1 text-xs leading-5 text-app-muted">
              Choose which theme types this category can include.
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-for="type in songTypeOptions"
                :key="type.value"
                type="button"
                class="shell-button"
                :class="isSongTypeSelected(type.value) ? 'border-app-accent/70 bg-app-accentSoft/70 text-app-text' : ''"
                :aria-pressed="isSongTypeSelected(type.value)"
                :aria-label="`${isSongTypeSelected(type.value) ? 'Remove' : 'Add'} ${type.label}`"
                @click="toggleSongType(type.value)"
              >
                {{ formatThemeTypeLabel(type.value) }}
              </button>
            </div>
          </div>

          <div
            v-if="draftEntityKind === CategoryEntityKind.Character"
            class="mb-5 rounded-[1.5rem] border border-app-border/70 bg-app-bg/50 p-4"
          >
            <p class="text-sm font-medium text-app-text">
              Character role
            </p>
            <p class="mt-1 text-xs leading-5 text-app-muted">
              Choose which roles this category can include. Selecting none allows every role.
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-for="role in characterRoles"
                :key="role"
                type="button"
                class="shell-button"
                :class="isCharacterRoleSelected(role) ? 'border-app-accent/70 bg-app-accentSoft/70 text-app-text' : ''"
                :aria-pressed="isCharacterRoleSelected(role)"
                :aria-label="`${isCharacterRoleSelected(role) ? 'Remove' : 'Add'} ${formatCharacterRoleLabel(role)}`"
                @click="toggleCharacterRole(role)"
              >
                {{ formatCharacterRoleLabel(role) }}
              </button>
            </div>
          </div>

          <div
            v-if="draftEntityKind === CategoryEntityKind.VoiceActor"
            class="mb-5 rounded-[1.5rem] border border-app-border/70 bg-app-bg/50 p-4"
          >
            <p class="text-sm font-medium text-app-text">
              Voice actor language
            </p>
            <p class="mt-1 text-xs leading-5 text-app-muted">
              Choose which credit languages this category can include. Selecting none allows every language.
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-for="language in voiceActorLanguageOptions"
                :key="language"
                type="button"
                class="shell-button"
                :class="isVoiceActorLanguageSelected(language) ? 'border-app-accent/70 bg-app-accentSoft/70 text-app-text' : ''"
                :aria-pressed="isVoiceActorLanguageSelected(language)"
                :aria-label="`${isVoiceActorLanguageSelected(language) ? 'Remove' : 'Add'} ${language}`"
                @click="toggleVoiceActorLanguage(language)"
              >
                {{ language }}
              </button>
            </div>
          </div>

          <FilterEditor
            mode="category"
            :model-value="draftFilter"
            :metadata="metadata"
            :metadata-status="metadataStatus"
            :metadata-error="metadataError"
            :disabled-fields="disabledFields"
            @update:model-value="draftFilter = $event"
          />
        </div>

        <div class="shrink-0 border-t border-app-border/70 bg-app-surface/95 pt-4">
          <div class="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="shell-button"
              @click="resetDraft"
            >
              Reset draft
            </button>
            <button
              type="button"
              class="shell-button shell-button-active"
              :disabled="!hasValidName"
              @click="save"
            >
              Save category
            </button>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>

    <ConfirmationDialog
      v-model:open="isDiscardConfirmationOpen"
      title="Discard the current selection?"
      :description="discardConfirmationDescription"
      confirm-label="Change type and discard"
      @confirm="confirmDiscardSelection"
    />
  </DialogRoot>
</template>
