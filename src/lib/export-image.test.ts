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
  INSET_RING,
  INSET_WIDTH,
  resolveGridRowOffsets,
  resolveInsetRects,
  resolvePrimaryRect,
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

const insetRectsFor = (count: number) =>
  resolveInsetRects(76, 120, COVER_WIDTH, COVER_HEIGHT, count)

describe('resolveInsetRects', () => {
  const coverX = 76
  const coverY = 120
  const insetRects = (count: number) =>
    resolveInsetRects(coverX, coverY, COVER_WIDTH, COVER_HEIGHT, count)

  it('places a single inset in the lower right of the image slot', () => {
    expect(insetRects(1)).toEqual([
      { x: coverX + 75, y: coverY + 110, width: INSET_WIDTH, height: INSET_HEIGHT },
    ])
  })

  it('lays two insets side by side on one baseline', () => {
    const [left, right] = insetRects(2)

    expect(insetRects(2)).toEqual([
      { x: coverX + 21, y: coverY + 110, width: INSET_WIDTH, height: INSET_HEIGHT },
      { x: coverX + 75, y: coverY + 110, width: INSET_WIDTH, height: INSET_HEIGHT },
    ])
    // Side by side, so they share a baseline and never overlap each other.
    expect(left.y).toBe(right.y)
    expect(left.x + left.width).toBeLessThan(right.x)
  })

  it('keeps every inset and its ring fully inside the image slot', () => {
    for (const count of [1, 2]) {
      for (const rect of insetRects(count)) {
        expect(rect.x - INSET_RING).toBeGreaterThanOrEqual(coverX)
        expect(rect.y - INSET_RING).toBeGreaterThanOrEqual(coverY)
        expect(rect.x + rect.width + INSET_RING).toBeLessThanOrEqual(coverX + COVER_WIDTH)
        expect(rect.y + rect.height + INSET_RING).toBeLessThanOrEqual(coverY + COVER_HEIGHT)
      }
    }
  })

  it('returns no rects for a selection without insets', () => {
    expect(insetRects(0)).toEqual([])
  })
})

describe('resolvePrimaryRect', () => {
  const coverX = 76
  const coverY = 120
  const primaryRect = (count: number) =>
    resolvePrimaryRect(coverX, coverY, COVER_WIDTH, COVER_HEIGHT, count)

  it('fills the image slot when the selection has no insets', () => {
    expect(primaryRect(0)).toEqual({
      x: coverX,
      y: coverY,
      width: COVER_WIDTH,
      height: COVER_HEIGHT,
    })
  })

  it('shrinks and keeps the cover aspect ratio once insets share the slot', () => {
    for (const [count, expected] of [[1, { width: 93, height: 135 }], [2, { width: 88, height: 128 }]] as const) {
      const rect = primaryRect(count)

      expect(rect).toEqual({ x: coverX, y: coverY, ...expected })
      expect(rect.width).toBeLessThan(COVER_WIDTH)
      expect(Math.abs(rect.width / rect.height - COVER_WIDTH / COVER_HEIGHT)).toBeLessThan(0.01)
    }
  })

  it('is overlapped by the inset column rather than containing it', () => {
    for (const count of [1, 2]) {
      const primary = primaryRect(count)

      for (const inset of insetRectsFor(count)) {
        // The inset reaches past the primary's outline, so it is neither
        // contained by it nor detached from it.
        expect(inset.y).toBeLessThan(primary.y + primary.height)
        expect(inset.y + inset.height).toBeGreaterThan(primary.y + primary.height)
      }
    }
  })

  it('spans exactly one cover slot together with the insets', () => {
    for (const count of [1, 2]) {
      const primary = primaryRect(count)
      const insets = insetRectsFor(count)
      const boxes = [
        primary,
        ...insets.map((rect) => ({
          x: rect.x - INSET_RING,
          y: rect.y - INSET_RING,
          width: rect.width + INSET_RING * 2,
          height: rect.height + INSET_RING * 2,
        })),
      ]

      // A relation card must occupy the same footprint as a lone anime cover,
      // so no card in the grid changes size.
      expect(Math.min(...boxes.map((box) => box.x))).toBe(coverX)
      expect(Math.min(...boxes.map((box) => box.y))).toBe(coverY)
      expect(Math.max(...boxes.map((box) => box.x + box.width))).toBe(coverX + COVER_WIDTH)
      expect(Math.max(...boxes.map((box) => box.y + box.height))).toBe(coverY + COVER_HEIGHT)
    }
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
