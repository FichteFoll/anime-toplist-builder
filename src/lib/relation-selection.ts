import type { CharacterFilterState, VoiceActorFilterState } from '@/types'

export const createEmptyCharacterFilterState = (): CharacterFilterState => ({
  roles: [],
})

export const createEmptyVoiceActorFilterState = (): VoiceActorFilterState => ({
  languages: [],
})
