import { describe, expect, it } from 'vitest'

import {
  createAnimeSelection,
  createSongSelection,
  formatSongEpisodesHint,
  getSelectionInsetImages,
  getSelectionPrimaryImage,
} from '@/lib/song-selection'
import { createCharacterSelection, createVoiceActorSelection } from '@/lib/relation-selection'
import { AnimeFormat, AnimeSeason, CharacterRole, ThemeType } from '@/types'

const animeTitle = {
  userPreferred: 'Re:Zero kara Hajimeru Isekai Seikatsu',
  romaji: 'Re:Zero kara Hajimeru Isekai Seikatsu',
  english: null,
  native: null,
}

const animeCoverImage = {
  large: 'https://img.example/rezero-large.jpg',
  medium: null,
  extraLarge: 'https://img.example/rezero-xl.jpg',
  color: '#475569',
}

const animeSelection = createAnimeSelection({
  mediaId: 42,
  title: animeTitle,
  coverImage: animeCoverImage,
  season: AnimeSeason.Spring,
  seasonYear: 2016,
  format: AnimeFormat.Tv,
})

const songSelection = createSongSelection({
  animeId: 42,
  animeTitle,
  animeCoverImage,
  song: {
    id: 101,
    type: ThemeType.OP,
    slug: 'op1',
    title: 'Redo',
    artist: 'Konomi Suzuki',
  },
})

const characterSelection = createCharacterSelection({
  characterId: 7,
  characterName: 'Rem',
  characterImage: { large: 'https://img.example/rem-large.jpg', medium: null },
  role: CharacterRole.Main,
  animeId: 42,
  animeTitle,
  animeCoverImage,
})

const voiceActorSelection = createVoiceActorSelection({
  voiceActorId: 9,
  voiceActorName: 'Rie Murakawa',
  voiceActorImage: { large: 'https://img.example/murakawa-large.jpg', medium: null },
  language: 'Japanese',
  characterId: 7,
  characterName: 'Rem',
  characterImage: { large: 'https://img.example/rem-large.jpg', medium: null },
  role: CharacterRole.Main,
  animeId: 42,
  animeTitle,
  animeCoverImage,
})

describe('formatSongEpisodesHint', () => {
  it('formats a single episode as ep', () => {
    expect(formatSongEpisodesHint('1')).toBe('ep 1')
  })

  it('formats episode ranges and lists as eps', () => {
    expect(formatSongEpisodesHint('1-2, 12')).toBe('eps 1-2, 12')
  })
})

describe('getSelectionPrimaryImage', () => {
  it('returns the cover image of an anime selection', () => {
    expect(getSelectionPrimaryImage(animeSelection)).toEqual(animeSelection.coverImage)
  })

  it('returns the anime cover image of a song selection', () => {
    expect(getSelectionPrimaryImage(songSelection)).toEqual(songSelection.animeCoverImage)
  })

  it('returns the character image of a character selection', () => {
    expect(getSelectionPrimaryImage(characterSelection)).toEqual(characterSelection.characterImage)
  })

  it('returns the voice actor image of a voice-actor selection', () => {
    expect(getSelectionPrimaryImage(voiceActorSelection)).toEqual(voiceActorSelection.voiceActorImage)
  })
})

describe('getSelectionInsetImages', () => {
  it('returns no insets for an anime selection', () => {
    expect(getSelectionInsetImages(animeSelection)).toEqual([])
  })

  it('returns no insets for a song selection', () => {
    expect(getSelectionInsetImages(songSelection)).toEqual([])
  })

  it('returns the anime cover as the only inset of a character selection', () => {
    expect(getSelectionInsetImages(characterSelection)).toEqual([characterSelection.animeCoverImage])
  })

  it('returns the character above the anime cover for a voice-actor selection', () => {
    expect(getSelectionInsetImages(voiceActorSelection)).toEqual([
      voiceActorSelection.characterImage,
      voiceActorSelection.animeCoverImage,
    ])
  })
})
