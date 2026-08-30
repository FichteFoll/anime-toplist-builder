<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTrigger,
} from 'reka-ui'
import { computed, ref, watch } from 'vue'

import {
  fetchAniListMediaById,
  fetchAnimeCharacterCredits,
  type AniListCharacterCreditsResponse,
  normalizeAniListError,
  type AniListCharacterCredit,
  type AniListVoiceActorCredit,
} from '@/api'
import DialogCloseButton from '@/components/DialogCloseButton.vue'
import DialogHeader from '@/components/DialogHeader.vue'
import AnimePickerBrowser from '@/components/categories/AnimePickerBrowser.vue'
import PickerStepper from '@/components/categories/PickerStepper.vue'
import VoiceActorPickerCreditList from '@/components/categories/VoiceActorPickerCreditList.vue'
import { resolveAnimeTitle } from '@/lib/anime-title'
import { createVoiceActorSelection } from '@/lib/relation-selection'
import { useAniListAuthStore } from '@/stores/anilist-auth'
import { useSettingsStore } from '@/stores/settings'
import {
  type AniListSearchResult,
  type Category,
  type FilterState,
  type VoiceActorSelection,
} from '@/types'

type VoiceActorPickerView = 'anime' | 'voice-actor'

interface VoiceActorCreditRow {
  credit: AniListCharacterCredit
  voiceActor: AniListVoiceActorCredit
}

const props = defineProps<{
  category: Category
  globalFilter: FilterState
  selectedVoiceActor?: VoiceActorSelection | null
}>()

const emit = defineEmits<{
  select: [selection: VoiceActorSelection]
  clear: []
}>()

// Start the next page slightly before the list actually ends,
// so the rows are usually already there when the user arrives.
const creditScrollThreshold = 200

// AniList caps the `Media.characters` connection at 25 entries per page,
// so the only way to reach the rest of a large cast is to page through it.
interface CreditPages {
  credits: Array<AniListCharacterCredit>
  nextPage: number
  hasNextPage: boolean
}

const open = ref(false)
const activeView = ref<VoiceActorPickerView>('anime')
const focusedAnimeId = ref<number | null>(null)
const creditStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const creditErrorMessage = ref<string | null>(null)
// The credits live for the lifetime of the dialog only; there is no persistent cache.
const creditsByAnimeId = ref<Record<number, CreditPages>>({})
const isLoadingMoreCredits = ref(false)
const hydratedSelectedAnime = ref<AniListSearchResult | null>(null)
const aniListAuthStore = useAniListAuthStore()
const settingsStore = useSettingsStore()

let activeCreditRequestId = 0
const detailAnime = computed(() =>
  hydratedSelectedAnime.value?.id === focusedAnimeId.value
    ? hydratedSelectedAnime.value
    : null,
)
const canNavigateToVoiceActorView = computed(() => detailAnime.value !== null)
const pickerSteps = [
  { key: 'anime', label: 'Select Anime' },
  { key: 'voice-actor', label: 'Select Voice Actor' },
]
const disabledSteps = computed(() => canNavigateToVoiceActorView.value ? [] : ['voice-actor'])
const isAnimeView = computed(() => activeView.value === 'anime')
const isVoiceActorView = computed(() => activeView.value === 'voice-actor')
const focusedCreditPages = computed(() =>
  focusedAnimeId.value === null
    ? null
    : creditsByAnimeId.value[focusedAnimeId.value] ?? null,
)
const focusedCredits = computed(() => focusedCreditPages.value?.credits ?? [])
const hasMoreCredits = computed(() => focusedCreditPages.value?.hasNextPage ?? false)
// A credit routinely carries voice actors in many languages at once,
// so the flat row list keeps the credit order and the order inside a credit.
const focusedRows = computed<Array<VoiceActorCreditRow>>(() =>
  focusedCredits.value.flatMap((credit) =>
    credit.voiceActors.map((voiceActor) => ({ credit, voiceActor }))))
// The language filter is applied here rather than in the list component,
// so the dialog can tell an anime without voice credits apart from
// an anime whose credits the category's language filter excludes.
const visibleRows = computed(() => {
  const languages = props.category.voiceActorFilter.languages

  if (languages.length === 0) {
    return focusedRows.value
  }

  const normalizedLanguages = languages.map((language) => language.toLowerCase())

  return focusedRows.value.filter((row) =>
    row.voiceActor.language
    && normalizedLanguages.includes(row.voiceActor.language.toLowerCase()))
})

const createHydratedAnimePlaceholder = () => props.selectedVoiceActor
  ? {
      id: props.selectedVoiceActor.animeId,
      title: props.selectedVoiceActor.animeTitle,
      coverImage: props.selectedVoiceActor.animeCoverImage,
      description: null,
      season: null,
      seasonYear: null,
      format: null,
      siteUrl: `https://anilist.co/anime/${props.selectedVoiceActor.animeId}`,
    }
  : null

const resetState = () => {
  activeView.value = 'anime'
  creditStatus.value = 'idle'
  creditErrorMessage.value = null
  creditsByAnimeId.value = {}
  isLoadingMoreCredits.value = false
  hydratedSelectedAnime.value = createHydratedAnimePlaceholder()
  focusedAnimeId.value = props.selectedVoiceActor?.animeId ?? null
}

const hydrateSelectedAnime = async () => {
  if (!props.selectedVoiceActor) {
    hydratedSelectedAnime.value = null
    return
  }

  const accessToken = aniListAuthStore.resolveAccessTokenForRequest()

  try {
    const result = await fetchAniListMediaById(props.selectedVoiceActor.animeId, accessToken)

    hydratedSelectedAnime.value = result ?? createHydratedAnimePlaceholder()
  } catch (error) {
    aniListAuthStore.handleRequestAuthFailure(error)

    hydratedSelectedAnime.value = createHydratedAnimePlaceholder()
  }

  focusedAnimeId.value = hydratedSelectedAnime.value?.id ?? props.selectedVoiceActor.animeId
  if (hydratedSelectedAnime.value) {
    void loadCreditsForAnime(hydratedSelectedAnime.value, { openVoiceActorView: false })
  }
}

const appendCreditPage = (animeId: number, response: AniListCharacterCreditsResponse) => {
  const loaded = creditsByAnimeId.value[animeId]

  creditsByAnimeId.value = {
    ...creditsByAnimeId.value,
    [animeId]: {
      credits: loaded ? [...loaded.credits, ...response.credits] : response.credits,
      nextPage: response.pageInfo.currentPage + 1,
      hasNextPage: response.pageInfo.hasNextPage,
    },
  }
}

const loadMoreCredits = async (): Promise<boolean> => {
  const animeId = focusedAnimeId.value
  const loaded = focusedCreditPages.value

  if (animeId === null || !loaded?.hasNextPage || isLoadingMoreCredits.value) {
    return false
  }

  const requestId = activeCreditRequestId

  isLoadingMoreCredits.value = true
  creditErrorMessage.value = null

  try {
    const response = await fetchAnimeCharacterCredits({
      animeId,
      page: loaded.nextPage,
      accessToken: aniListAuthStore.resolveAccessTokenForRequest(),
    })

    if (requestId !== activeCreditRequestId) {
      return false
    }

    appendCreditPage(animeId, response)

    return true
  } catch (error) {
    aniListAuthStore.handleRequestAuthFailure(error)

    if (requestId === activeCreditRequestId) {
      creditErrorMessage.value = normalizeAniListError(error).message
    }

    return false
  } finally {
    if (requestId === activeCreditRequestId) {
      isLoadingMoreCredits.value = false
    }
  }
}

// A language filter that excludes every row of the pages fetched so far
// would leave nothing on screen to scroll, and so nothing to trigger the
// next page. Pull pages in until a match appears or the credits run out.
const loadUntilVisible = async () => {
  while (visibleRows.value.length === 0 && hasMoreCredits.value) {
    if (!await loadMoreCredits()) {
      return
    }
  }
}

const handleCreditScroll = (event: Event) => {
  const container = event.target as HTMLElement
  const remaining = container.scrollHeight - container.scrollTop - container.clientHeight

  if (remaining > creditScrollThreshold) {
    return
  }

  void loadMoreCredits()
}

const loadCreditsForAnime = async (result: AniListSearchResult, options?: { openVoiceActorView?: boolean }) => {
  const openVoiceActorView = options?.openVoiceActorView ?? true
  const requestId = ++activeCreditRequestId

  focusedAnimeId.value = result.id
  hydratedSelectedAnime.value = result
  if (openVoiceActorView) {
    setActiveView('voice-actor')
  }
  creditErrorMessage.value = null

  if (creditsByAnimeId.value[result.id]) {
    creditStatus.value = 'ready'
    return
  }

  creditStatus.value = 'loading'

  try {
    const response = await fetchAnimeCharacterCredits({
      animeId: result.id,
      accessToken: aniListAuthStore.resolveAccessTokenForRequest(),
    })

    if (requestId !== activeCreditRequestId) {
      return
    }

    appendCreditPage(result.id, response)
    creditStatus.value = 'ready'
    await loadUntilVisible()
  } catch (error) {
    aniListAuthStore.handleRequestAuthFailure(error)

    if (requestId !== activeCreditRequestId) {
      return
    }

    creditStatus.value = 'error'
    creditErrorMessage.value = normalizeAniListError(error).message
  }
}

const selectRow = (result: AniListSearchResult, row: VoiceActorCreditRow) => {
  emit('select', createVoiceActorSelection({
    voiceActorId: row.voiceActor.voiceActorId,
    voiceActorName: row.voiceActor.name,
    voiceActorNativeName: row.voiceActor.nativeName,
    voiceActorImage: row.voiceActor.image,
    language: row.voiceActor.language,
    characterId: row.credit.characterId,
    characterName: row.credit.name,
    characterNativeName: row.credit.nativeName,
    characterImage: row.credit.image,
    role: row.credit.role,
    animeId: result.id,
    animeTitle: result.title,
    animeCoverImage: result.coverImage,
  }))
  open.value = false
}

const setActiveView = (view: VoiceActorPickerView) => {
  if (view === 'voice-actor' && !canNavigateToVoiceActorView.value) {
    return
  }

  activeView.value = view
}

const setActiveViewFromKey = (key: string) => setActiveView(key as VoiceActorPickerView)

watch(open, (isOpen) => {
  if (isOpen) {
    resetState()
    void hydrateSelectedAnime()
    return
  }

  activeCreditRequestId += 1
})
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger as-child>
      <button
        type="button"
        class="shell-button shell-button-active"
        :aria-label="selectedVoiceActor ? `Replace voice actor selection for ${category.name}` : `Pick voice actor selection for ${category.name}`"
      >
        {{ selectedVoiceActor ? 'Replace' : 'Pick' }}
      </button>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(98vw,78rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell">
        <DialogCloseButton />

        <div class="border-b border-app-border/70 pb-5 pr-24">
          <DialogHeader
            eyebrow="Voice actor picker"
            :title="category.name"
            :description="category.description"
          />
        </div>

        <div class="-mx-5 px-5 -mt-5 pt-5 pb-4 border-b border-app-border/70 bg-app-surface/95">
          <PickerStepper
            :active-key="activeView"
            :steps="pickerSteps"
            :disabled-keys="disabledSteps"
            @update:active-key="setActiveViewFromKey"
          />
        </div>

        <div class="mt-5 flex min-h-0 flex-1">
          <AnimePickerBrowser
            v-show="isAnimeView"
            :open="open"
            :category="category"
            :global-filter="globalFilter"
            :selected-media-id="focusedAnimeId"
            :show-clear-button="false"
            empty-message="No anime matched the current effective filters and search term."
            @select-result="loadCreditsForAnime"
            @clear="emit('clear')"
          />

          <section
            v-if="detailAnime && isVoiceActorView"
            class="min-h-0 flex-1 overflow-y-auto flex flex-col gap-4"
            @scroll="handleCreditScroll"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
                Select voice actor
              </p>

              <button
                v-if="selectedVoiceActor"
                type="button"
                class="shell-button"
                @click="emit('clear')"
              >
                Clear voice actor
              </button>
            </div>

            <p class="text-sm leading-6 text-app-muted">
              Voice actors of {{ resolveAnimeTitle(detailAnime.title, settingsStore.titleLanguage) }}
            </p>

            <div
              v-if="creditStatus === 'loading'"
              class="text-sm text-app-muted"
            >
              Loading voice actors...
            </div>
            <div
              v-else-if="creditStatus === 'error'"
              class="space-y-3"
            >
              <p class="text-sm leading-6 text-app-muted">
                {{ creditErrorMessage }}
              </p>
              <button
                type="button"
                class="shell-button"
                @click="loadCreditsForAnime(detailAnime, { openVoiceActorView: false })"
              >
                Retry voice actors
              </button>
            </div>
            <div
              v-else-if="creditStatus === 'ready' && !hasMoreCredits && focusedRows.length === 0"
              class="text-sm leading-6 text-app-muted"
            >
              This anime has no voice credits on AniList.
            </div>
            <div
              v-else-if="creditStatus === 'ready' && !hasMoreCredits && visibleRows.length === 0"
              class="text-sm leading-6 text-app-muted"
            >
              No voice actor matched this category's language filter.
            </div>
            <template v-else>
              <VoiceActorPickerCreditList
                :rows="visibleRows"
                :selected-voice-actor-id="selectedVoiceActor?.voiceActorId ?? null"
                :selected-character-id="selectedVoiceActor?.characterId ?? null"
                @select="selectRow(detailAnime, $event)"
              />

              <div
                v-if="hasMoreCredits"
                class="space-y-2"
              >
                <p
                  v-if="creditErrorMessage"
                  class="text-sm leading-6 text-app-muted"
                >
                  {{ creditErrorMessage }}
                </p>

                <button
                  type="button"
                  class="load-more-credits shell-button"
                  :disabled="isLoadingMoreCredits"
                  @click="loadMoreCredits()"
                >
                  {{ isLoadingMoreCredits ? 'Loading more voice actors...' : 'Load more voice actors' }}
                </button>
              </div>
            </template>
          </section>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
