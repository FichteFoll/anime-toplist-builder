import { describe, expect, it, vi } from 'vitest'

import {
  clearAniListOAuthCallbackFragment,
  createAniListAuthorizationUrl,
  getAniListTokenExpiresAt,
  isAniListTokenExpired,
  parseAniListOAuthCallback,
} from './anilist-auth'

const createJwt = (payload: Record<string, unknown>) => {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')

  return `header.${encodedPayload}.signature`
}

describe('anilist auth helpers', () => {
  it('prefers the jwt exp claim for token expiry', () => {
    const accessToken = createJwt({ exp: 1_900_000_000 })

    expect(getAniListTokenExpiresAt(accessToken, 60, 0)).toBe(1_900_000_000_000)
  })

  it('falls back to expires_in when the jwt payload is unreadable', () => {
    expect(getAniListTokenExpiresAt('invalid-token', 120, 5_000)).toBe(125_000)
  })

  it('parses anilist oauth fragments without preserving the full url', () => {
    const accessToken = createJwt({ exp: 1_900_000_000 })
    const payload = parseAniListOAuthCallback(`#access_token=${accessToken}&token_type=Bearer`)

    expect(payload).toEqual({
      accessToken,
      expiresAt: 1_900_000_000_000,
      error: undefined,
    })
  })

  it('clears oauth callback fragments from the current url', () => {
    const replaceState = vi.fn()

    vi.stubGlobal('window', {
      location: {
        pathname: '/anime-toplist/',
        search: '?view=picker',
      },
      history: {
        replaceState,
      },
    })

    clearAniListOAuthCallbackFragment()

    expect(replaceState).toHaveBeenCalledWith(null, '', '/anime-toplist/?view=picker')
  })

  it('includes required parameters authorization query', () => {
    const authorizationUrl = new URL(createAniListAuthorizationUrl('client-id'))

    expect(authorizationUrl.searchParams.get('client_id')).toBe('client-id')
    expect(authorizationUrl.searchParams.get('response_type')).toBe('token')
  })

  it('treats near-expired tokens as expired', () => {
    expect(isAniListTokenExpired(10_000, 0)).toBe(true)
    expect(isAniListTokenExpired(40_000, 0)).toBe(false)
  })
})
