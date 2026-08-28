import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fetchAuthenticatedAniListViewer: vi.fn(),
  normalizeAniListError: vi.fn((error: unknown) => ({
    message: error instanceof Error ? error.message : 'Unknown error',
  })),
  errorSpy: vi.fn(),
  infoSpy: vi.fn(),
  successSpy: vi.fn(),
  pickerResetListVisibility: vi.fn(),
}))

vi.mock('@/api', () => ({
  fetchAuthenticatedAniListViewer: mocks.fetchAuthenticatedAniListViewer,
  isAniListAuthenticationFailure: vi.fn(),
  normalizeAniListError: mocks.normalizeAniListError,
}))

vi.mock('@/config/app', () => ({
  appConfig: {
    anilistClientId: 'client-id',
  },
}))

vi.mock('@/stores/toasts', () => ({
  useToastStore: () => ({
    error: mocks.errorSpy,
    info: mocks.infoSpy,
    success: mocks.successSpy,
  }),
}))

vi.mock('@/stores/picker-filters', () => ({
  usePickerFiltersStore: () => ({
    resetListVisibility: mocks.pickerResetListVisibility,
  }),
}))

import { useAniListAuthStore } from './anilist-auth'
import { saveAniListOAuthState } from '@/lib/anilist-auth'

describe('anilist auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('rejects oauth callbacks when state does not match', async () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }

    vi.stubGlobal('window', {
      location: {
        pathname: '/app/',
        search: '',
        hash: '#access_token=token&expires_in=60&state=wrong-state',
      },
      history: {
        replaceState: vi.fn(),
      },
      sessionStorage: storage,
    })

    storage.getItem.mockReturnValue('expected-state')
    saveAniListOAuthState('expected-state', storage)

    const store = useAniListAuthStore()
    store.initialize()

    await store.completeOAuthCallback()

    expect(mocks.fetchAuthenticatedAniListViewer).not.toHaveBeenCalled()
    expect(mocks.errorSpy).toHaveBeenCalledWith('AniList login failed.', 'AniList login state was invalid.')
    expect(storage.removeItem).toHaveBeenCalledWith('anime-toplist-builder.anilist-oauth-state.v1')
  })

  it('stores viewer avatar details after a successful oauth callback', async () => {
    const accessToken = 'header.payload.signature'
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }

    vi.stubGlobal('window', {
      location: {
        pathname: '/app/',
        search: '',
        hash: `#access_token=${accessToken}&expires_in=60&state=expected-state`,
      },
      history: {
        replaceState: vi.fn(),
      },
      sessionStorage: storage,
    })

    storage.getItem.mockReturnValue('expected-state')
    mocks.fetchAuthenticatedAniListViewer.mockResolvedValue({
      name: 'viewer-name',
      avatarUrl: 'https://cdn.test/avatar.png',
    })

    const store = useAniListAuthStore()
    store.initialize()

    await store.completeOAuthCallback()

    expect(store.username).toBe('viewer-name')
    expect(store.avatarUrl).toBe('https://cdn.test/avatar.png')
    expect(storage.setItem).toHaveBeenCalledWith(
      'anime-toplist-builder.anilist-auth',
      expect.stringContaining('"avatarUrl":"https://cdn.test/avatar.png"'),
    )
    expect(mocks.successSpy).toHaveBeenCalledWith('AniList connected.', 'viewer-name')
  })
})
