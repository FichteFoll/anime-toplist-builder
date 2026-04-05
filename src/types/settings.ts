export const animeTitleLanguages = ['romaji', 'english', 'native'] as const

export type AnimeTitleLanguage = (typeof animeTitleLanguages)[number]

export const themePreferences = ['system', 'light', 'dark'] as const

export type ThemePreference = (typeof themePreferences)[number]
