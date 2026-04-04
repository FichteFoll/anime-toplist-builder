import type { ThemePreference } from '@/types'

export type ResolvedTheme = 'light' | 'dark'

export const resolveThemePreference = (
  preference: ThemePreference,
  systemTheme: ResolvedTheme,
): ResolvedTheme => (preference === 'system' ? systemTheme : preference)
