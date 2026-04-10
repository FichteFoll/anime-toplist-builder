export enum AnimeTitleLanguage {
  Romaji = 'romaji',
  English = 'english',
  Native = 'native',
}

export const animeTitleLanguages = [AnimeTitleLanguage.Romaji, AnimeTitleLanguage.English, AnimeTitleLanguage.Native] as const

export const defaultAnimeTitleLanguage: AnimeTitleLanguage = AnimeTitleLanguage.English

export enum ThemePreference {
  System = 'system',
  Light = 'light',
  Dark = 'dark',
}

export const themePreferences = [ThemePreference.System, ThemePreference.Light, ThemePreference.Dark] as const

export const defaultThemePreference: ThemePreference = ThemePreference.System

export enum ExportImageLayout {
  Portrait = 'portrait',
  Landscape = 'landscape',
}

export const exportImageLayouts = [ExportImageLayout.Portrait, ExportImageLayout.Landscape] as const
