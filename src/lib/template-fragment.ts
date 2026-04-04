import type { TemplateId } from '@/types'

import { isTemplateId } from '@/lib/ids'

export type StartupTemplateReference =
  | {
      kind: 'id'
      templateId: TemplateId
    }
  | {
      kind: 'url'
      url: string
    }

const isHttpUrl = (value: string) => {
  try {
    const parsedUrl = new URL(value)

    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

const createHashParams = (hash: string | undefined) => {
  const rawHash = hash?.startsWith('#') ? hash.slice(1) : hash ?? ''

  return new URLSearchParams(rawHash.startsWith('?') ? rawHash.slice(1) : rawHash)
}

const createHashValue = (params: URLSearchParams) => {
  const serializedParams = params.toString()

  return serializedParams.length > 0 ? `#${serializedParams}` : ''
}

export const parseStartupTemplateReference = (
  hash: string | undefined,
): StartupTemplateReference | null => {
  const params = createHashParams(hash)
  const templateValue = params.get('template')?.trim()

  if (!templateValue) {
    return null
  }

  if (isTemplateId(templateValue)) {
    return {
      kind: 'id',
      templateId: templateValue,
    }
  }

  if (isHttpUrl(templateValue)) {
    return {
      kind: 'url',
      url: templateValue,
    }
  }

  return null
}

export const createTemplateHash = (reference: StartupTemplateReference | null, hash?: string) => {
  const params = createHashParams(hash)

  if (!reference) {
    params.delete('template')
    return createHashValue(params)
  }

  if (reference.kind === 'id') {
    params.set('template', reference.templateId)
  } else {
    params.set('template', reference.url)
  }

  return createHashValue(params)
}

export const replaceWindowTemplateHash = (reference: StartupTemplateReference | null) => {
  if (typeof window === 'undefined' || typeof history === 'undefined') {
    return
  }

  const nextHash = createTemplateHash(reference, window.location.hash)
  const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`

  history.replaceState(null, '', nextUrl)
}
