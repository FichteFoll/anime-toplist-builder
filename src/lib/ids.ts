import type { CategoryId, TemplateId } from '@/types'

const templateIdPrefix = 'tpl'
const categoryIdPrefix = 'cat'

const fallbackIdSegment = () => Math.random().toString(36).slice(2, 10)

const createStableId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }

  return `${prefix}_${Date.now().toString(36)}_${fallbackIdSegment()}`
}

const matchesPrefixedId = (value: unknown, prefix: string): value is string =>
  typeof value === 'string' && new RegExp(`^${prefix}_[A-Za-z0-9-]{6,}$`).test(value)

export const createTemplateId = (): TemplateId => createStableId(templateIdPrefix)

export const createCategoryId = (): CategoryId => createStableId(categoryIdPrefix)

export const isTemplateId = (value: unknown): value is TemplateId =>
  matchesPrefixedId(value, templateIdPrefix)

export const isCategoryId = (value: unknown): value is CategoryId =>
  matchesPrefixedId(value, categoryIdPrefix)
