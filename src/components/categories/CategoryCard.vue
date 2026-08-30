<script setup lang="ts">
import { computed } from 'vue'
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'

import CategoryEditDialog from '@/components/categories/CategoryEditDialog.vue'
import AnimePickerDialog from '@/components/categories/AnimePickerDialog.vue'
import SongPickerDialog from '@/components/categories/SongPickerDialog.vue'
import CharacterPickerDialog from '@/components/categories/CharacterPickerDialog.vue'
import VoiceActorPickerDialog from '@/components/categories/VoiceActorPickerDialog.vue'
import DeleteIcon from '@/components/icons/DeleteIcon.vue'
import DragHandleIcon from '@/components/icons/DragHandleIcon.vue'
import {
  getSelectionInsetImages,
  getSelectionPrimaryImage,
  getSelectionPrimaryTitle,
  resolveSongTitle,
  getSongContextLabel,
} from '@/lib/song-selection'
import {
  getCharacterRelationLabel,
  getVoiceActorRelationLabel,
  resolveRelationName,
} from '@/lib/relation-selection'
import { resolveAnimeTitle } from '@/lib/anime-title'
import { useSettingsStore } from '@/stores/settings'
import type {
  AniListMetadata,
  Category,
  CategorySelection,
  FilterState,
} from '@/types'

const props = defineProps<{
  category: Category
  selection: CategorySelection | null
  globalFilter: FilterState
  metadata: AniListMetadata | null
  metadataStatus: 'idle' | 'loading' | 'ready' | 'error'
  metadataError?: string | null
  canReorder: boolean
}>()

const emit = defineEmits<{
  save: [value: {
    name: string
    description: string
    filter: FilterState
    entityKind: Category['entityKind']
    songFilter: Category['songFilter']
    characterFilter: Category['characterFilter']
    voiceActorFilter: Category['voiceActorFilter']
  }]
  delete: [categoryId: string]
  selectSelection: [selection: CategorySelection]
  clearSelection: [categoryId: string]
}>()

const settingsStore = useSettingsStore()

// The inset array is ordered top-to-bottom, so the last entry sits lowest.
// Right-to-left, so a two-entry array puts the character left of the anime
// cover on one baseline. The offsets pair with `w-6` insets inside the 64x96
// image slot: 1 + 24 + 3 + 24 + 12 leaves the slot's width intact.
const insetRightClasses = ['right-px', 'right-[28px]']

// The primary image gives up room to the insets rather than being covered by
// them: one inset takes the lower right corner, two take the bottom row, and
// the primary shrinks to match. Mirrors `resolvePrimaryRect` in the export.
const primaryImageClasses = ['h-24 w-16', 'h-[4.5rem] w-12', 'h-[4.25rem] w-11']

const resolveInsetAltLabels = (selection: CategorySelection) => {
  if (selection.kind === 'anime' || selection.kind === 'song') {
    return []
  }

  const animeLabel = `Cover of ${resolveAnimeTitle(selection.animeTitle, settingsStore.titleLanguage)}`

  if (selection.kind === 'character') {
    return [animeLabel]
  }

  const characterName = resolveRelationName(
    { name: selection.characterName, nativeName: selection.characterNativeName },
    settingsStore.titleLanguage,
  ).primary

  return [`Image of ${characterName}`, animeLabel]
}

const selectionTitle = computed(() => {
  if (!props.selection) {
    return null
  }

  return getSelectionPrimaryTitle(props.selection, settingsStore.titleLanguage)
})
const selectionAltTitle = computed(() => {
  if (!props.selection) {
    return null
  }

  if (props.selection.kind === 'song') {
    return resolveSongTitle(props.selection.song, settingsStore.titleLanguage).tooltip
  }

  if (props.selection.kind === 'character') {
    return resolveRelationName(
      { name: props.selection.characterName, nativeName: props.selection.characterNativeName },
      settingsStore.titleLanguage,
    ).tooltip
  }

  if (props.selection.kind === 'voice-actor') {
    return resolveRelationName(
      { name: props.selection.voiceActorName, nativeName: props.selection.voiceActorNativeName },
      settingsStore.titleLanguage,
    ).tooltip
  }

  return null
})
const selectionPrimaryImage = computed(() =>
  props.selection ? getSelectionPrimaryImage(props.selection) : null,
)
const selectionInsets = computed(() => {
  if (!props.selection) {
    return []
  }

  const insetImages = getSelectionInsetImages(props.selection)
  const altLabels = resolveInsetAltLabels(props.selection)

  return insetImages.map((image, index) => ({
    src: image.large,
    alt: altLabels[index] ?? 'Related image',
    positionClass: insetRightClasses[insetImages.length - 1 - index] ?? 'right-[29px]',
  }))
})
const characterRelationLine = computed(() =>
  props.selection?.kind === 'character'
    ? getCharacterRelationLabel(props.selection, settingsStore.titleLanguage)
    : null,
)
const voiceActorRelationLine = computed(() =>
  props.selection?.kind === 'voice-actor'
    ? getVoiceActorRelationLabel(props.selection, settingsStore.titleLanguage)
    : null,
)
const voiceActorLanguageLine = computed(() =>
  props.selection?.kind === 'voice-actor' && props.selection.language?.trim()
    ? props.selection.language.trim()
    : null,
)
const songArtistLine = computed(() =>
  props.selection?.kind === 'song' && props.selection.song.artist.trim()
    ? `by ${props.selection.song.artist.trim()}`
    : null,
)
const songContextLine = computed(() =>
  props.selection?.kind === 'song' ? getSongContextLabel(props.selection, settingsStore.titleLanguage) : null,
)
const deleteCategoryTooltip = computed(() => `Delete category ${props.category.name}`)
</script>

<template>
  <article
    class="group flex flex-col rounded-[2rem] border bg-app-surface/90 p-5 shadow-shell backdrop-blur transition hover:border-app-accent/60"
    :class="selection ? 'border-app-accent/70' : 'border-app-border/70'"
    :data-category-id="category.id"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium uppercase tracking-[0.3em] text-app-muted">
          Category
        </p>
        <h3 class="mt-2 break-words text-xl font-semibold tracking-tight text-app-text">
          {{ category.name }}
        </h3>
        <p
          v-if="category.description"
          class="mt-2 max-w-2xl break-words text-sm leading-6 text-app-muted line-clamp-3"
        >
          {{ category.description }}
        </p>
      </div>

      <button
        type="button"
        class="category-drag-handle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-app-border/80 bg-app-bg/70 text-app-muted transition hover:border-app-accent/50 hover:text-app-text disabled:cursor-default disabled:opacity-50"
        :disabled="!canReorder"
        :aria-label="canReorder ? 'Drag to reorder categories' : 'Category drag handle'"
      >
        <DragHandleIcon class="h-4 w-4" />
      </button>
    </div>

    <div class="mt-5 flex-1 rounded-[1.5rem] border border-dashed border-app-border/70 bg-app-bg/50 p-4">
      <div
        v-if="selection"
        class="flex gap-4"
      >
        <div class="relative h-24 w-16 shrink-0">
          <!--
            With relation insets the primary image shrinks and stays top left,
            so the insets get room of their own beside and below it rather than
            covering a quarter of the subject. Two insets sit side by side on
            one baseline. Everything together still spans the slot exactly, so
            no card changes size.
          -->
          <img
            :src="selectionPrimaryImage?.large"
            :alt="selectionTitle ?? 'Selected anime cover'"
            class="selection-primary-image rounded-xl border border-app-border/70 object-cover"
            :class="primaryImageClasses[selectionInsets.length] ?? 'h-[4.25rem] w-11'"
          >

          <img
            v-for="(inset, index) in selectionInsets"
            :key="index"
            :src="inset.src"
            :alt="inset.alt"
            class="absolute bottom-px h-9 w-6 rounded-md object-cover ring-1 ring-app-surface"
            :class="inset.positionClass"
          >
        </div>

        <div class="min-w-0 space-y-2">
          <TooltipRoot v-if="selectionAltTitle">
            <TooltipTrigger as-child>
              <p class="break-words text-base font-semibold text-app-text decoration-dashed underline decoration-app-border underline-offset-4">
                {{ selectionTitle }}
              </p>
            </TooltipTrigger>

            <TooltipPortal>
              <TooltipContent
                class="z-50 rounded-2xl border border-app-border/80 bg-app-surface px-3 py-2 text-xs leading-5 text-app-text shadow-shell"
                :side-offset="8"
              >
                {{ selectionAltTitle }}
                <TooltipArrow class="fill-app-surface" />
              </TooltipContent>
            </TooltipPortal>
          </TooltipRoot>
          <p
            v-else
            class="break-words text-base font-semibold text-app-text"
          >
            {{ selectionTitle }}
          </p>

          <p
            v-if="selection.kind === 'anime'"
            class="text-sm text-app-muted"
          >
            {{ selection.seasonYear ?? 'Unknown year' }}
            <span v-if="selection.format"> · {{ selection.format }}</span>
          </p>
          <p
            v-else-if="selection.kind === 'character'"
            class="text-sm text-app-muted"
          >
            {{ characterRelationLine }}
          </p>
          <p
            v-else-if="selection.kind === 'voice-actor'"
            class="text-sm text-app-muted"
          >
            {{ voiceActorRelationLine }}
          </p>
          <p
            v-else
            class="text-sm text-app-muted"
          >
            {{ songArtistLine }}
          </p>

          <p
            v-if="selection.kind === 'song'"
            class="text-xs leading-5 text-app-muted"
          >
            {{ songContextLine }}
          </p>
          <p
            v-else-if="voiceActorLanguageLine"
            class="text-xs leading-5 text-app-muted"
          >
            {{ voiceActorLanguageLine }}
          </p>
        </div>
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <div class="grid grid-cols-[4rem_1fr] gap-4">
          <div class="h-24 rounded-xl bg-app-elevated/70" />
          <div class="space-y-3 pt-1">
            <div class="h-4 w-3/4 rounded-full bg-app-elevated/70" />
            <div class="h-4 w-1/2 rounded-full bg-app-elevated/50" />
            <div class="h-4 w-5/6 rounded-full bg-app-elevated/50" />
          </div>
        </div>
      </div>
    </div>

    <div class="mt-5 flex flex-wrap gap-2">
      <AnimePickerDialog
        v-if="category.entityKind === 'anime'"
        :category="category"
        :global-filter="globalFilter"
        :selected-media-id="selection?.kind === 'anime' ? selection.mediaId : null"
        @select="emit('selectSelection', $event)"
        @clear="emit('clearSelection', category.id)"
      />
      <SongPickerDialog
        v-else-if="category.entityKind === 'song'"
        :category="category"
        :global-filter="globalFilter"
        :selected-song="selection?.kind === 'song' ? selection : null"
        @select="emit('selectSelection', $event)"
        @clear="emit('clearSelection', category.id)"
      />
      <CharacterPickerDialog
        v-else-if="category.entityKind === 'character'"
        :category="category"
        :global-filter="globalFilter"
        :selected-character="selection?.kind === 'character' ? selection : null"
        @select="emit('selectSelection', $event)"
        @clear="emit('clearSelection', category.id)"
      />
      <VoiceActorPickerDialog
        v-else-if="category.entityKind === 'voice-actor'"
        :category="category"
        :global-filter="globalFilter"
        :selected-voice-actor="selection?.kind === 'voice-actor' ? selection : null"
        @select="emit('selectSelection', $event)"
        @clear="emit('clearSelection', category.id)"
      />
      <button
        type="button"
        class="shell-button"
        :disabled="!selection"
        :aria-label="`Clear selection for ${category.name}`"
        @click="emit('clearSelection', category.id)"
      >
        Clear
      </button>
      <CategoryEditDialog
        :category="category"
        :selection="selection"
        :global-filter="globalFilter"
        :metadata="metadata"
        :metadata-status="metadataStatus"
        :metadata-error="metadataError"
        @save="emit('save', $event)"
      />
      <TooltipRoot>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="shell-button inline-flex h-10 w-10 items-center justify-center p-0 hover:border-red-400/50 hover:bg-red-500/10"
            :aria-label="deleteCategoryTooltip"
            @click="emit('delete', category.id)"
          >
            <DeleteIcon class="h-4 w-4" />
          </button>
        </TooltipTrigger>

        <TooltipPortal>
          <TooltipContent
            class="rounded-2xl border border-app-border/80 bg-app-surface px-3 py-2 text-xs leading-5 text-app-text shadow-shell"
            :side-offset="8"
          >
            Delete category
            <TooltipArrow class="fill-app-surface" />
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </div>
  </article>
</template>
