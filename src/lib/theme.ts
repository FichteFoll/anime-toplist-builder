import type { ThemePreference } from '@/types'

export enum ResolvedTheme {
  Light = 'light',
  Dark = 'dark',
}

export const resolveThemePreference = (
  preference: ThemePreference,
  systemTheme: ResolvedTheme,
): ResolvedTheme => (preference === 'system' ? systemTheme : (preference as ResolvedTheme))
