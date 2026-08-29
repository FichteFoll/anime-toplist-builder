import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  allocateCardTextBlocks,
  buildCardTextBlocks,
  countSongSourceLines,
  layoutSongSourceLines,
  MAX_CATEGORY_TITLE_LINES,
  measureRequiredTextHeight,
  measureTextBlocksHeight,
  resolveRowHeights,
  type AllocatedCardTextBlock,
  type CardTextBlock,
} from '@/lib/export-card-layout'
import { installStubTextMeasurement, resetStubTextMeasurement } from '@/lib/export-text.test-support'
import { createSongSelection } from '@/lib/song-selection'
import { AnimeFormat, AnimeTitleLanguage, ThemeType, type AnimeSelection } from '@/types'

// The stub measures 10px per character, so widths below are character counts.
const font = 'normal 500 16px sans-serif'
const blockGap = 4
const titleLanguage = AnimeTitleLanguage.Romaji

const coverImage = {
  large: 'https://img.example/test.jpg',
  medium: null,
  extraLarge: null,
  color: null,
}

const createSong = ({
  title,
  artist,
  animeName,
  slug = 'OP1',
  episodes = null,
}: {
  title: string
  artist: string
  animeName: string
  slug?: string
  episodes?: string | null
}) =>
  createSongSelection({
    animeId: 1,
    animeTitle: { userPreferred: animeName, romaji: animeName, english: null, native: null },
    animeCoverImage: coverImage,
    song: { id: 1, type: ThemeType.OP, slug, title, titleNative: null, artist, episodes },
  })

const createAnime = (title: string): AnimeSelection => ({
  kind: 'anime',
  mediaId: 1,
  title: { userPreferred: title, romaji: title, english: null, native: null },
  coverImage,
  seasonYear: 2019,
  format: AnimeFormat.Tv,
})

const lineCountByKey = (allocated: Array<AllocatedCardTextBlock>) =>
  Object.fromEntries(allocated.map((block) => [block.key, block.lines.length]))

const measureAllocatedHeight = (
  blocks: Array<CardTextBlock>,
  allocated: Array<AllocatedCardTextBlock>,
) =>
  measureTextBlocksHeight(
    blocks,
    blocks.map((block) => allocated.find((entry) => entry.key === block.key)?.lines.length ?? 0),
    blockGap,
  )

const songBlocks = () =>
  buildCardTextBlocks({
    categoryName: 'Openings',
    selection: createSong({
      title: 'Alpha Beta Gamma Delta Epsilon Zeta Eta Theta',
      artist: 'Some Artist Name Here Extra',
      animeName: 'Long Anime Title Words',
    }),
    titleLanguage,
    maxWidth: 200,
  })

const animeBlocks = () =>
  buildCardTextBlocks({
    categoryName: 'Top',
    selection: createAnime('Bocchi The Rock'),
    titleLanguage,
    maxWidth: 60,
  })

beforeAll(() => {
  installStubTextMeasurement()
})

afterEach(() => {
  resetStubTextMeasurement()
})

describe('buildCardTextBlocks', () => {
  it('returns the song blocks in draw order', () => {
    expect(songBlocks().map((block) => block.key)).toEqual([
      'category',
      'songTitle',
      'artist',
      'songSource',
    ])
  })

  it('drops the artist block when the song has no artist', () => {
    const blocks = buildCardTextBlocks({
      categoryName: 'Openings',
      selection: createSong({ title: 'A Song', artist: '   ', animeName: 'An Anime' }),
      titleLanguage,
      maxWidth: 200,
    })

    expect(blocks.map((block) => block.key)).toEqual(['category', 'songTitle', 'songSource'])
  })

  it('returns only the category block without a selection', () => {
    const blocks = buildCardTextBlocks({
      categoryName: 'Openings',
      selection: null,
      titleLanguage,
      maxWidth: 200,
    })

    expect(blocks.map((block) => block.key)).toEqual(['category'])
  })

  it('caps the category name at the maximum line count and ellipsizes it', () => {
    const blocks = buildCardTextBlocks({
      categoryName: 'One two three four five six seven eight nine ten eleven twelve',
      selection: null,
      titleLanguage,
      maxWidth: 100,
    })
    const [category] = allocateCardTextBlocks(blocks, 1000, blockGap)

    expect(category.lines).toHaveLength(MAX_CATEGORY_TITLE_LINES)
    expect(category.lines[MAX_CATEGORY_TITLE_LINES - 1]).toMatch(/\.\.\.$/)
  })
})

describe('allocateCardTextBlocks', () => {
  it('gives every block its natural line count when the card has plenty of room', () => {
    const blocks = songBlocks()

    expect(lineCountByKey(allocateCardTextBlocks(blocks, 1000, blockGap))).toEqual({
      category: 1,
      songTitle: 3,
      artist: 2,
      songSource: 3,
    })
  })

  it('keeps every block at its minimum in a tight card', () => {
    const blocks = songBlocks()
    const requiredHeight = measureRequiredTextHeight(blocks, blockGap)

    expect(requiredHeight).toBe(121)
    expect(lineCountByKey(allocateCardTextBlocks(blocks, requiredHeight, blockGap))).toEqual({
      category: 1,
      songTitle: 1,
      artist: 1,
      songSource: 2,
    })
  })

  it('keeps a multi-line category name in full in a tight card', () => {
    const blocks = buildCardTextBlocks({
      categoryName: 'Best opening songs from a long running mecha series',
      selection: createSong({
        title: 'Alpha Beta Gamma Delta Epsilon Zeta Eta Theta',
        artist: 'Some Artist Name Here Extra',
        animeName: 'Long Anime Title Words',
      }),
      titleLanguage,
      maxWidth: 200,
    })
    const categoryLines = blocks.find((block) => block.key === 'category')?.naturalLines
    const requiredHeight = measureRequiredTextHeight(blocks, blockGap)

    expect(categoryLines).toBeGreaterThan(1)
    expect(lineCountByKey(allocateCardTextBlocks(blocks, requiredHeight, blockGap))).toEqual({
      category: categoryLines,
      songTitle: 1,
      artist: 1,
      songSource: 2,
    })
  })

  it('grows the song title before the song source block', () => {
    const blocks = songBlocks()

    expect(lineCountByKey(allocateCardTextBlocks(blocks, 167, blockGap))).toEqual({
      category: 1,
      songTitle: 3,
      artist: 1,
      songSource: 2,
    })
  })

  it('grows the song source block before the artist', () => {
    const blocks = songBlocks()

    expect(lineCountByKey(allocateCardTextBlocks(blocks, 188, blockGap))).toEqual({
      category: 1,
      songTitle: 3,
      artist: 1,
      songSource: 3,
    })
  })

  it('keeps a one-line song source block at one line despite its two-line minimum', () => {
    const blocks = buildCardTextBlocks({
      categoryName: 'Openings',
      selection: createSong({
        title: 'A Song',
        artist: 'An Artist',
        animeName: 'Cowboy Bebop',
        episodes: '1-25',
      }),
      titleLanguage,
      maxWidth: 400,
    })

    expect(lineCountByKey(allocateCardTextBlocks(blocks, 1000, blockGap)).songSource).toBe(1)
  })

  it('grows the anime title before the anime meta line', () => {
    const blocks = animeBlocks()

    expect(measureRequiredTextHeight(blocks, blockGap)).toBe(75)
    expect(lineCountByKey(allocateCardTextBlocks(blocks, 75, blockGap))).toEqual({
      category: 1,
      animeTitle: 1,
      animeMeta: 1,
    })
    expect(lineCountByKey(allocateCardTextBlocks(blocks, 121, blockGap))).toEqual({
      category: 1,
      animeTitle: 3,
      animeMeta: 1,
    })
    expect(lineCountByKey(allocateCardTextBlocks(blocks, 142, blockGap))).toEqual({
      category: 1,
      animeTitle: 3,
      animeMeta: 2,
    })
  })

  it('never exceeds the available height once the minimums fit', () => {
    const blocks = songBlocks()

    for (let availableHeight = 121; availableHeight <= 260; availableHeight += 1) {
      const allocated = allocateCardTextBlocks(blocks, availableHeight, blockGap)

      expect(measureAllocatedHeight(blocks, allocated)).toBeLessThanOrEqual(availableHeight)
    }
  })
})

describe('layoutSongSourceLines', () => {
  it('splits long song source info across two lines', () => {
    expect(layoutSongSourceLines(font, 'Eyeshield 21', 'ED6', '117-126', 220, 2)).toEqual([
      'from Eyeshield 21',
      '(ED6, eps 117-126)',
    ])
  })

  it('keeps short song source info on one line', () => {
    expect(layoutSongSourceLines(font, 'Cowboy Bebop', 'OP1', '1-25', 360, 2)).toEqual([
      'from Cowboy Bebop (OP1, eps 1-25)',
    ])
  })

  it('truncates only the anime name and keeps the full slug suffix', () => {
    expect(
      layoutSongSourceLines(font, 'A Very Long Anime Name That Never Ends', 'OP1', '1-25', 220, 2),
    ).toEqual(['from A Very Long An...', '(OP1, eps 1-25)'])
  })

  it('spreads a long anime name over the extra lines it is given', () => {
    expect(
      layoutSongSourceLines(font, 'A Very Long Anime Name That Never Ends', 'OP1', '1-25', 220, 3),
    ).toEqual(['from A Very Long Anime', 'Name That Never Ends', '(OP1, eps 1-25)'])
  })
})

describe('countSongSourceLines', () => {
  it('counts a fitting source block as one line', () => {
    expect(countSongSourceLines(font, 'Cowboy Bebop', 'OP1', '1-25', 360)).toBe(1)
  })

  it('counts the wrapped anime name plus the suffix line', () => {
    expect(countSongSourceLines(font, 'A Very Long Anime Name That Never Ends', 'OP1', '1-25', 220))
      .toBe(3)
  })
})

describe('resolveRowHeights', () => {
  it('returns the tallest requirement per row, never below the minimum', () => {
    expect(resolveRowHeights([100, 300, 150, 90], 2, 200)).toEqual([300, 200])
  })

  it('returns no rows for an empty input', () => {
    expect(resolveRowHeights([], 3, 200)).toEqual([])
  })
})
