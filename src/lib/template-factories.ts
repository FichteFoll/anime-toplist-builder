import { templateSchemaVersion, type Template, type TemplateOrigin } from '@/types'

import { createCategoryId, createTemplateId } from '@/lib/ids'
import { createEmptyFilterState } from '@/lib/filter-state'
import { createEmptySongFilterState } from '@/lib/song-selection'

const cloneWithFallback = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch {
      // Vue store state can include proxies that structuredClone rejects.
      // Fall back to JSON cloning for this plain template data shape.
    }
  }

  return JSON.parse(JSON.stringify(value)) as T
}

export const createBlankTemplate = (
  name = 'My Anime Toplist',
  origin: TemplateOrigin = 'user',
): Template => ({
  id: createTemplateId(),
  name,
  description: '',
  categories: [],
  globalFilter: createEmptyFilterState(),
  origin,
  version: templateSchemaVersion,
})

export const createBlankCategory = (name: string) => ({
  id: createCategoryId(),
  name,
  description: '',
  filter: createEmptyFilterState(),
  entityKind: 'anime' as const,
  songFilter: createEmptySongFilterState(),
})

export const cloneTemplate = (template: Template): Template => cloneWithFallback(template)

export const forkTemplate = (template: Template): Template => ({
  ...cloneTemplate(template),
  id: createTemplateId(),
  origin: 'user',
})

export const isProtectedTemplateOrigin = (origin: TemplateOrigin) =>
  origin === 'predefined' || origin === 'imported-url'
