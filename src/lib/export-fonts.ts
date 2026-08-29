export const FONT_SIZE_TEMPLATE_TITLE = 44
export const FONT_SIZE_HEADER_META = 22
export const FONT_SIZE_CATEGORY_TITLE = 20
export const FONT_SIZE_BODY = 18
export const FONT_SIZE_META = 16

const fontFamily = "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

/**
 * Builds the CSS font string for the export canvas.
 *
 * It stays deterministic per (weight, size, style) so that pretext, which
 * caches measurements keyed by the font string, keeps hitting its cache.
 */
export const exportFont = (
  weight: 400 | 500 | 600 | 700,
  size: number,
  style: 'normal' | 'italic' = 'normal',
) => `${style} ${weight} ${size}px ${fontFamily}`
