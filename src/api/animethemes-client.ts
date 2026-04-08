import type { AniListError } from '@/types'
import { appConfig } from '@/config/app'

import type { GraphQlResponse } from './animethemes-types'

const animeThemesGraphQlEndpoint = appConfig.animeThemesUrl

export class AnimeThemesRequestError extends Error {
  readonly normalizedError: AniListError

  constructor(normalizedError: AniListError) {
    super(normalizedError.message)
    this.name = 'AnimeThemesRequestError'
    this.normalizedError = normalizedError
  }
}

const createAnimeThemesError = (error: AniListError) => new AnimeThemesRequestError(error)

const isErrorResponse = (value: unknown): value is { message: string } =>
  typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string'

const normalizeUnknownError = (error: unknown): AniListError => {
  if (error instanceof AnimeThemesRequestError) {
    return error.normalizedError
  }

  if (error instanceof TypeError) {
    return {
      kind: 'network',
      message: 'AnimeThemes could not be reached. Check your connection and try again.',
      details: [],
      retryable: true,
    }
  }

  if (error instanceof Error) {
    return {
      kind: 'unknown',
      message: error.message,
      details: [],
      retryable: true,
    }
  }

  return {
    kind: 'unknown',
    message: 'AnimeThemes request failed for an unknown reason.',
    details: [],
    retryable: true,
  }
}

const parseResponseJson = async <TData>(response: Response) => {
  try {
    return (await response.json()) as GraphQlResponse<TData>
  } catch {
    throw createAnimeThemesError({
      kind: 'parse',
      message: 'AnimeThemes returned an unreadable response.',
      details: [],
      retryable: true,
      status: response.status,
    })
  }
}

const normalizeGraphQlErrors = (messages: string[], status?: number): AniListError => ({
  kind: status && status >= 400 ? 'http' : 'graphql',
  message: messages[0] ?? 'AnimeThemes returned an unexpected error.',
  details: messages.slice(1),
  retryable: status === undefined || status >= 500 || status === 429,
  status,
})

export const normalizeAnimeThemesError = (error: unknown): AniListError => normalizeUnknownError(error)

export async function requestAnimeThemes<TData, TVariables extends object>(
  query: string,
  variables: TVariables,
): Promise<TData> {
  let response: Response

  try {
    response = await fetch(animeThemesGraphQlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    })
  } catch (error) {
    throw createAnimeThemesError(normalizeUnknownError(error))
  }

  const payload = await parseResponseJson<TData>(response)

  if (payload.errors && payload.errors.length > 0) {
    throw createAnimeThemesError(
      normalizeGraphQlErrors(
        payload.errors.filter(isErrorResponse).map((entry) => entry.message),
        response.ok ? undefined : response.status,
      ),
    )
  }

  if (!response.ok) {
    throw createAnimeThemesError({
      kind: 'http',
      message: `AnimeThemes request failed with status ${response.status}.`,
      details: [],
      retryable: response.status >= 500 || response.status === 429,
      status: response.status,
    })
  }

  if (!payload.data) {
    throw createAnimeThemesError({
      kind: 'parse',
      message: 'AnimeThemes returned no data for the request.',
      details: [],
      retryable: true,
      status: response.status,
    })
  }

  return payload.data
}
