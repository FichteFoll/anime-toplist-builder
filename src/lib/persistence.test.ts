import { describe, expect, it, vi } from 'vitest'

import {
  loadStoredSelections,
  loadStoredSettings,
  loadStoredTemplates,
  saveStoredSelections,
  saveStoredTemplates,
} from '@/lib/persistence'
import { normalizeImportedTemplate } from '@/lib/template-validation'
import { templateSchemaVersion, type AnimeSelection } from '@/types'

type MockStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & {
  read: (key: string) => unknown
  write: (key: string, value: unknown) => void
}

const createMockStorage = (): MockStorage => {
  const values = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key)
    }),
    read: (key: string) => {
      const value = values.get(key)
      return value ? (JSON.parse(value) as unknown) : null
    },
    write: (key: string, value: unknown) => {
      values.set(key, JSON.stringify(value))
    },
  }
}

const createSelection = (): AnimeSelection => ({
  mediaId: 123,
  title: {
    userPreferred: 'Serial Experiments Lain',
    romaji: 'Serial Experiments Lain',
    english: null,
    native: null,
  },
  coverImage: {
    large: 'https://img.example/lain-large.jpg',
    medium: 'https://img.example/lain-medium.jpg',
    extraLarge: null,
    color: '#111827',
  },
  season: 'SUMMER',
  seasonYear: 1998,
  format: 'TV',
})

describe('persistence helpers', () => {
  it('round-trips stored templates and keeps remote URL metadata', () => {
    const storage = createMockStorage()
    const userTemplate = normalizeImportedTemplate(
      {
        version: templateSchemaVersion,
        id: 'tpl_userlocal01',
        name: 'Local Template',
        categories: [{ id: 'cat_localpick01', name: 'Local Pick', description: '' }],
      },
      'user',
    )
    const remoteTemplate = normalizeImportedTemplate(
      {
        version: templateSchemaVersion,
        id: 'tpl_remotelocal01',
        name: 'Remote Template',
        categories: [{ id: 'cat_remotepick01', name: 'Remote Pick', description: '' }],
      },
      'imported-url',
    )
    const predefinedTemplate = normalizeImportedTemplate(
      {
        version: templateSchemaVersion,
        id: 'tpl_predefinedlocal01',
        name: 'Predefined Template',
        categories: [{ id: 'cat_predefinedpick01', name: 'Predefined Pick', description: '' }],
      },
      'predefined',
    )

    saveStoredTemplates(
      [userTemplate, remoteTemplate, predefinedTemplate],
      {
        [remoteTemplate.id]: 'https://example.com/template.json',
      },
      storage,
    )

    const storedRecord = storage.read('anime-toplist.templates.v1') as {
      templates: Array<{ id: string, origin: string, remoteUrl?: string }>
    }

    expect(storedRecord.templates).toHaveLength(2)
    expect(storedRecord.templates.map((entry) => entry.id)).toEqual([
      userTemplate.id,
      remoteTemplate.id,
    ])
    expect(storedRecord.templates.find((entry) => entry.id === remoteTemplate.id)?.remoteUrl).toBe(
      'https://example.com/template.json',
    )

    expect(loadStoredTemplates(storage)).toEqual({
      templates: [userTemplate, remoteTemplate],
      remoteTemplateUrls: {
        [remoteTemplate.id]: 'https://example.com/template.json',
      },
    })
  })

  it('falls back to default settings when stored values are invalid', () => {
    const storage = createMockStorage()

    storage.write('anime-toplist.settings.v1', {
      schemaVersion: 1,
      themePreference: 'neon',
      titleLanguage: 'pirate',
      lastOpenedTemplateId: 42,
    })

    expect(loadStoredSettings(storage)).toEqual({
      schemaVersion: 1,
      themePreference: 'system',
      titleLanguage: 'userPreferred',
      lastOpenedTemplateId: undefined,
    })
  })

  it('loads valid selections while dropping malformed entries', () => {
    const storage = createMockStorage()
    const validSelection = createSelection()

    storage.write('anime-toplist.selections.v1', {
      schemaVersion: 1,
      selections: {
        tpl_valid: {
          cat_saved: validSelection,
          cat_cleared: null,
          cat_broken: {
            mediaId: 'bad',
          },
        },
        tpl_invalid: 'nope',
      },
    })

    expect(loadStoredSelections(storage)).toEqual({
      tpl_valid: {
        cat_saved: validSelection,
        cat_cleared: null,
      },
    })
  })

  it('removes persisted selections when nothing remains', () => {
    const storage = createMockStorage()

    saveStoredSelections({}, storage)

    expect(storage.removeItem).toHaveBeenCalledWith('anime-toplist.selections.v1')
  })
})
