import { defaultThemePreference } from '@/types'

export const appConfig = {
  appName: import.meta.env.VITE_APP_NAME?.trim() || 'Anime Toplist',
  repositoryUrl:
    import.meta.env.VITE_REPOSITORY_URL?.trim() || 'https://github.com/_/anime-toplist',
  anilistUrl: import.meta.env.VITE_ANILIST_URL?.trim() || 'https://anilist.co',
  defaultTemplateId: import.meta.env.VITE_DEFAULT_TEMPLATE_ID?.trim() || '',
  defaultTheme: defaultThemePreference,
  exportSiteUrl:
    import.meta.env.VITE_EXPORT_SITE_URL?.trim() || 'https://_.github.io/anime-toplist/',
  baseUrl: import.meta.env.BASE_URL,
}
