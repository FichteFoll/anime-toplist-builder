import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { formatSongSourceMetaLines } from '@/lib/export-image'
import { installStubTextMeasurement, resetStubTextMeasurement } from '@/lib/export-text.test-support'
import { createSongSelection, resolveSongTitle } from '@/lib/song-selection'
import { AnimeTitleLanguage, ThemeType } from '@/types'

// The stub measures 10px per character, so widths below are character counts.
const font = 'normal 500 16px sans-serif'

beforeAll(() => {
  installStubTextMeasurement()
})

afterEach(() => {
  resetStubTextMeasurement()
})

describe('formatSongSourceMetaLines', () => {
  it('splits long song source info across two lines', () => {
    expect(formatSongSourceMetaLines(font, 'Eyeshield 21', 'ED6', '117-126', 220)).toEqual([
      'from Eyeshield 21',
      '(ED6, eps 117-126)',
    ])
  })

  it('keeps short song source info on one line', () => {
    expect(formatSongSourceMetaLines(font, 'Cowboy Bebop', 'OP1', '1-25', 360)).toEqual([
      'from Cowboy Bebop (OP1, eps 1-25)',
    ])
  })

  it('truncates only the anime name and keeps the full slug suffix', () => {
    expect(
      formatSongSourceMetaLines(font, 'A Very Long Anime Name That Never Ends', 'OP1', '1-25', 220),
    ).toEqual(['from A Very Long An...', '(OP1, eps 1-25)'])
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
