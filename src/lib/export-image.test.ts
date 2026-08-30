import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  buildCardTextBlocks,
  CARD_TEXT_TOP_OFFSET,
  measureRequiredTextHeight,
  resolveRowHeights,
} from '@/lib/export-card-layout'
import {
  CARD_PADDING,
  CARD_TEXT_GAP,
  CARD_WIDTH,
  COVER_HEIGHT,
  COVER_WIDTH,
  GRID_GAP,
  INSET_HEIGHT,
  INSET_WIDTH,
  resolveGridRowOffsets,
  resolveInsetRects,
} from '@/lib/export-image'
import { installStubTextMeasurement, resetStubTextMeasurement } from '@/lib/export-text.test-support'
import { createVoiceActorSelection } from '@/lib/relation-selection'
import { createAnimeSelection, createSongSelection, resolveSongTitle } from '@/lib/song-selection'
import {
  AnimeFormat,
  AnimeSeason,
  AnimeTitleLanguage,
  CharacterRole,
  ThemeType,
  type CategorySelection,
} from '@/types'

describe('resolveGridRowOffsets', () => {
  it('stacks rows on the cumulative height of the rows above them', () => {
    const rowHeights = resolveRowHeights([223, 300, 223, 260], 2, 223)

    expect(rowHeights).toEqual([300, 260])
    expect(resolveGridRowOffsets(rowHeights, GRID_GAP)).toEqual({
      offsets: [0, 300 + GRID_GAP],
      height: 300 + GRID_GAP + 260,
    })
  })

  it('reports no height for an empty grid', () => {
    expect(resolveGridRowOffsets([], GRID_GAP)).toEqual({ offsets: [], height: 0 })
  })
})

describe('song title helpers', () => {
  it('swaps primary and tooltip text in native mode', () => {
    const songSelection = createSongSelection({
      animeId: 1,
      animeTitle: {
        userPreferred: 'Test Anime',
        romaji: 'Test Anime',
        english: null,
        native: null,
      },
      animeCoverImage: {
        large: 'https://img.example/test.jpg',
        medium: null,
        extraLarge: null,
        color: null,
      },
      song: {
        id: 101,
        type: ThemeType.OP,
        slug: 'op1',
        title: 'My Song',
        titleNative: '私の歌',
        artist: 'Artist',
      },
    })

    expect(resolveSongTitle(songSelection.song, AnimeTitleLanguage.Native)).toEqual({
      primary: '私の歌',
      tooltip: 'My Song',
    })
  })
})

describe('resolveInsetRects', () => {
  const coverX = 76
  const coverY = 120
  const insetRects = (count: number) =>
    resolveInsetRects(coverX, coverY, COVER_WIDTH, COVER_HEIGHT, count)

  it('places a single inset in the lower right of the image slot', () => {
    expect(insetRects(1)).toEqual([
      { x: coverX + 64, y: coverY + 97, width: INSET_WIDTH, height: INSET_HEIGHT },
    ])
  })

  it('stacks two insets top-to-bottom above the lower right corner', () => {
    expect(insetRects(2)).toEqual([
      { x: coverX + 64, y: coverY + 13, width: INSET_WIDTH, height: INSET_HEIGHT },
      { x: coverX + 64, y: coverY + 97, width: INSET_WIDTH, height: INSET_HEIGHT },
    ])
  })

  it('keeps every inset fully inside the image slot', () => {
    for (const count of [1, 2]) {
      for (const rect of insetRects(count)) {
        expect(rect.x).toBeGreaterThanOrEqual(coverX)
        expect(rect.y).toBeGreaterThanOrEqual(coverY)
        expect(rect.x + rect.width).toBeLessThanOrEqual(coverX + COVER_WIDTH)
        expect(rect.y + rect.height).toBeLessThanOrEqual(coverY + COVER_HEIGHT)
      }
    }
  })

  it('returns no rects for a selection without insets', () => {
    expect(insetRects(0)).toEqual([])
  })
})

describe('row heights with insets', () => {
  // The production formula in `renderTemplatePng`, kept in one place here.
  const cardTextWidth = CARD_WIDTH - (CARD_PADDING + COVER_WIDTH + 14) - CARD_PADDING
  const minCardHeight = COVER_HEIGHT + CARD_PADDING * 2

  const requiredCardHeight = (categoryName: string, selection: CategorySelection) =>
    CARD_PADDING * 2
    + CARD_TEXT_TOP_OFFSET
    + measureRequiredTextHeight(
      buildCardTextBlocks({
        categoryName,
        selection,
        titleLanguage: AnimeTitleLanguage.Romaji,
        maxWidth: cardTextWidth,
      }),
      CARD_TEXT_GAP,
    )

  beforeAll(() => {
    installStubTextMeasurement()
  })

  afterEach(() => {
    resetStubTextMeasurement()
  })

  it('keeps a voice-actor card beside an anime card at the minimum row height', () => {
    const animeTitle = {
      userPreferred: 'Re:Zero',
      romaji: 'Re:Zero',
      english: null,
      native: null,
    }
    const animeCoverImage = {
      large: 'https://img.example/re-zero.jpg',
      medium: null,
      extraLarge: null,
      color: null,
    }

    const voiceActorCard = requiredCardHeight(
      'Best Voice Artist',
      createVoiceActorSelection({
        voiceActorId: 1,
        voiceActorName: 'Rie Takahashi',
        voiceActorImage: { large: 'https://img.example/rie.jpg', medium: null },
        language: 'Japanese',
        characterId: 2,
        characterName: 'Rem',
        characterImage: { large: 'https://img.example/rem.jpg', medium: null },
        role: CharacterRole.Main,
        animeId: 3,
        animeTitle,
        animeCoverImage,
      }),
    )
    const animeCard = requiredCardHeight(
      'Best Anime',
      createAnimeSelection({
        mediaId: 3,
        title: animeTitle,
        coverImage: animeCoverImage,
        season: AnimeSeason.Spring,
        seasonYear: 2016,
        format: AnimeFormat.Tv,
      }),
    )

    // Two insets are drawn inside the cover slot, so they add no height at all.
    expect(resolveRowHeights([voiceActorCard, animeCard], 2, minCardHeight)).toEqual([223])
  })
})
