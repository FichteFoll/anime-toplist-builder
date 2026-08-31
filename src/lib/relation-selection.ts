import {
  AnimeTitleLanguage,
  type AnimeCoverImage,
  type AnimeTitle,
  type CharacterFilterState,
  type CharacterRole,
  type CharacterSelection,
  type RelationImage,
  type VoiceActorFilterState,
  type VoiceActorSelection,
} from '@/types'

import { resolveAnimeTitle } from '@/lib/anime-title'
import { formatCharacterRoleLabel } from '@/lib/format-label'

interface RelationName {
  name: string
  nativeName?: string | null
}

const normalizeText = (value: string | null | undefined) => {
  const normalizedValue = value?.trim()

  return normalizedValue ? normalizedValue : null
}

// AniList character and staff images expose only `large` and `medium`,
// so a relation image never carries `extraLarge` or `color`.
const normalizeRelationImage = (image: RelationImage): RelationImage => ({
  large: image.large,
  medium: image.medium ?? null,
})

export const createEmptyCharacterFilterState = (): CharacterFilterState => ({
  roles: [],
})

export const createEmptyVoiceActorFilterState = (): VoiceActorFilterState => ({
  languages: [],
})

export const createCharacterSelection = ({
  characterId,
  characterName,
  characterNativeName,
  characterImage,
  role,
  animeId,
  animeTitle,
  animeCoverImage,
}: {
  characterId: number
  characterName: string
  characterNativeName?: string | null
  characterImage: RelationImage
  role?: CharacterRole | null
  animeId: number
  animeTitle: AnimeTitle
  animeCoverImage: AnimeCoverImage
}): CharacterSelection => ({
  kind: 'character',
  characterId,
  characterName,
  characterNativeName: characterNativeName ?? null,
  characterImage: normalizeRelationImage(characterImage),
  role: role ?? null,
  animeId,
  animeTitle,
  animeCoverImage,
})

export const createVoiceActorSelection = ({
  voiceActorId,
  voiceActorName,
  voiceActorNativeName,
  voiceActorImage,
  language,
  characterId,
  characterName,
  characterNativeName,
  characterImage,
  role,
  animeId,
  animeTitle,
  animeCoverImage,
}: {
  voiceActorId: number
  voiceActorName: string
  voiceActorNativeName?: string | null
  voiceActorImage: RelationImage
  language?: string | null
  characterId: number
  characterName: string
  characterNativeName?: string | null
  characterImage: RelationImage
  role?: CharacterRole | null
  animeId: number
  animeTitle: AnimeTitle
  animeCoverImage: AnimeCoverImage
}): VoiceActorSelection => ({
  kind: 'voice-actor',
  voiceActorId,
  voiceActorName,
  voiceActorNativeName: voiceActorNativeName ?? null,
  voiceActorImage: normalizeRelationImage(voiceActorImage),
  language: language ?? null,
  characterId,
  characterName,
  characterNativeName: characterNativeName ?? null,
  characterImage: normalizeRelationImage(characterImage),
  role: role ?? null,
  animeId,
  animeTitle,
  animeCoverImage,
})

export const resolveRelationName = (
  { name, nativeName }: RelationName,
  titleLanguage: AnimeTitleLanguage,
) => {
  const defaultName = normalizeText(name)
  const resolvedNativeName = normalizeText(nativeName)

  if (titleLanguage === AnimeTitleLanguage.Native) {
    return resolvedNativeName
      ? {
          primary: resolvedNativeName,
          tooltip: defaultName && defaultName !== resolvedNativeName ? defaultName : null,
        }
      : {
          primary: defaultName ?? 'N/A',
          tooltip: null,
        }
  }

  return defaultName
    ? {
        primary: defaultName,
        tooltip: resolvedNativeName && resolvedNativeName !== defaultName ? resolvedNativeName : null,
      }
    : {
        primary: resolvedNativeName ?? 'N/A',
        tooltip: null,
      }
}

export const getCharacterRelationLabel = (
  selection: CharacterSelection,
  titleLanguage: AnimeTitleLanguage,
) => {
  const animeName = resolveAnimeTitle(selection.animeTitle, titleLanguage)

  if (!selection.role) {
    return `Character in ${animeName}`
  }

  return `${formatCharacterRoleLabel(selection.role)} character in ${animeName}`
}

export const getVoiceActorRelationLabel = (
  selection: VoiceActorSelection,
  titleLanguage: AnimeTitleLanguage,
) => {
  const characterName = resolveRelationName(
    { name: selection.characterName, nativeName: selection.characterNativeName },
    titleLanguage,
  ).primary

  return `Voiced ${characterName} in ${resolveAnimeTitle(selection.animeTitle, titleLanguage)}`
}
