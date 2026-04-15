import { appConfig } from '@/config/app'
import type { AniListAuthSession } from '@/types'

const anilistAuthStorageKey = 'anime-toplist-builder.anilist-auth'
const anilistAuthStorageSchemaVersion = 1 as const
const anilistOAuthStateStorageKey = 'anime-toplist-builder.anilist-oauth-state.v1'
const expClaimToMilliseconds = 1000
const expiryGracePeriodMs = 30_000

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

interface StoredAniListAuthRecordV1 {
  schemaVersion: typeof anilistAuthStorageSchemaVersion
  accessToken: string
  username: string
  expiresAt: number
}

export interface AniListOAuthCallbackPayload {
  accessToken?: string
  expiresAt?: number | null
  error?: string
  state?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const decodeBase64Url = (value: string) => {
  const normalizedValue = value.replaceAll('-', '+').replaceAll('_', '/')
  const paddingLength = (4 - (normalizedValue.length % 4 || 4)) % 4
  const paddedValue = `${normalizedValue}${'='.repeat(paddingLength)}`

  if (typeof atob === 'function') {
    return atob(paddedValue)
  }

  return null
}

const decodeJwtPayload = (accessToken: string) => {
  const [, payload] = accessToken.split('.')

  if (!payload) {
    return null
  }

  try {
    const decodedPayload = decodeBase64Url(payload)

    if (!decodedPayload) {
      return null
    }

    return JSON.parse(decodedPayload) as unknown
  } catch {
    return null
  }
}

const sanitizeOAuthError = (error: string | null, description: string | null) => {
  if (error === 'access_denied') {
    return 'AniList login was cancelled.'
  }

  if (description) {
    return description
  }

  if (error) {
    return 'AniList login could not be completed.'
  }

  return null
}

export const getBrowserSessionStorage = (): BrowserStorage | null => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.sessionStorage
}

export const getAniListTokenExpiresAt = (
  accessToken: string,
  expiresInSeconds?: number | null,
  now = Date.now(),
) => {
  const jwtPayload = decodeJwtPayload(accessToken)

  if (isRecord(jwtPayload) && typeof jwtPayload.exp === 'number' && Number.isFinite(jwtPayload.exp)) {
    return jwtPayload.exp * expClaimToMilliseconds
  }

  if (typeof expiresInSeconds === 'number' && Number.isFinite(expiresInSeconds) && expiresInSeconds > 0) {
    return now + expiresInSeconds * expClaimToMilliseconds
  }

  return null
}

export const isAniListTokenExpired = (expiresAt: number, now = Date.now()) =>
  expiresAt <= now + expiryGracePeriodMs

export const loadStoredAniListAuthSession = (
  storage = getBrowserSessionStorage(),
): AniListAuthSession | null => {
  const serializedValue = storage?.getItem(anilistAuthStorageKey)

  if (!serializedValue) {
    return null
  }

  try {
    const parsedValue = JSON.parse(serializedValue) as unknown

    if (
      !isRecord(parsedValue) ||
      parsedValue.schemaVersion !== anilistAuthStorageSchemaVersion ||
      !isNonEmptyString(parsedValue.accessToken) ||
      !isNonEmptyString(parsedValue.username) ||
      typeof parsedValue.expiresAt !== 'number' ||
      !Number.isFinite(parsedValue.expiresAt)
    ) {
      return null
    }

    return {
      accessToken: parsedValue.accessToken,
      username: parsedValue.username,
      expiresAt: parsedValue.expiresAt,
    }
  } catch {
    return null
  }
}

export const saveStoredAniListAuthSession = (
  session: AniListAuthSession,
  storage = getBrowserSessionStorage(),
) => {
  storage?.setItem(
    anilistAuthStorageKey,
    JSON.stringify({
      schemaVersion: anilistAuthStorageSchemaVersion,
      accessToken: session.accessToken,
      username: session.username,
      expiresAt: session.expiresAt,
    } satisfies StoredAniListAuthRecordV1),
  )
}

export const clearStoredAniListAuthSession = (storage = getBrowserSessionStorage()) => {
  storage?.removeItem(anilistAuthStorageKey)
}

const generateOAuthState = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)

    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export const createAniListOAuthState = () => generateOAuthState()

export const saveAniListOAuthState = (state: string, storage = getBrowserSessionStorage()) => {
  storage?.setItem(anilistOAuthStateStorageKey, state)
}

export const loadAniListOAuthState = (storage = getBrowserSessionStorage()) =>
  storage?.getItem(anilistOAuthStateStorageKey) ?? null

export const clearAniListOAuthState = (storage = getBrowserSessionStorage()) => {
  storage?.removeItem(anilistOAuthStateStorageKey)
}

export const parseAniListOAuthCallback = (
  hash = typeof window === 'undefined' ? '' : window.location.hash,
): AniListOAuthCallbackPayload | null => {
  const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash

  if (normalizedHash.length === 0) {
    return null
  }

  const params = new URLSearchParams(normalizedHash)

  if (!params.has('access_token') && !params.has('error')) {
    return null
  }

  const accessToken = params.get('access_token')?.trim() || undefined
  const expiresInValue = params.get('expires_in')
  const expiresInSeconds = expiresInValue ? Number.parseInt(expiresInValue, 10) : null
  const error = sanitizeOAuthError(params.get('error'), params.get('error_description'))
  const state = params.get('state')?.trim() || undefined

  return {
    accessToken,
    expiresAt: accessToken
      ? getAniListTokenExpiresAt(
          accessToken,
          Number.isFinite(expiresInSeconds) ? expiresInSeconds : null,
        )
      : null,
    error: error ?? undefined,
    state,
  }
}

export const clearAniListOAuthCallbackFragment = () => {
  if (typeof window === 'undefined') {
    return
  }

  const nextUrl = `${window.location.pathname}${window.location.search}`
  window.history.replaceState(null, '', nextUrl)
}

export const createAniListAuthorizationUrl = (clientId: string, state: string) => {
  const url = new URL('/api/v2/oauth/authorize', appConfig.anilistUrl)

  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'token')
  url.searchParams.set('state', state)

  return url.toString()
}
