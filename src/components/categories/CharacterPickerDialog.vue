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
} from '@/api'
import DialogCloseButton from '@/components/DialogCloseButton.vue'
import DialogHeader from '@/components/DialogHeader.vue'
import AnimePickerBrowser from '@/components/categories/AnimePickerBrowser.vue'
import CharacterPickerCreditList from '@/components/categories/CharacterPickerCreditList.vue'
import PickerStepper from '@/components/categories/PickerStepper.vue'
import { resolveAnimeTitle } from '@/lib/anime-title'
import { createCharacterSelection } from '@/lib/relation-selection'
import { useAniListAuthStore } from '@/stores/anilist-auth'
import { useSettingsStore } from '@/stores/settings'
import {
  type AniListSearchResult,
  type Category,
  type CharacterSelection,
  type FilterState,
} from '@/types'

type CharacterPickerView = 'anime' | 'character'

const props = defineProps<{
  category: Category
  globalFilter: FilterState
  selectedCharacter?: CharacterSelection | null
}>()

const emit = defineEmits<{
  select: [selection: CharacterSelection]
  clear: []
}>()

// AniList caps the `Media.characters` connection at 25 entries per page,
// so the only way to reach the rest of a large cast is to page through it.
// Start the next page slightly before the list actually ends,
// so the rows are usually already there when the user arrives.
const creditScrollThreshold = 200

interface CreditPages {
  credits: Array<AniListCharacterCredit>
  nextPage: number
  hasNextPage: boolean
}

const open = ref(false)
const activeView = ref<CharacterPickerView>('anime')
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
const canNavigateToCharacterView = computed(() => detailAnime.value !== null)
const pickerSteps = [
  { key: 'anime', label: 'Select Anime' },
  { key: 'character', label: 'Select Character' },
]
const disabledSteps = computed(() => canNavigateToCharacterView.value ? [] : ['character'])
const isAnimeView = computed(() => activeView.value === 'anime')
const isCharacterView = computed(() => activeView.value === 'character')
const focusedCreditPages = computed(() =>
  focusedAnimeId.value === null
    ? null
    : creditsByAnimeId.value[focusedAnimeId.value] ?? null,
)
const focusedCredits = computed(() => focusedCreditPages.value?.credits ?? [])
const hasMoreCredits = computed(() => focusedCreditPages.value?.hasNextPage ?? false)
// The role filter is applied here rather than in the list component,
// so the dialog can tell an anime without credits apart from
// an anime whose credits the category's role filter excludes.
const visibleCredits = computed(() => {
  const roles = props.category.characterFilter.roles

  if (roles.length === 0) {
    return focusedCredits.value
  }

  return focusedCredits.value.filter((credit) => credit.role && roles.includes(credit.role))
})

const createHydratedAnimePlaceholder = () => props.selectedCharacter
  ? {
      id: props.selectedCharacter.animeId,
      title: props.selectedCharacter.animeTitle,
      coverImage: props.selectedCharacter.animeCoverImage,
      description: null,
      season: null,
      seasonYear: null,
      format: null,
      siteUrl: `https://anilist.co/anime/${props.selectedCharacter.animeId}`,
    }
  : null

const resetState = () => {
  activeView.value = 'anime'
  creditStatus.value = 'idle'
  creditErrorMessage.value = null
  creditsByAnimeId.value = {}
  isLoadingMoreCredits.value = false
  hydratedSelectedAnime.value = createHydratedAnimePlaceholder()
  focusedAnimeId.value = props.selectedCharacter?.animeId ?? null
}

const hydrateSelectedAnime = async () => {
  if (!props.selectedCharacter) {
    hydratedSelectedAnime.value = null
    return
  }

  const accessToken = aniListAuthStore.resolveAccessTokenForRequest()

  try {
    const result = await fetchAniListMediaById(props.selectedCharacter.animeId, accessToken)

    hydratedSelectedAnime.value = result ?? createHydratedAnimePlaceholder()
  } catch (error) {
    aniListAuthStore.handleRequestAuthFailure(error)

    hydratedSelectedAnime.value = createHydratedAnimePlaceholder()
  }

  focusedAnimeId.value = hydratedSelectedAnime.value?.id ?? props.selectedCharacter.animeId
  if (hydratedSelectedAnime.value) {
    void loadCreditsForAnime(hydratedSelectedAnime.value, { openCharacterView: false })
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

// A role filter that excludes every credit of the pages fetched so far
// would leave nothing on screen to scroll, and so nothing to trigger the
// next page. Pull pages in until a match appears or the credits run out.
const loadUntilVisible = async () => {
  while (visibleCredits.value.length === 0 && hasMoreCredits.value) {
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

const loadCreditsForAnime = async (result: AniListSearchResult, options?: { openCharacterView?: boolean }) => {
  const openCharacterView = options?.openCharacterView ?? true
  const requestId = ++activeCreditRequestId

  focusedAnimeId.value = result.id
  hydratedSelectedAnime.value = result
  if (openCharacterView) {
    setActiveView('character')
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

const selectCredit = (result: AniListSearchResult, credit: AniListCharacterCredit) => {
  emit('select', createCharacterSelection({
    characterId: credit.characterId,
    characterName: credit.name,
    characterNativeName: credit.nativeName,
    characterImage: credit.image,
    role: credit.role,
    animeId: result.id,
    animeTitle: result.title,
    animeCoverImage: result.coverImage,
  }))
  open.value = false
}

const setActiveView = (view: CharacterPickerView) => {
  if (view === 'character' && !canNavigateToCharacterView.value) {
    return
  }

  activeView.value = view
}

const setActiveViewFromKey = (key: string) => setActiveView(key as CharacterPickerView)

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
        :aria-label="selectedCharacter ? `Replace character selection for ${category.name}` : `Pick character selection for ${category.name}`"
      >
        {{ selectedCharacter ? 'Replace' : 'Pick' }}
      </button>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
      <DialogContent class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(98vw,78rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-[2rem] border border-app-border/80 bg-app-surface p-5 shadow-shell">
        <DialogCloseButton />

        <div class="border-b border-app-border/70 pb-5 pr-24">
          <DialogHeader
            eyebrow="Character picker"
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
            v-if="detailAnime && isCharacterView"
            class="min-h-0 flex-1 overflow-y-auto flex flex-col gap-4"
            @scroll="handleCreditScroll"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="text-xs font-medium uppercase tracking-[0.2em] text-app-muted">
                Select character
              </p>

              <button
                v-if="selectedCharacter"
                type="button"
                class="shell-button"
                @click="emit('clear')"
              >
                Clear character
              </button>
            </div>

            <p class="text-sm leading-6 text-app-muted">
              Characters of {{ resolveAnimeTitle(detailAnime.title, settingsStore.titleLanguage) }}
            </p>

            <div
              v-if="creditStatus === 'loading'"
              class="text-sm text-app-muted"
            >
              Loading characters...
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
                @click="loadCreditsForAnime(detailAnime, { openCharacterView: false })"
              >
                Retry characters
              </button>
            </div>
            <div
              v-else-if="creditStatus === 'ready' && !hasMoreCredits && focusedCredits.length === 0"
              class="text-sm leading-6 text-app-muted"
            >
              This anime has no character entries on AniList.
            </div>
            <div
              v-else-if="creditStatus === 'ready' && !hasMoreCredits && visibleCredits.length === 0"
              class="text-sm leading-6 text-app-muted"
            >
              No character matched this category's role filter.
            </div>
            <template v-else>
              <CharacterPickerCreditList
                :credits="visibleCredits"
                :selected-character-id="selectedCharacter?.characterId ?? null"
                @select="selectCredit(detailAnime, $event)"
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
                  {{ isLoadingMoreCredits ? 'Loading more characters...' : 'Load more characters' }}
                </button>
              </div>
            </template>
          </section>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
