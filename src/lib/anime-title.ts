import { AnimeTitleLanguage, type AnimeTitle } from '@/types'

const normalizeTitle = (value: string | null | undefined) => {
  const trimmedValue = value?.trim()

  return trimmedValue ? trimmedValue : null
}

export const resolveAnimeTitle = (title: AnimeTitle, titleLanguage: AnimeTitleLanguage) => {
  const preferredTitle = (() => {
    switch (titleLanguage) {
      case AnimeTitleLanguage.Romaji:
        return title.romaji
      case AnimeTitleLanguage.English:
        return title.english
      case AnimeTitleLanguage.Native:
        return title.native
    }
  })()

  return [preferredTitle, title.userPreferred, title.english, title.romaji, title.native]
    .map(normalizeTitle)
    .find((value) => value !== null) ?? 'Untitled anime'
}
