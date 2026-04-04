/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANILIST_URL?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_BASE_PATH?: string
  readonly VITE_DEFAULT_TEMPLATE_ID?: string
  readonly VITE_EXPORT_CATEGORIES_PER_ROW?: string
  readonly VITE_EXPORT_IMAGE_WIDTH?: string
  readonly VITE_EXPORT_WATERMARK?: string
  readonly VITE_REPOSITORY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
