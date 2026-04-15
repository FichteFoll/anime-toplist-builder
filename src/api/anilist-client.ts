import { AniListErrorKind, type AniListError } from '@/types'

import type { GraphQlResponse } from './anilist-types'

const anilistGraphQlEndpoint = 'https://graphql.anilist.co'

export class AniListRequestError extends Error {
  readonly normalizedError: AniListError

  constructor(normalizedError: AniListError) {
    super(normalizedError.message)
    this.name = 'AniListRequestError'
    this.normalizedError = normalizedError
  }
}

export interface AniListRequestOptions {
  accessToken?: string | null
}

const createAniListError = (error: AniListError) => new AniListRequestError(error)

const isAniListErrorResponse = (value: unknown): value is { message: string } =>
  typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string'

const isAbortError = (value: unknown) => value instanceof DOMException && value.name === 'AbortError'

const normalizeUnknownError = (error: unknown): AniListError => {
  if (error instanceof AniListRequestError) {
    return error.normalizedError
  }

  if (isAbortError(error)) {
    return {
      kind: AniListErrorKind.Unknown,
      message: 'The AniList request was cancelled.',
      details: [],
      retryable: true,
    }
  }

  if (error instanceof TypeError) {
    return {
      kind: AniListErrorKind.Network,
      message: 'AniList could not be reached. Check your connection and try again.',
      details: [],
      retryable: true,
    }
  }

  if (error instanceof Error) {
    return {
      kind: AniListErrorKind.Unknown,
      message: error.message,
      details: [],
      retryable: true,
    }
  }

    return {
      kind: AniListErrorKind.Unknown,
    message: 'AniList request failed for an unknown reason.',
    details: [],
    retryable: true,
  }
}

const parseResponseJson = async <TData>(response: Response) => {
  try {
    return (await response.json()) as GraphQlResponse<TData>
  } catch {
    throw createAniListError({
      kind: AniListErrorKind.Parse,
      message: 'AniList returned an unreadable response.',
      details: [],
      retryable: true,
      status: response.status,
    })
  }
}

const normalizeGraphQlErrors = (messages: string[], status?: number): AniListError => ({
  kind:
    status === 401 || status === 403
      ? AniListErrorKind.Auth
      : status && status >= 400
        ? AniListErrorKind.Http
        : AniListErrorKind.GraphQl,
  message: messages[0] ?? 'AniList returned an unexpected error.',
  details: messages.slice(1),
  retryable: status === undefined || status >= 500 || status === 429,
  status,
})

export const isAniListAuthenticationFailure = (error: unknown) => {
  const normalizedError = normalizeUnknownError(error)

  return normalizedError.status === 401 || normalizedError.status === 403
}

export const normalizeAniListError = (error: unknown): AniListError => normalizeUnknownError(error)

export async function requestAniList<TData, TVariables extends object>(
  query: string,
  variables: TVariables,
  options: AniListRequestOptions = {},
): Promise<TData> {
  let response: Response

  try {
    response = await fetch(anilistGraphQlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.accessToken
          ? {
              Authorization: `Bearer ${options.accessToken}`,
            }
          : {}),
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    })
  } catch (error) {
    throw createAniListError(normalizeUnknownError(error))
  }

  const payload = await parseResponseJson<TData>(response)

  if (payload.errors && payload.errors.length > 0) {
    throw createAniListError(
      normalizeGraphQlErrors(
        payload.errors.filter(isAniListErrorResponse).map((entry) => entry.message),
        response.ok ? undefined : response.status,
      ),
    )
  }

  if (!response.ok) {
    throw createAniListError({
      kind: response.status === 401 || response.status === 403 ? AniListErrorKind.Auth : AniListErrorKind.Http,
      message: `AniList request failed with status ${response.status}.`,
      details: [],
      retryable: response.status >= 500 || response.status === 429,
      status: response.status,
    })
  }

  if (!payload.data) {
    throw createAniListError({
      kind: AniListErrorKind.Parse,
      message: 'AniList returned no data for the request.',
      details: [],
      retryable: true,
      status: response.status,
    })
  }

  return payload.data
}
