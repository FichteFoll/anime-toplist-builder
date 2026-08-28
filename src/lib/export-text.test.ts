import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { layoutTextLines, measureAdvanceWidth, truncateToWidth } from '@/lib/export-text'
import { installStubTextMeasurement, resetStubTextMeasurement } from '@/lib/export-text.test-support'

const font = 'normal 400 16px sans-serif'

const splitGraphemes = (value: string): Array<string> =>
  Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value), (s) => s.segment)

const loneSurrogatePattern = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/

beforeAll(() => {
  installStubTextMeasurement()
})

afterEach(() => {
  resetStubTextMeasurement()
})

describe('layoutTextLines', () => {
  it('wraps on spaces and trims trailing whitespace', () => {
    expect(layoutTextLines('One two three four', font, 130, 3)).toEqual(['One two three', 'four'])
  })

  it('keeps a fitting text on one line', () => {
    expect(layoutTextLines('Short title', font, 200, 2)).toEqual(['Short title'])
  })

  it('truncates the last line when the text exceeds the line budget', () => {
    const lines = layoutTextLines('One two three four five six', font, 70, 2)

    expect(lines).toHaveLength(2)
    expect(lines[1]).toMatch(/\.\.\.$/)
  })

  it('returns no lines for empty or blank text', () => {
    expect(layoutTextLines('', font, 200, 2)).toEqual([])
    expect(layoutTextLines('   ', font, 200, 2)).toEqual([])
  })

  it('wraps space-free CJK text', () => {
    const lines = layoutTextLines('日本語のタイトルがここにあります', font, 100, 5)

    expect(lines.length).toBeGreaterThan(1)
  })

  it('breaks a single token wider than the line box', () => {
    const lines = layoutTextLines('Supercalifragilisticexpialidocious tail', font, 100, 5)

    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(10)
    }
  })

  it('never splits an emoji across lines', () => {
    const text = 'AAAAAAAAA🎌BBBBBBBBB'

    const lines = layoutTextLines(text, font, 100, 5)

    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) {
      expect(line).not.toMatch(loneSurrogatePattern)
    }
    expect(lines.filter((line) => line.includes('🎌'))).toHaveLength(1)
    // The source has no spaces, so a lossless wrap rejoins to the original.
    expect(lines.join('')).toBe(text)
  })

  it('keeps a single truncated line for a degenerate line budget', () => {
    for (const maxLines of [0, 1]) {
      const lines = layoutTextLines('One two three four five six', font, 70, maxLines)

      expect(lines).toHaveLength(1)
      expect(lines[0]).toMatch(/\.\.\.$/)
    }
  })
})

describe('truncateToWidth', () => {
  it('returns the input when it fits', () => {
    expect(truncateToWidth('Short title', font, 200)).toBe('Short title')
  })

  it('appends an ellipsis when the text does not fit', () => {
    const truncated = truncateToWidth('A much longer title than fits', font, 100)

    expect(truncated).toMatch(/\.\.\.$/)
    expect(measureAdvanceWidth(truncated, font)).toBeLessThanOrEqual(100)
  })

  it('never cuts inside an emoji grapheme', () => {
    for (let maxWidth = 40; maxWidth <= 120; maxWidth += 10) {
      expect(truncateToWidth('AAAA🎌BBBB', font, maxWidth)).not.toMatch(loneSurrogatePattern)
    }
  })

  // A lone-surrogate check is not enough here: these clusters are several whole
  // code points, so a code-point-wise cut mangles them without ever producing
  // an unpaired surrogate.
  it.each([
    ['a ZWJ sequence', 'AAAA👨‍👩‍👧BBBB'],
    ['a skin-tone modifier', 'AAAA👍🏽BBBB'],
    ['a regional indicator pair', 'AAAA🇯🇵BBBB'],
  ])('never cuts inside %s', (_label, text) => {
    const clusters = splitGraphemes(text)

    for (let maxWidth = 30; maxWidth <= 160; maxWidth += 10) {
      const result = truncateToWidth(text, font, maxWidth)
      const kept = splitGraphemes(result.endsWith('...') ? result.slice(0, -3) : result)

      expect(kept, `maxWidth ${maxWidth} produced ${JSON.stringify(result)}`)
        .toEqual(clusters.slice(0, kept.length))
    }
  })
})

describe('measureAdvanceWidth', () => {
  it('counts a trailing space, like fillText advances it', () => {
    expect(measureAdvanceWidth('Author: ', font)).toBe(80)
  })
})
