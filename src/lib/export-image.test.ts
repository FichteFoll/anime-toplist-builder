import { describe, expect, it } from 'vitest'

import { countWrappedTextLines } from '@/lib/export-image'

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
