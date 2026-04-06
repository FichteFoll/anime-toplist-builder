import { defaultThemePreference } from '@/types'

export const appConfig = {
  appName: import.meta.env.VITE_APP_NAME?.trim() || 'Anime Toplist Builder',
  repositoryUrl:
    import.meta.env.VITE_REPOSITORY_URL?.trim() || 'https://github.com/_/anime-toplist-builder',
  anilistUrl: import.meta.env.VITE_ANILIST_URL?.trim() || 'https://anilist.co',
  anilistClientId: import.meta.env.VITE_ANILIST_CLIENT_ID?.trim() || '',
  defaultTemplateId: import.meta.env.VITE_DEFAULT_TEMPLATE_ID?.trim() || '',
  defaultTheme: defaultThemePreference,
  exportSiteUrl:
    import.meta.env.VITE_EXPORT_SITE_URL?.trim() || 'https://_.github.io/anime-toplist-builder/',
  baseUrl: import.meta.env.BASE_URL,
}
