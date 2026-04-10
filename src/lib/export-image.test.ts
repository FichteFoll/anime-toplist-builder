import { describe, expect, it } from 'vitest'

import { countWrappedTextLines } from '@/lib/export-image'
import { createSongSelection, resolveSongTitle } from '@/lib/song-selection'
import { AnimeTitleLanguage, ThemeType } from '@/types'

const createContext = (measureWidth: (text: string) => number) =>
  ({
    measureText: (text: string) => ({ width: measureWidth(text) }),
  }) as CanvasRenderingContext2D

describe('countWrappedTextLines', () => {
  it('counts a single fitting line', () => {
    const context = createContext((text) => text.length * 10)

    expect(countWrappedTextLines(context, 'Short title', 200, 2)).toBe(1)
  })

  it('counts wrapped lines', () => {
    const context = createContext((text) => text.length * 10)

    expect(countWrappedTextLines(context, 'One two three four', 130, 3)).toBe(2)
  })

  it('caps the count at the max line limit', () => {
    const context = createContext((text) => text.length * 10)

    expect(countWrappedTextLines(context, 'One two three four five six', 70, 2)).toBe(2)
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
