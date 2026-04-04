const parsePositiveInteger = (value: string | undefined, fallback: number) => {
  const parsedValue = Number.parseInt(value ?? '', 10)

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback
}

export const appConfig = {
  appName: import.meta.env.VITE_APP_NAME?.trim() || 'Anime Toplist',
  repositoryUrl:
    import.meta.env.VITE_REPOSITORY_URL?.trim() || 'https://github.com/fichte/anime-toplist',
  anilistUrl: import.meta.env.VITE_ANILIST_URL?.trim() || 'https://anilist.co',
  defaultTemplateId: import.meta.env.VITE_DEFAULT_TEMPLATE_ID?.trim() || '',
  defaultTheme: 'system' as const,
  exportImageWidth: parsePositiveInteger(import.meta.env.VITE_EXPORT_IMAGE_WIDTH, 1400),
  exportCategoriesPerRow: parsePositiveInteger(
    import.meta.env.VITE_EXPORT_CATEGORIES_PER_ROW,
    4,
  ),
  exportFontSizeTemplateTitle: parsePositiveInteger(
    import.meta.env.VITE_EXPORT_FONT_SIZE_TEMPLATE_TITLE,
    44,
  ),
  exportFontSizeHeaderMeta: parsePositiveInteger(
    import.meta.env.VITE_EXPORT_FONT_SIZE_HEADER_META,
    22,
  ),
  exportFontSizeCategoryTitle: parsePositiveInteger(
    import.meta.env.VITE_EXPORT_FONT_SIZE_CATEGORY_TITLE,
    24,
  ),
  exportFontSizeBody: parsePositiveInteger(import.meta.env.VITE_EXPORT_FONT_SIZE_BODY, 18),
  exportFontSizeMeta: parsePositiveInteger(import.meta.env.VITE_EXPORT_FONT_SIZE_META, 16),
  exportWatermark:
    import.meta.env.VITE_EXPORT_WATERMARK?.trim() || 'Generated with Anime Toplist',
  baseUrl: import.meta.env.BASE_URL,
}
