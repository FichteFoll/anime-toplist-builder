// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CategoryEditDialog from '@/components/categories/CategoryEditDialog.vue'
import { createEmptyFilterState } from '@/lib/filter-state'
import { createAnimeSelection, createEmptySongFilterState } from '@/lib/song-selection'
import {
  createEmptyCharacterFilterState,
  createEmptyVoiceActorFilterState,
} from '@/lib/relation-selection'
import {
  AnimeFormat,
  AnimeSeason,
  CategoryEntityKind,
  CharacterRole,
  type Category,
  type CategorySelection,
} from '@/types'

vi.mock('reka-ui', () => ({
  DialogClose: { template: '<div><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogOverlay: { template: '<div><slot /></div>' },
  DialogPortal: { template: '<div><slot /></div>' },
  DialogRoot: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
  DialogTrigger: { template: '<div><slot /></div>' },
  TooltipArrow: { template: '<div><slot /></div>' },
  TooltipContent: { template: '<div><slot /></div>' },
  TooltipPortal: { template: '<div><slot /></div>' },
  TooltipRoot: { template: '<div><slot /></div>' },
  TooltipTrigger: { template: '<div><slot /></div>' },
}))

vi.mock('@/components/filters/FilterEditor.vue', () => ({
  default: { template: '<div class="filter-editor" />' },
}))

vi.mock('@/components/ConfirmationDialog.vue', () => ({
  default: {
    props: ['open', 'title', 'description', 'confirmLabel'],
    emits: ['update:open', 'confirm'],
    template: `
      <div
        v-if="open"
        class="confirmation"
      >
        <p class="confirmation-title">{{ title }}</p>
        <p class="confirmation-description">{{ description }}</p>
        <button type="button" class="confirmation-confirm" @click="$emit('confirm')">{{ confirmLabel }}</button>
        <button type="button" class="confirmation-cancel" @click="$emit('update:open', false)">Cancel</button>
      </div>
    `,
  },
}))

const createCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'category-1',
  name: 'Best Girl',
  description: '',
  filter: createEmptyFilterState(),
  entityKind: CategoryEntityKind.Anime,
  songFilter: createEmptySongFilterState(),
  characterFilter: createEmptyCharacterFilterState(),
  voiceActorFilter: createEmptyVoiceActorFilterState(),
  ...overrides,
})

const animeSelection = createAnimeSelection({
  mediaId: 42,
  title: {
    userPreferred: 'Haibane Renmei',
    romaji: 'Haibane Renmei',
    english: null,
    native: null,
  },
  coverImage: {
    large: 'https://img.example/haibane-large.jpg',
    medium: null,
    extraLarge: null,
    color: '#475569',
  },
  season: AnimeSeason.Fall,
  seasonYear: 2002,
  format: AnimeFormat.Tv,
})

const mountDialog = async (props: {
  category?: Category
  selection?: CategorySelection | null
} = {}) => {
  const wrapper = mount(CategoryEditDialog, {
    props: {
      category: props.category ?? createCategory(),
      selection: props.selection ?? null,
      globalFilter: createEmptyFilterState(),
      metadata: null,
      metadataStatus: 'idle' as const,
    },
  })

  ;(wrapper.vm as unknown as { open: boolean }).open = true
  await nextTick()
  await nextTick()

  return wrapper
}

const selectEntityKind = async (
  wrapper: Awaited<ReturnType<typeof mountDialog>>,
  kind: CategoryEntityKind,
) => {
  await wrapper.find(`input[type="radio"][value="${kind}"]`).setValue(true)
}

const saveCategory = async (wrapper: Awaited<ReturnType<typeof mountDialog>>) => {
  const saveButton = wrapper.findAll('button').find((button) => button.text() === 'Save category')

  if (!saveButton) {
    throw new Error('The dialog does not render a save button')
  }

  await saveButton.trigger('click')
}

describe('CategoryEditDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('emits save immediately when only the name changed', async () => {
    const wrapper = await mountDialog({ selection: animeSelection })

    await wrapper.find('input[type="text"]').setValue('Best Boy')
    await saveCategory(wrapper)

    expect(wrapper.find('.confirmation').exists()).toBe(false)
    expect(wrapper.emitted('save')).toHaveLength(1)
    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      name: 'Best Boy',
      entityKind: CategoryEntityKind.Anime,
    })
  })

  it('emits save immediately when the entity kind changes without a selection', async () => {
    const wrapper = await mountDialog()

    await selectEntityKind(wrapper, CategoryEntityKind.Character)
    await saveCategory(wrapper)

    expect(wrapper.find('.confirmation').exists()).toBe(false)
    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      entityKind: CategoryEntityKind.Character,
    })
  })

  it('confirms before discarding a selection when the entity kind changes', async () => {
    const wrapper = await mountDialog({ selection: animeSelection })

    await selectEntityKind(wrapper, CategoryEntityKind.Character)
    await saveCategory(wrapper)

    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.find('.confirmation').exists()).toBe(true)
    expect(wrapper.find('.confirmation-title').text()).toBe('Discard the current selection?')
    expect(wrapper.find('.confirmation-confirm').text()).toBe('Change type and discard')
    expect(wrapper.find('.confirmation-description').text()).toContain('Haibane Renmei')
    expect(wrapper.find('.confirmation-description').text()).toContain('from Anime to Character')

    await wrapper.find('.confirmation-confirm').trigger('click')

    expect(wrapper.emitted('save')).toHaveLength(1)
    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      entityKind: CategoryEntityKind.Character,
    })
  })

  it('keeps the edit dialog open with the draft intact when the confirmation is cancelled', async () => {
    const wrapper = await mountDialog({ selection: animeSelection })

    await selectEntityKind(wrapper, CategoryEntityKind.VoiceActor)
    await saveCategory(wrapper)
    await wrapper.find('.confirmation-cancel').trigger('click')

    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.find('.confirmation').exists()).toBe(false)
    expect((wrapper.vm as unknown as { open: boolean }).open).toBe(true)
    expect(
      wrapper.find<HTMLInputElement>(`input[type="radio"][value="${CategoryEntityKind.VoiceActor}"]`)
        .element.checked,
    ).toBe(true)
  })

  it('shows the role group only for a character draft and the language group only for a voice-actor draft', async () => {
    const wrapper = await mountDialog()

    expect(wrapper.find('button[aria-label="Add Main"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Add Japanese"]').exists()).toBe(false)

    await selectEntityKind(wrapper, CategoryEntityKind.Character)

    expect(wrapper.find('button[aria-label="Add Main"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Add Japanese"]').exists()).toBe(false)

    await selectEntityKind(wrapper, CategoryEntityKind.VoiceActor)

    expect(wrapper.find('button[aria-label="Add Main"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Add Japanese"]').exists()).toBe(true)
  })

  it('emits the toggled roles in the character filter', async () => {
    const wrapper = await mountDialog({
      category: createCategory({ entityKind: CategoryEntityKind.Character }),
    })

    await wrapper.find('button[aria-label="Add Main"]').trigger('click')
    await wrapper.find('button[aria-label="Add Supporting"]').trigger('click')
    await saveCategory(wrapper)

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      entityKind: CategoryEntityKind.Character,
      characterFilter: { roles: [CharacterRole.Main, CharacterRole.Supporting] },
      voiceActorFilter: { languages: [] },
    })
  })
})
