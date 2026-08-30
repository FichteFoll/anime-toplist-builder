import { describe, expect, it } from 'vitest'

import { resolveRowHeights } from '@/lib/export-card-layout'
import {
  COVER_HEIGHT,
  COVER_WIDTH,
  GRID_GAP,
  INSET_HEIGHT,
  INSET_WIDTH,
  resolveGridRowOffsets,
  resolveInsetRects,
} from '@/lib/export-image'
import { createSongSelection, resolveSongTitle } from '@/lib/song-selection'
import { AnimeTitleLanguage, ThemeType } from '@/types'

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
