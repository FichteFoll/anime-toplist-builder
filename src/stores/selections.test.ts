import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useSelectionsStore } from '@/stores/selections'
import { createBlankCategory, createBlankTemplate } from '@/lib/template-factories'
import { createCharacterSelection, createVoiceActorSelection } from '@/lib/relation-selection'
import { CategoryEntityKind, CharacterRole, type Category, type Template } from '@/types'

const animeTitle = {
  userPreferred: 'Re:Zero kara Hajimeru Isekai Seikatsu',
  romaji: 'Re:Zero kara Hajimeru Isekai Seikatsu',
  english: null,
  native: null,
}

const animeCoverImage = {
  large: 'https://img.example/rezero-large.jpg',
  medium: null,
  extraLarge: null,
  color: '#1f2937',
}

const characterImage = {
  large: 'https://img.example/rem-large.jpg',
  medium: null,
}

const createCharacterFixture = () => createCharacterSelection({
  characterId: 118737,
  characterName: 'Rem',
  characterNativeName: 'レム',
  characterImage,
  role: CharacterRole.Main,
  animeId: 21355,
  animeTitle,
  animeCoverImage,
})

const createVoiceActorFixture = () => createVoiceActorSelection({
  voiceActorId: 95159,
  voiceActorName: 'Rie Takahashi',
  voiceActorNativeName: '高橋李依',
  voiceActorImage: {
    large: 'https://img.example/takahashi-large.jpg',
    medium: null,
  },
  language: 'Japanese',
  characterId: 118737,
  characterName: 'Rem',
  characterNativeName: 'レム',
  characterImage,
  role: CharacterRole.Main,
  animeId: 21355,
  animeTitle,
  animeCoverImage,
})

const createTemplateWithCategory = (entityKind: CategoryEntityKind) => {
  const category: Category = {
    ...createBlankCategory('Best Girl'),
    entityKind,
  }
  const template: Template = {
    ...createBlankTemplate(),
    categories: [category],
  }

  return { template, category }
}

describe('selections store pruning', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('keeps a voice-actor selection in a voice-actor category', () => {
    const selectionsStore = useSelectionsStore()
    const { template, category } = createTemplateWithCategory(CategoryEntityKind.VoiceActor)
    const selection = createVoiceActorFixture()

    selectionsStore.initialize()
    selectionsStore.setCategorySelection(template.id, category.id, selection)
    selectionsStore.pruneSelectionsForTemplates([template])

    expect(selectionsStore.getCategorySelection(template.id, category.id)).toEqual(selection)
  })

  it('keeps a character selection in a character category', () => {
    const selectionsStore = useSelectionsStore()
    const { template, category } = createTemplateWithCategory(CategoryEntityKind.Character)
    const selection = createCharacterFixture()

    selectionsStore.initialize()
    selectionsStore.setCategorySelection(template.id, category.id, selection)
    selectionsStore.pruneSelectionsForTemplates([template])

    expect(selectionsStore.getCategorySelection(template.id, category.id)).toEqual(selection)
  })

  it('drops a character selection from a category switched to anime', () => {
    const selectionsStore = useSelectionsStore()
    const { template, category } = createTemplateWithCategory(CategoryEntityKind.Character)

    selectionsStore.initialize()
    selectionsStore.setCategorySelection(template.id, category.id, createCharacterFixture())

    const animeTemplate: Template = {
      ...template,
      categories: [{ ...category, entityKind: CategoryEntityKind.Anime }],
    }

    selectionsStore.pruneSelectionsForTemplates([animeTemplate])

    expect(selectionsStore.getCategorySelection(template.id, category.id)).toBeNull()
  })
})
