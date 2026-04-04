import type { AnimeTitleLanguage, AnimeTitle } from '@/types'

const normalizeTitle = (value: string | null | undefined) => {
  const trimmedValue = value?.trim()

  return trimmedValue ? trimmedValue : null
}

export const resolveAnimeTitle = (title: AnimeTitle, titleLanguage: AnimeTitleLanguage) => {
  const preferredTitle = (() => {
    switch (titleLanguage) {
      case 'romaji':
        return title.romaji
      case 'english':
        return title.english
      case 'native':
        return title.native
      case 'userPreferred':
        return title.userPreferred
    }
  })()

  return [preferredTitle, title.userPreferred, title.english, title.romaji, title.native]
    .map(normalizeTitle)
    .find((value) => value !== null) ?? 'Untitled anime'
}
