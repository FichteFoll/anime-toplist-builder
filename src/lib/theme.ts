import { ThemePreference } from '@/types'

export enum ResolvedTheme {
  Light = 'light',
  Dark = 'dark',
}

export const resolveThemePreference = (
  preference: ThemePreference,
  systemTheme: ResolvedTheme,
): ResolvedTheme =>
  preference === ThemePreference.System
    ? systemTheme
    : preference === ThemePreference.Dark
      ? ResolvedTheme.Dark
      : ResolvedTheme.Light
