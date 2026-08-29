import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { resolveRowHeights } from '@/lib/export-card-layout'
import { GRID_GAP, resolveGridRowOffsets } from '@/lib/export-image'
import { installStubTextMeasurement, resetStubTextMeasurement } from '@/lib/export-text.test-support'
import { createSongSelection, resolveSongTitle } from '@/lib/song-selection'
import { AnimeTitleLanguage, ThemeType } from '@/types'

beforeAll(() => {
  installStubTextMeasurement()
})

afterEach(() => {
  resetStubTextMeasurement()
})

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
