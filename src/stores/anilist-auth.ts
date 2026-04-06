import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  fetchAuthenticatedAniListViewer,
  isAniListAuthenticationFailure,
  normalizeAniListError,
} from '@/api'
import { appConfig } from '@/config/app'
import {
  type AniListOAuthCallbackPayload,
  clearAniListOAuthCallbackFragment,
  clearStoredAniListAuthSession,
  createAniListAuthorizationUrl,
  isAniListTokenExpired,
  loadStoredAniListAuthSession,
  parseAniListOAuthCallback,
  saveStoredAniListAuthSession,
} from '@/lib/anilist-auth'
import type { AniListAuthSession } from '@/types'

import { usePickerFiltersStore } from './picker-filters'
import { useToastStore } from './toasts'

type AniListAuthStatus = 'disconnected' | 'connecting' | 'connected'

const expiredSessionMessage = 'Your AniList session expired. Connect AniList again to keep using My Anime filters.'
const invalidSessionMessage = 'AniList rejected the saved session. Connect AniList again to keep using My Anime filters.'

export const useAniListAuthStore = defineStore('anilist-auth', () => {
  const status = ref<AniListAuthStatus>('disconnected')
  const accessToken = ref<string | null>(null)
  const username = ref<string | null>(null)
  const expiresAt = ref<number | null>(null)
  const pendingOAuthCallback = ref<AniListOAuthCallbackPayload | null>(null)
  const isHydrated = ref(false)

  const isConfigured = computed(() => appConfig.anilistClientId.length > 0)
  const isAuthenticated = computed(
    () => status.value === 'connected' && accessToken.value !== null && username.value !== null,
  )

  const applySession = (session: AniListAuthSession) => {
    accessToken.value = session.accessToken
    username.value = session.username
    expiresAt.value = session.expiresAt
    status.value = 'connected'
  }

  const clearSessionState = () => {
    accessToken.value = null
    username.value = null
    expiresAt.value = null
    status.value = 'disconnected'
  }

  const clearSession = (notification?: { title: string, description?: string }) => {
    const pickerFiltersStore = usePickerFiltersStore()
    const toastStore = useToastStore()

    clearStoredAniListAuthSession()
    clearSessionState()
    pickerFiltersStore.resetListVisibility()

    if (notification) {
      toastStore.info(notification.title, notification.description)
    }
  }

  const initialize = () => {
    if (isHydrated.value) {
      return
    }

    const storedSession = loadStoredAniListAuthSession()

    if (storedSession && !isAniListTokenExpired(storedSession.expiresAt)) {
      applySession(storedSession)
    } else {
      clearStoredAniListAuthSession()
    }

    pendingOAuthCallback.value = parseAniListOAuthCallback()
    isHydrated.value = true
  }

  const connect = () => {
    const toastStore = useToastStore()

    if (!isConfigured.value) {
      toastStore.error(
        'AniList login is unavailable.',
        'Set VITE_ANILIST_CLIENT_ID before trying to connect AniList.',
      )
      return false
    }

    if (typeof window === 'undefined') {
      return false
    }

    status.value = 'connecting'
    window.location.assign(createAniListAuthorizationUrl(appConfig.anilistClientId))
    return true
  }

  const disconnect = (notify = true) => {
    const hadSession = accessToken.value !== null

    clearSession(
      notify && hadSession
        ? {
            title: 'AniList disconnected.',
          }
        : undefined,
    )
  }

  const completeOAuthCallback = async () => {
    const toastStore = useToastStore()
    const callback = pendingOAuthCallback.value

    if (!callback) {
      return false
    }

    pendingOAuthCallback.value = null
    clearAniListOAuthCallbackFragment()

    if (callback.error) {
      clearSessionState()
      clearStoredAniListAuthSession()
      toastStore.error('AniList login failed.', callback.error)
      return true
    }

    if (!callback.accessToken || !callback.expiresAt || isAniListTokenExpired(callback.expiresAt)) {
      clearSessionState()
      clearStoredAniListAuthSession()
      toastStore.error('AniList login failed.', 'AniList returned an expired or incomplete session.')
      return true
    }

    status.value = 'connecting'

    try {
      const viewer = await fetchAuthenticatedAniListViewer(callback.accessToken)
      const nextSession: AniListAuthSession = {
        accessToken: callback.accessToken,
        username: viewer.name,
        expiresAt: callback.expiresAt,
      }

      saveStoredAniListAuthSession(nextSession)
      applySession(nextSession)
      toastStore.success('AniList connected.', viewer.name)
    } catch (error) {
      clearSessionState()
      clearStoredAniListAuthSession()
      toastStore.error('AniList login failed.', normalizeAniListError(error).message)
    }

    return true
  }

  const resolveAccessTokenForRequest = () => {
    if (!accessToken.value || !expiresAt.value) {
      return null
    }

    if (isAniListTokenExpired(expiresAt.value)) {
      clearSession({
        title: 'AniList session expired.',
        description: expiredSessionMessage,
      })
      return null
    }

    return accessToken.value
  }

  const handleRequestAuthFailure = (error?: unknown) => {
    if (!accessToken.value || (error && !isAniListAuthenticationFailure(error))) {
      return false
    }

    clearSession({
      title: 'AniList session ended.',
      description: invalidSessionMessage,
    })

    return true
  }

  return {
    status,
    accessToken,
    username,
    expiresAt,
    pendingOAuthCallback,
    isHydrated,
    isConfigured,
    isAuthenticated,
    initialize,
    connect,
    disconnect,
    completeOAuthCallback,
    resolveAccessTokenForRequest,
    handleRequestAuthFailure,
  }
})
