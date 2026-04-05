import { appConfig } from '@/config/app'
import { resolveAnimeTitle } from '@/lib/anime-title'
import type {
  AnimeFormat,
  AnimeTitleLanguage,
  CategorySelectionMap,
  Template,
} from '@/types'

type ExportTheme = 'light' | 'dark'

export const EXPORT_IMAGE_WIDTH = 1400
export const EXPORT_CATEGORIES_PER_ROW = 3
export const EXPORT_FONT_SIZE_TEMPLATE_TITLE = 44
export const EXPORT_FONT_SIZE_HEADER_META = 22
export const EXPORT_FONT_SIZE_CATEGORY_TITLE = 24
export const EXPORT_FONT_SIZE_BODY = 18
export const EXPORT_FONT_SIZE_META = 16

interface ExportPalette {
  background: string
  surface: string
  elevated: string
  border: string
  text: string
  muted: string
  accent: string
  accentSoft: string
}

interface ExportFontConfig {
  templateTitle: number
  headerMeta: number
  categoryTitle: number
  body: number
  meta: number
}

export interface ExportRenderInput {
  template: Template
  selectionByCategory: CategorySelectionMap
  theme: ExportTheme
  titleLanguage: AnimeTitleLanguage
  author: string
}

export interface ExportRenderResult {
  blob: Blob
  width: number
  height: number
}

const exportPaletteByTheme: Record<ExportTheme, ExportPalette> = {
  light: {
    background: 'rgb(245 247 250)',
    surface: 'rgb(255 255 255)',
    elevated: 'rgb(236 241 255)',
    border: 'rgb(203 213 225)',
    text: 'rgb(15 23 42)',
    muted: 'rgb(71 85 105)',
    accent: 'rgb(79 70 229)',
    accentSoft: 'rgb(224 231 255)',
  },
  dark: {
    background: 'rgb(3 7 18)',
    surface: 'rgb(15 23 42)',
    elevated: 'rgb(30 41 59)',
    border: 'rgb(51 65 85)',
    text: 'rgb(241 245 249)',
    muted: 'rgb(148 163 184)',
    accent: 'rgb(129 140 248)',
    accentSoft: 'rgb(49 46 129)',
  },
}

const fontFamily = "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

const imageCache = new Map<string, Promise<HTMLImageElement | null>>()

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const createFontConfig = (): ExportFontConfig => ({
  templateTitle: EXPORT_FONT_SIZE_TEMPLATE_TITLE,
  headerMeta: EXPORT_FONT_SIZE_HEADER_META,
  categoryTitle: EXPORT_FONT_SIZE_CATEGORY_TITLE,
  body: EXPORT_FONT_SIZE_BODY,
  meta: EXPORT_FONT_SIZE_META,
})

const setCanvasFont = (
  context: CanvasRenderingContext2D,
  weight: 400 | 500 | 600 | 700,
  size: number,
) => {
  context.font = `${weight} ${size}px ${fontFamily}`
}

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.lineTo(x + width - safeRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  context.lineTo(x + width, y + height - safeRadius)
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
  context.lineTo(x + safeRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  context.lineTo(x, y + safeRadius)
  context.quadraticCurveTo(x, y, x + safeRadius, y)
  context.closePath()
}

const fillRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: string,
) => {
  context.save()
  context.fillStyle = color
  drawRoundedRect(context, x, y, width, height, radius)
  context.fill()
  context.restore()
}

const strokeRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: string,
  lineWidth: number,
) => {
  context.save()
  context.strokeStyle = color
  context.lineWidth = lineWidth
  drawRoundedRect(context, x, y, width, height, radius)
  context.stroke()
  context.restore()
}

const drawWrappedText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  color: string,
) => {
  const words = text.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return y
  }

  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const candidate = currentLine.length > 0 ? `${currentLine} ${word}` : word

    if (context.measureText(candidate).width <= maxWidth || currentLine.length === 0) {
      currentLine = candidate
      continue
    }

    lines.push(currentLine)
    currentLine = word

    if (lines.length === maxLines - 1) {
      break
    }
  }

  if (lines.length < maxLines && currentLine.length > 0) {
    lines.push(currentLine)
  }

  const visibleLines = lines.slice(0, maxLines)

  if (lines.length > maxLines || words.join(' ').length > visibleLines.join(' ').length) {
    const lastLineIndex = visibleLines.length - 1
    let lastLine = visibleLines[lastLineIndex] ?? ''

    while (lastLine.length > 0 && context.measureText(`${lastLine}...`).width > maxWidth) {
      lastLine = lastLine.slice(0, -1).trimEnd()
    }

    visibleLines[lastLineIndex] = lastLine.length > 0 ? `${lastLine}...` : '...'
  }

  context.save()
  context.fillStyle = color

  for (const [index, line] of visibleLines.entries()) {
    context.fillText(line, x, y + index * lineHeight, maxWidth)
  }

  context.restore()

  return y + visibleLines.length * lineHeight
}

const loadImage = async (url: string | null | undefined) => {
  const normalizedUrl = url?.trim()

  if (!normalizedUrl) {
    return null
  }

  const cachedImage = imageCache.get(normalizedUrl)

  if (cachedImage) {
    return cachedImage
  }

  const imagePromise = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()

    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = normalizedUrl
  })

  imageCache.set(normalizedUrl, imagePromise)

  return imagePromise
}

const drawCoverImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const sourceAspectRatio = image.width / image.height
  const targetAspectRatio = width / height

  let sourceWidth = image.width
  let sourceHeight = image.height
  let sourceX = 0
  let sourceY = 0

  if (sourceAspectRatio > targetAspectRatio) {
    sourceWidth = image.height * targetAspectRatio
    sourceX = (image.width - sourceWidth) / 2
  } else {
    sourceHeight = image.width / targetAspectRatio
    sourceY = (image.height - sourceHeight) / 2
  }

  context.save()
  drawRoundedRect(context, x, y, width, height, radius)
  context.clip()
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
  context.restore()
}

const drawCoverPlaceholder = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  palette: ExportPalette,
  label: string,
  tone: string,
) => {
  fillRoundedRect(context, x, y, width, height, radius, tone)
  strokeRoundedRect(context, x, y, width, height, radius, palette.border, 2)

  setCanvasFont(context, 700, clamp(Math.round(width * 0.34), 22, 34))
  context.fillStyle = palette.text
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(label.slice(0, 2).toUpperCase(), x + width / 2, y + height / 2 - 12)

  setCanvasFont(context, 500, 14)
  context.fillStyle = palette.muted
  context.fillText('Image unavailable', x + width / 2, y + height / 2 + 18)
  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'
}

const drawMissingSelectionPlaceholder = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  palette: ExportPalette,
  tone: string,
) => {
  fillRoundedRect(context, x, y, width, height, radius, tone)
  strokeRoundedRect(context, x, y, width, height, radius, palette.border, 2)

  const iconSize = clamp(Math.round(Math.min(width, height) * 0.34), 48, 68)
  const iconX = x + (width - iconSize) / 2
  const iconY = y + (height - iconSize) / 2
  const stroke = palette.muted

  context.save()
  context.strokeStyle = stroke
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = 4
  drawRoundedRect(context, iconX, iconY, iconSize, iconSize, 18)
  context.stroke()

  context.beginPath()
  context.moveTo(iconX + 12, iconY + 12)
  context.lineTo(iconX + iconSize - 12, iconY + iconSize - 12)
  context.stroke()
  context.restore()
}

const createCanvas = (width: number, height: number) => {
  if (typeof document === 'undefined') {
    throw new Error('PNG export is only available in the browser.')
  }

  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas rendering is unavailable in this browser.')
  }

  return {
    canvas,
    context,
  }
}

const toBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG generation failed.'))
        return
      }

      resolve(blob)
    }, 'image/png')
  })

export const renderTemplatePng = async ({
  template,
  selectionByCategory,
  theme,
  titleLanguage,
  author,
}: ExportRenderInput): Promise<ExportRenderResult> => {
  const width = EXPORT_IMAGE_WIDTH
  const palette = exportPaletteByTheme[theme]
  const fonts = createFontConfig()
  const outerPadding = Math.round(width * 0.04)
  const headerHeight = Math.round(width * 0.135)
  const footerHeight = 56
  const gridGap = 24
  const columns = EXPORT_CATEGORIES_PER_ROW
  const filledSelections = template.categories.filter((category) => selectionByCategory[category.id]).length
  const rows = Math.max(1, Math.ceil(Math.max(template.categories.length, 1) / columns))
  const cardWidth = Math.floor(
    (width - outerPadding * 2 - gridGap * (columns - 1)) / columns,
  )
  const cardPadding = 20
  const coverWidth = clamp(Math.round(cardWidth * 0.34), 92, 132)
  const coverHeight = Math.round(coverWidth * 1.45)
  const cardHeight = coverHeight + cardPadding * 2
  const gridHeight = rows * cardHeight + (rows - 1) * gridGap
  const height = outerPadding + headerHeight + 28 + gridHeight + footerHeight + outerPadding
  const { canvas, context } = createCanvas(width, height)
  const authorLabel = author.trim() || 'Anonymous'
  const generatedLabel = new Date().toISOString().slice(0, 10)

  context.fillStyle = palette.background
  context.fillRect(0, 0, width, height)

  fillRoundedRect(context, outerPadding, outerPadding, width - outerPadding * 2, headerHeight, 36, palette.surface)
  strokeRoundedRect(context, outerPadding, outerPadding, width - outerPadding * 2, headerHeight, 36, palette.border, 2)

  const headerTextX = outerPadding + 24
  const headerTitleY = outerPadding + 32
  const headerTitleLineHeight = Math.round(fonts.templateTitle * 1.15)
  const headerDescriptionLineHeight = Math.round(fonts.body * 1.35)
  const headerMetaLineHeight = Math.round(fonts.headerMeta * 1.3)

  context.textBaseline = 'top'
  setCanvasFont(context, 700, fonts.templateTitle)
  context.fillStyle = palette.text
  const titleBottomY = drawWrappedText(
    context,
    template.name,
    headerTextX,
    headerTitleY,
    width - outerPadding * 2 - 40,
    headerTitleLineHeight,
    2,
    palette.text,
  )

  let descriptionBottomY = titleBottomY

  if (template.description.trim().length > 0) {
    setCanvasFont(context, 500, fonts.body)
    context.fillStyle = palette.muted
    descriptionBottomY = drawWrappedText(
      context,
      template.description,
      headerTextX,
      titleBottomY + 10,
      width - outerPadding * 2 - 40,
      headerDescriptionLineHeight,
      2,
      palette.muted,
    )
  }

  setCanvasFont(context, 500, fonts.headerMeta)
  context.fillStyle = palette.muted
  drawWrappedText(
    context,
    `Author: ${authorLabel}  •  Categories: ${filledSelections}/${template.categories.length}  •  ${generatedLabel}`,
    headerTextX,
    descriptionBottomY + 12,
    width - outerPadding * 2 - 40,
    headerMetaLineHeight,
    2,
    palette.muted,
  )

  context.textBaseline = 'alphabetic'

  const imageEntries = await Promise.all(
    template.categories.map(async (category) => {
      const selection = selectionByCategory[category.id] ?? null

      return [
        category.id,
        selection ? await loadImage(selection.coverImage.extraLarge ?? selection.coverImage.large) : null,
      ] as const
    }),
  )
  const imagesByCategoryId = new Map(imageEntries)

  if (template.categories.length === 0) {
    const emptyY = outerPadding + headerHeight + 28

    fillRoundedRect(context, outerPadding, emptyY, width - outerPadding * 2, 220, 32, palette.surface)
    strokeRoundedRect(context, outerPadding, emptyY, width - outerPadding * 2, 220, 32, palette.border, 2)
    setCanvasFont(context, 700, fonts.categoryTitle)
    context.fillStyle = palette.text
    context.fillText('No categories in this template yet.', outerPadding + 28, emptyY + 64)
    setCanvasFont(context, 500, fonts.body)
    context.fillStyle = palette.muted
    drawWrappedText(
      context,
      'Add category cards in the app before exporting to generate a filled grid image.',
      outerPadding + 28,
      emptyY + 106,
      width - outerPadding * 2 - 56,
      Math.round(fonts.body * 1.45),
      3,
      palette.muted,
    )
  }

  template.categories.forEach((category, index) => {
    const row = Math.floor(index / columns)
    const column = index % columns
    const x = outerPadding + column * (cardWidth + gridGap)
    const y = outerPadding + headerHeight + 28 + row * (cardHeight + gridGap)
    const selection = selectionByCategory[category.id] ?? null
    const image = imagesByCategoryId.get(category.id) ?? null
    const coverX = x + cardPadding
    const coverY = y + cardPadding
    const textX = coverX + coverWidth + 18
    const textWidth = cardWidth - (textX - x) - cardPadding
    const selectionTitle = selection ? resolveAnimeTitle(selection.title, titleLanguage) : ''
    const metaParts = [selection?.seasonYear ?? null, selection?.format ?? null].filter(
      (value): value is number | AnimeFormat => value !== null,
    )

    fillRoundedRect(context, x, y, cardWidth, cardHeight, 28, palette.surface)
    strokeRoundedRect(context, x, y, cardWidth, cardHeight, 28, palette.border, 2)

    if (selection && image) {
      drawCoverImage(context, image, coverX, coverY, coverWidth, coverHeight, 18)
      strokeRoundedRect(context, coverX, coverY, coverWidth, coverHeight, 18, palette.border, 2)
    } else if (selection) {
      drawCoverPlaceholder(
        context,
        coverX,
        coverY,
        coverWidth,
        coverHeight,
        18,
        palette,
        category.name,
        selection?.coverImage.color ?? palette.elevated,
      )
    } else {
      drawMissingSelectionPlaceholder(
        context,
        coverX,
        coverY,
        coverWidth,
        coverHeight,
        18,
        palette,
        palette.elevated,
      )
    }

    setCanvasFont(context, 600, fonts.categoryTitle)
    context.fillStyle = palette.text
    const categoryBottomY = drawWrappedText(
      context,
      category.name,
      textX,
      y + cardPadding + 22,
      textWidth,
      Math.round(fonts.categoryTitle * 1.2),
      2,
      palette.text,
    )

    setCanvasFont(context, 700, fonts.body)
    context.fillStyle = palette.text
    const titleBottomY = drawWrappedText(
      context,
      selectionTitle,
      textX,
      categoryBottomY + 14,
      textWidth,
      Math.round(fonts.body * 1.28),
      3,
      palette.text,
    )

    setCanvasFont(context, 500, fonts.meta)
    context.fillStyle = palette.muted
    drawWrappedText(
      context,
      metaParts.join(' • '),
      textX,
      titleBottomY + 16,
      textWidth,
      Math.round(fonts.meta * 1.3),
      2,
      palette.muted,
    )

    setCanvasFont(context, 500, fonts.meta)
    context.fillStyle = palette.muted
  })

  setCanvasFont(context, 500, fonts.meta)
  context.fillStyle = palette.muted
  context.fillText(`Generated with ${appConfig.exportSiteUrl}`, outerPadding, height - outerPadding)

  return {
    blob: await toBlob(canvas),
    width,
    height,
  }
}
