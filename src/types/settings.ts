export const animeTitleLanguages = ['romaji', 'english', 'native'] as const

export type AnimeTitleLanguage = (typeof animeTitleLanguages)[number]

export const defaultAnimeTitleLanguage: AnimeTitleLanguage = 'english'

export const themePreferences = ['system', 'light', 'dark'] as const

export type ThemePreference = (typeof themePreferences)[number]

export const defaultThemePreference: ThemePreference = 'system'

export const exportImageLayouts = ['portrait', 'landscape'] as const

export type ExportImageLayout = (typeof exportImageLayouts)[number]
