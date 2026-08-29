import { layoutWithLines, measureLineStats, measureNaturalWidth, prepareWithSegments } from '@chenglou/pretext'

const ellipsis = '...'

// `Array.from` iterates code points, which splits ZWJ sequences, skin-tone
// modifiers and flag pairs. Truncation has to cut on grapheme clusters, so it
// goes through `Intl.Segmenter`, which pretext already requires.
const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

const splitGraphemes = (text: string): Array<string> =>
  Array.from(graphemeSegmenter.segment(text), (segment) => segment.segment)

/**
 * Measures the advance width of `text`, including leading and trailing spaces.
 *
 * `whiteSpace: 'pre-wrap'` is required here: pretext's default `normal` mode
 * collapses surrounding whitespace and would report less than `fillText`
 * actually advances.
 */
export const measureAdvanceWidth = (text: string, font: string): number =>
  measureNaturalWidth(prepareWithSegments(text, font, { whiteSpace: 'pre-wrap' }))

/** Cuts `text` at a grapheme boundary and suffixes `...` when it does not fit. */
export const truncateToWidth = (text: string, font: string, maxWidth: number): string => {
  if (measureAdvanceWidth(text, font) <= maxWidth) {
    return text
  }

  const graphemes = splitGraphemes(text)
  let low = 0
  let high = graphemes.length

  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    const candidate = `${graphemes.slice(0, mid).join('').trimEnd()}${ellipsis}`

    if (measureAdvanceWidth(candidate, font) <= maxWidth) {
      low = mid
    } else {
      high = mid - 1
    }
  }

  if (low <= 0) {
    return ellipsis
  }

  return `${graphemes.slice(0, low).join('').trimEnd()}${ellipsis}`
}

/**
 * Wraps `text` into at most `maxLines` lines that fit `maxWidth`.
 *
 * The overflowing lines are folded into the last one and truncated, so that the
 * returned array is both the line count and the text to draw.
 */
export const layoutTextLines = (
  text: string,
  font: string,
  maxWidth: number,
  maxLines: number,
): Array<string> => {
  // The line height only feeds the unused `height` field of the result.
  const { lines } = layoutWithLines(prepareWithSegments(text, font), maxWidth, 1)
  const wrapped = lines.map((line) => line.text.trimEnd())

  // A budget below one line still leaves room for the single truncated line.
  const lineBudget = Math.max(1, maxLines)

  if (wrapped.length <= lineBudget) {
    return wrapped
  }

  const kept = wrapped.slice(0, lineBudget - 1)
  const rest = wrapped.slice(lineBudget - 1).join(' ')

  return [...kept, truncateToWidth(rest, font, maxWidth)]
}

/** Counts the lines `text` naturally needs at `maxWidth`, without materializing them. */
export const countTextLines = (text: string, font: string, maxWidth: number): number => {
  if (text.trim().length === 0) {
    return 0
  }

  // The preparation matches `layoutTextLines`, so the count agrees with the wrap.
  return measureLineStats(prepareWithSegments(text, font), maxWidth).lineCount
}
