import { resolveAnimeTitle } from '@/lib/anime-title'
import {
  exportFont,
  FONT_SIZE_BODY,
  FONT_SIZE_CATEGORY_TITLE,
  FONT_SIZE_META,
} from '@/lib/export-fonts'
import { countTextLines, layoutTextLines, measureAdvanceWidth, truncateToWidth } from '@/lib/export-text'
import { formatSongEpisodesHint, resolveSongTitle } from '@/lib/song-selection'
import type { AnimeFormat, AnimeTitleLanguage, CategorySelection } from '@/types'

export const MAX_CATEGORY_TITLE_LINES = 6
/** Distance from the card's text top edge to the first alphabetic baseline. */
export const CARD_TEXT_TOP_OFFSET = 22

const CATEGORY_LINE_HEIGHT = Math.round(FONT_SIZE_CATEGORY_TITLE * 1.15)
const TITLE_LINE_HEIGHT = Math.round(FONT_SIZE_BODY * 1.28)
const META_LINE_HEIGHT = Math.round(FONT_SIZE_META * 1.3)

const CATEGORY_FONT = exportFont(500, FONT_SIZE_CATEGORY_TITLE, 'italic')
const TITLE_FONT = exportFont(700, FONT_SIZE_BODY)
const META_FONT = exportFont(500, FONT_SIZE_META)

// The category name is already drawn at its natural line count, so it ranks
// behind every block that can still grow.
const CATEGORY_GROWTH_RANK = 3

export type CardTextTone = 'primary' | 'muted'

export interface CardTextBlock {
  /** Stable key, for tests and debugging. */
  key: string
  font: string
  lineHeight: number
  tone: CardTextTone
  /** Lines this block's text needs when nothing constrains it. */
  naturalLines: number
  /** Lines the block is guaranteed; capped by `naturalLines` during allocation. */
  minLines: number
  /** Ascending rank for spare space; lower ranks grow first. */
  growthRank: number
  /** Renders exactly the text to draw for `lineBudget` lines. */
  layout: (lineBudget: number) => Array<string>
}

export interface AllocatedCardTextBlock {
  key: string
  font: string
  lineHeight: number
  tone: CardTextTone
  lines: Array<string>
}

export interface CardTextInput {
  categoryName: string
  selection: CategorySelection | null
  titleLanguage: AnimeTitleLanguage
  maxWidth: number
}

const buildSongSourceParts = (slug: string, episodes: string | null, animeName: string) => {
  const episodesHint = formatSongEpisodesHint(episodes)
  const suffix = episodesHint ? `(${slug}, ${episodesHint})` : `(${slug})`

  return {
    suffix,
    fullLine: `from ${animeName} ${suffix}`,
  }
}

export const layoutSongSourceLines = (
  font: string,
  animeName: string,
  slug: string,
  episodes: string | null,
  maxWidth: number,
  lineBudget: number,
): Array<string> => {
  const { suffix, fullLine } = buildSongSourceParts(slug, episodes, animeName)

  if (measureAdvanceWidth(fullLine, font) <= maxWidth) {
    return [fullLine]
  }

  // The slug suffix identifies the song, so it always owns the last line.
  const nameLines = layoutTextLines(`from ${animeName}`, font, maxWidth, Math.max(1, lineBudget - 1))

  return [...nameLines, truncateToWidth(suffix, font, maxWidth)]
}

export const countSongSourceLines = (
  font: string,
  animeName: string,
  slug: string,
  episodes: string | null,
  maxWidth: number,
): number => {
  const { fullLine } = buildSongSourceParts(slug, episodes, animeName)

  if (measureAdvanceWidth(fullLine, font) <= maxWidth) {
    return 1
  }

  return 1 + countTextLines(`from ${animeName}`, font, maxWidth)
}

const buildTextBlock = (
  block: Omit<CardTextBlock, 'naturalLines' | 'layout'>,
  text: string,
  maxWidth: number,
): CardTextBlock => ({
  ...block,
  naturalLines: countTextLines(text, block.font, maxWidth),
  layout: (lineBudget) => layoutTextLines(text, block.font, maxWidth, lineBudget),
})

const buildCategoryBlock = (categoryName: string, maxWidth: number): CardTextBlock => {
  const naturalLines = Math.min(
    countTextLines(categoryName, CATEGORY_FONT, maxWidth),
    MAX_CATEGORY_TITLE_LINES,
  )

  return {
    key: 'category',
    font: CATEGORY_FONT,
    lineHeight: CATEGORY_LINE_HEIGHT,
    tone: 'primary',
    naturalLines,
    // The category name is always spelled out in full.
    minLines: naturalLines,
    growthRank: CATEGORY_GROWTH_RANK,
    layout: (lineBudget) => layoutTextLines(categoryName, CATEGORY_FONT, maxWidth, lineBudget),
  }
}

const buildSongBlocks = (
  selection: Extract<CategorySelection, { kind: 'song' }>,
  titleLanguage: AnimeTitleLanguage,
  maxWidth: number,
): Array<CardTextBlock> => {
  const animeName = resolveAnimeTitle(selection.animeTitle, titleLanguage)
  const episodes = selection.song.episodes ?? null

  const songTitle = buildTextBlock(
    {
      key: 'songTitle',
      font: TITLE_FONT,
      lineHeight: TITLE_LINE_HEIGHT,
      tone: 'primary',
      minLines: 1,
      growthRank: 0,
    },
    resolveSongTitle(selection.song, titleLanguage).primary,
    maxWidth,
  )

  const artist = buildTextBlock(
    {
      key: 'artist',
      font: META_FONT,
      lineHeight: META_LINE_HEIGHT,
      tone: 'muted',
      minLines: 1,
      growthRank: 2,
    },
    selection.song.artist.trim() ? `by ${selection.song.artist.trim()}` : '',
    maxWidth,
  )

  const songSource: CardTextBlock = {
    key: 'songSource',
    font: META_FONT,
    lineHeight: META_LINE_HEIGHT,
    tone: 'muted',
    naturalLines: countSongSourceLines(
      META_FONT,
      animeName,
      selection.song.slug,
      episodes,
      maxWidth,
    ),
    minLines: 2,
    growthRank: 1,
    layout: (lineBudget) =>
      layoutSongSourceLines(META_FONT, animeName, selection.song.slug, episodes, maxWidth, lineBudget),
  }

  return [songTitle, artist, songSource]
}

const buildAnimeBlocks = (
  selection: Extract<CategorySelection, { kind: 'anime' }>,
  titleLanguage: AnimeTitleLanguage,
  maxWidth: number,
): Array<CardTextBlock> => {
  const animeTitle = buildTextBlock(
    {
      key: 'animeTitle',
      font: TITLE_FONT,
      lineHeight: TITLE_LINE_HEIGHT,
      tone: 'primary',
      minLines: 1,
      growthRank: 0,
    },
    resolveAnimeTitle(selection.title, titleLanguage),
    maxWidth,
  )

  const animeMeta = buildTextBlock(
    {
      key: 'animeMeta',
      font: META_FONT,
      lineHeight: META_LINE_HEIGHT,
      tone: 'muted',
      minLines: 1,
      growthRank: 1,
    },
    [selection.seasonYear ?? null, selection.format ?? null]
      .filter((value): value is number | AnimeFormat => value !== null)
      .join(' • '),
    maxWidth,
  )

  return [animeTitle, animeMeta]
}

export const buildCardTextBlocks = ({
  categoryName,
  selection,
  titleLanguage,
  maxWidth,
}: CardTextInput): Array<CardTextBlock> => {
  const selectionBlocks =
    selection === null
      ? []
      : selection.kind === 'song'
        ? buildSongBlocks(selection, titleLanguage, maxWidth)
        : buildAnimeBlocks(selection, titleLanguage, maxWidth)

  return [buildCategoryBlock(categoryName, maxWidth), ...selectionBlocks]
    .filter((block) => block.naturalLines > 0)
}

/** Height the blocks consume at `lineCounts`, as a baseline-to-baseline cursor span. */
export const measureTextBlocksHeight = (
  blocks: Array<CardTextBlock>,
  lineCounts: Array<number>,
  blockGap: number,
): number => {
  const drawnBlocks = blocks.filter((_block, index) => (lineCounts[index] ?? 0) > 0).length

  if (drawnBlocks === 0) {
    return 0
  }

  const linesHeight = blocks.reduce(
    (total, block, index) => total + (lineCounts[index] ?? 0) * block.lineHeight,
    0,
  )

  return linesHeight + blockGap * (drawnBlocks - 1)
}

const resolveFloors = (blocks: Array<CardTextBlock>): Array<number> =>
  blocks.map((block) => Math.min(block.minLines, block.naturalLines))

/** Height the blocks need at their guaranteed minimums. */
export const measureRequiredTextHeight = (
  blocks: Array<CardTextBlock>,
  blockGap: number,
): number => measureTextBlocksHeight(blocks, resolveFloors(blocks), blockGap)

export const allocateCardTextBlocks = (
  blocks: Array<CardTextBlock>,
  availableHeight: number,
  blockGap: number,
): Array<AllocatedCardTextBlock> => {
  const lineCounts = resolveFloors(blocks)
  // A block that could not take another line is skipped for good, so that a
  // taller block never blocks a shorter one behind it from growing.
  const saturated = blocks.map(() => false)

  const nextCandidate = () => {
    let candidate = -1

    for (const [index, block] of blocks.entries()) {
      if (saturated[index] || lineCounts[index] >= block.naturalLines) {
        continue
      }

      if (candidate === -1 || block.growthRank < blocks[candidate].growthRank) {
        candidate = index
      }
    }

    return candidate
  }

  for (let index = nextCandidate(); index !== -1; index = nextCandidate()) {
    const grown = lineCounts.slice()

    grown[index] += 1

    if (measureTextBlocksHeight(blocks, grown, blockGap) <= availableHeight) {
      lineCounts[index] += 1
    } else {
      saturated[index] = true
    }
  }

  return blocks
    .map((block, index) => ({
      key: block.key,
      font: block.font,
      lineHeight: block.lineHeight,
      tone: block.tone,
      lines: block.layout(lineCounts[index]),
    }))
    .filter((block) => block.lines.length > 0)
}

/** One height per grid row: the tallest requirement in the row, never below `minHeight`. */
export const resolveRowHeights = (
  requiredCardHeights: Array<number>,
  columns: number,
  minHeight: number,
): Array<number> => {
  const rowHeights: Array<number> = []

  for (let start = 0; start < requiredCardHeights.length; start += columns) {
    rowHeights.push(Math.max(minHeight, ...requiredCardHeights.slice(start, start + columns)))
  }

  return rowHeights
}
