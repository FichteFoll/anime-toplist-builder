import type { CategoryId, TemplateId } from '@/types'

const fallbackIdSegment = () => Math.random().toString(36).slice(2, 10)

const createStableId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${fallbackIdSegment()}`
}

const legacyPrefixedIdPattern = /^(?:tpl|cat)_[A-Za-z0-9-]{6,}$/
const stableIdPattern = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/

const matchesStableId = (value: unknown): value is string =>
  typeof value === 'string' && (stableIdPattern.test(value) || legacyPrefixedIdPattern.test(value))

export const createTemplateId = (): TemplateId => createStableId()

export const createCategoryId = (): CategoryId => createStableId()

export const isTemplateId = (value: unknown): value is TemplateId =>
  matchesStableId(value)

export const isCategoryId = (value: unknown): value is CategoryId =>
  matchesStableId(value)
