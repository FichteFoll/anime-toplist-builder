/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANILIST_URL?: string
  readonly VITE_ANILIST_CLIENT_ID?: string
  readonly VITE_ANIMETHEMES_URL?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_BASE_PATH?: string
  readonly VITE_DEFAULT_TEMPLATE_ID?: string
  readonly VITE_EXPORT_SITE_URL?: string
  readonly VITE_REPOSITORY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __BUILD_COMMIT__: string
declare const __BUILD_TIME__: string
