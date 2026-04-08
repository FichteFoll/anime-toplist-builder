import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSelectionsStore } from '@/stores/selections'
import { useSettingsStore } from '@/stores/settings'
import { useTemplateStore } from '@/stores/templates'
import { predefinedTemplates } from '@/templates/predefined'
import { createAnimeSelection } from '@/lib/song-selection'
import { templateSchemaVersion, type AnimeSelection } from '@/types'

const createSelection = (): AnimeSelection => createAnimeSelection({
  mediaId: 5114,
  title: {
    userPreferred: 'Fullmetal Alchemist: Brotherhood',
    romaji: 'Fullmetal Alchemist: Brotherhood',
    english: 'Fullmetal Alchemist: Brotherhood',
    native: null,
  },
  coverImage: {
    large: 'https://img.example/fmab-large.jpg',
    medium: null,
    extraLarge: null,
    color: '#1f2937',
  },
  season: 'SPRING',
  seasonYear: 2009,
  format: 'TV',
})

describe('template store fork-on-edit behavior', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('forks protected templates before updating them and duplicates selections', () => {
    const settingsStore = useSettingsStore()
    const selectionsStore = useSelectionsStore()
    const templateStore = useTemplateStore()

    settingsStore.initialize()
    selectionsStore.initialize()
    templateStore.initialize()
    templateStore.registerTemplates(predefinedTemplates)

    const sourceTemplate = templateStore.predefinedTemplates[0]

    expect(sourceTemplate).toBeDefined()
    expect(templateStore.setActiveTemplate(sourceTemplate.id)).toBe(true)

    const sourceCategoryId = sourceTemplate.categories[0]?.id
    const selection = createSelection()

    expect(sourceCategoryId).toBeDefined()
    selectionsStore.setCategorySelection(sourceTemplate.id, sourceCategoryId!, selection)

    const updatedTemplate = templateStore.updateActiveTemplate((template) => {
      template.name = 'Forked Predefined Copy'
      template.categories[0]!.name = 'Updated Category'
    })

    expect(updatedTemplate).not.toBeNull()
    expect(updatedTemplate?.id).not.toBe(sourceTemplate.id)
    expect(updatedTemplate?.origin).toBe('user')
    expect(updatedTemplate?.version).toBe(templateSchemaVersion)
    expect(updatedTemplate?.name).toBe('Forked Predefined Copy')
    expect(updatedTemplate?.description).toBe(sourceTemplate.description)
    expect(templateStore.activeTemplateId).toBe(updatedTemplate?.id)
    expect(selectionsStore.getCategorySelection(updatedTemplate!.id, sourceCategoryId!)).toEqual(selection)
    expect(selectionsStore.getCategorySelection(sourceTemplate.id, sourceCategoryId!)).toEqual(selection)
    expect(templateStore.templates.find((template) => template.id === sourceTemplate.id)?.name).toBe(
      sourceTemplate.name,
    )
  })

  it('updates user-owned templates in place', () => {
    const templateStore = useTemplateStore()
    const settingsStore = useSettingsStore()

    settingsStore.initialize()
    templateStore.initialize()

    const createdTemplate = templateStore.createTemplate('Editable Template')
    const updatedTemplate = templateStore.updateActiveTemplate((template) => {
      template.name = 'Edited In Place'
      template.description = 'Edited context'
    })

    expect(updatedTemplate?.id).toBe(createdTemplate.id)
    expect(updatedTemplate?.origin).toBe('user')
    expect(templateStore.activeTemplate?.id).toBe(createdTemplate.id)
    expect(templateStore.activeTemplate?.name).toBe('Edited In Place')
    expect(templateStore.activeTemplate?.description).toBe('Edited context')
  })

  it('removes user-owned templates', () => {
    const templateStore = useTemplateStore()
    const settingsStore = useSettingsStore()

    settingsStore.initialize()
    templateStore.initialize()

    const createdTemplate = templateStore.createTemplate('Deletable Template')

    expect(templateStore.removeLocalTemplate(createdTemplate.id)).toBe(true)
    expect(templateStore.templates.some((template) => template.id === createdTemplate.id)).toBe(false)
    expect(templateStore.activeTemplate?.id).not.toBe(createdTemplate.id)
  })

  it('keeps fragment remote templates from falling back to the default template', () => {
    const settingsStore = useSettingsStore()
    const templateStore = useTemplateStore()

    settingsStore.initialize()

    vi.stubGlobal('window', {
      location: {
        hash: '#template=https%3A%2F%2Fexample.com%2Ftemplate.json',
      },
    })

    templateStore.initialize()
    templateStore.registerTemplates(predefinedTemplates)

    expect(templateStore.pendingStartupTemplateUrl).toBe('https://example.com/template.json')
    expect(templateStore.activeTemplate).toBeNull()
  })

  it('resolves fragment template ids after predefined templates register', () => {
    const settingsStore = useSettingsStore()
    const templateStore = useTemplateStore()

    settingsStore.initialize()
    vi.stubGlobal('window', {
      location: {
        hash: `#template=${predefinedTemplates[0].id}`,
      },
    })

    templateStore.initialize()
    expect(templateStore.activeTemplate).toBeNull()

    templateStore.registerTemplates(predefinedTemplates)

    expect(templateStore.activeTemplateId).toBe(predefinedTemplates[0].id)
    expect(templateStore.activeTemplate?.id).toBe(predefinedTemplates[0].id)
  })

  it('keeps the series preset limited to long-form entries', () => {
    const allTimeFavorites = predefinedTemplates.find((template) => template.id === 'all-time-favorites')

    expect(allTimeFavorites?.categories.find((category) => category.id === 'bestseries01')?.filter).toMatchObject({
      episodes: { minimum: 4 },
    })
  })

  it('keeps the anime awards series categories limited to long-form entries', () => {
    const animeAwards = predefinedTemplates.find((template) => template.id === 'cr-anime-awards-2025')

    expect(animeAwards?.categories.find((category) => category.id === 'bestcontinuingseries01')?.filter).toMatchObject(
      { episodes: { minimum: 4 } },
    )
    expect(animeAwards?.categories.find((category) => category.id === 'bestnewseries01')?.filter).toMatchObject({
      episodes: { minimum: 4 },
    })
  })
})
