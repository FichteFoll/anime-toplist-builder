import { appConfig } from '@/config/app'
import { resolveAnimeTitle } from '@/lib/anime-title'
import { formatSongEpisodesHint, getSelectionCoverImage, resolveSongTitle } from '@/lib/song-selection'
import type {
  AnimeFormat,
  AnimeTitleLanguage,
  CategorySelectionMap,
  ExportImageLayout,
  Template,
} from '@/types'

type ExportTheme = 'light' | 'dark'

export const SIDE_MARGIN = 56
export const GRID_GAP = 24
export const PORTRAIT_COLUMNS = 3
export const LANDSCAPE_COLUMNS = 5
export const CARD_WIDTH = 415
export const CARD_PADDING = 20
export const CARD_TEXT_GAP = 4
export const COVER_WIDTH = 126
export const COVER_HEIGHT = 183
export const CATEGORIES_PER_ROW_PORTRAIT = 3
export const CATEGORIES_PER_ROW_LANDSCAPE = 5
export const FONT_SIZE_TEMPLATE_TITLE = 44
export const FONT_SIZE_HEADER_META = 22
export const FONT_SIZE_CATEGORY_TITLE = 20
export const FONT_SIZE_BODY = 18
export const FONT_SIZE_META = 16

const truncateSongMeta = (
  context: CanvasRenderingContext2D,
  animeName: string,
  slug: string,
  episodes: string | null,
  maxWidth: number,
) => {
  const buildLine = (name: string) => {
    const episodesHint = formatSongEpisodesHint(episodes)

    return episodesHint ? `from ${name} (${slug}, ${episodesHint})` : `from ${name} (${slug})`
  }

  const fullLine = buildLine(animeName)

  if (context.measureText(fullLine).width <= maxWidth) {
    return fullLine
  }

  const fallbackWidth = Math.max(90, maxWidth - context.measureText(`from  (${slug})`).width)

  return buildLine(fitTextToWidth(context, animeName, fallbackWidth))
}

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
  layout: ExportImageLayout
  author: string
  hideAuthor: boolean
  showAniListBadge: boolean
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

const anilistBadgeSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>AniList logo</title><desc>Anime and manga tracking website</desc><path fill="#1e2630" d="M0 0h512v512H0"/><path fill="#02a9ff" d="M321.92 323.27V136.6c0-10.698-5.887-16.602-16.558-16.602h-36.433c-10.672 0-16.561 5.904-16.561 16.602v88.651c0 2.497 23.996 14.089 24.623 16.541 18.282 71.61 3.972 128.92-13.359 131.6 28.337 1.405 31.455 15.064 10.348 5.731 3.229-38.209 15.828-38.134 52.049-1.406.31.317 7.427 15.282 7.87 15.282h85.545c10.672 0 16.558-5.9 16.558-16.6v-36.524c0-10.698-5.886-16.602-16.558-16.602z"/><path fill="#fefefe" d="M170.68 120 74.999 393h74.338l16.192-47.222h80.96L262.315 393h73.968l-95.314-273zm11.776 165.28 23.183-75.629 25.393 75.629z"/></svg>'

const anilistBadgeSvgDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(anilistBadgeSvg)}`

const imageCache = new Map<string, Promise<HTMLImageElement | null>>()

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const fitTextToWidth = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) => {
  if (context.measureText(text).width <= maxWidth) {
    return text
  }

  const characters = Array.from(text)
  let low = 0
  let high = characters.length

  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    const candidate = `${characters.slice(0, mid).join('').trimEnd()}...`

    if (context.measureText(candidate).width <= maxWidth) {
      low = mid
    } else {
      high = mid - 1
    }
  }

  if (low <= 0) {
    return '...'
  }

  return `${characters.slice(0, low).join('').trimEnd()}...`
}

export const countWrappedTextLines = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) => {
  const words = text.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return 0
  }

  let lines = 0
  let currentLine = ''
  let index = 0

  while (index < words.length && lines < maxLines - 1) {
    const word = words[index]
    const candidate = currentLine.length > 0 ? `${currentLine} ${word}` : word

    if (context.measureText(candidate).width <= maxWidth || currentLine.length === 0) {
      currentLine = candidate
      index += 1
      continue
    }

    lines += 1
    currentLine = ''
  }

  if (index >= words.length) {
    return lines + (currentLine.length > 0 ? 1 : 0)
  }

  return lines + 1
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
  const lineCount = countWrappedTextLines(context, text, maxWidth, maxLines)

  if (lineCount === 0) {
    return y
  }

  const words = text.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentLine = ''
  let index = 0

  while (index < words.length && lines.length < maxLines - 1) {
    const word = words[index]
    const candidate = currentLine.length > 0 ? `${currentLine} ${word}` : word

    if (context.measureText(candidate).width <= maxWidth || currentLine.length === 0) {
      currentLine = candidate
      index += 1
      continue
    }

    lines.push(currentLine)
    currentLine = ''
  }

  if (index >= words.length) {
    if (currentLine.length > 0) {
      lines.push(currentLine)
    }
  } else {
    const remainingText = [currentLine, ...words.slice(index)].filter(Boolean).join(' ')
    const finalLine = fitTextToWidth(context, remainingText, maxWidth)

    if (finalLine.length > 0) {
      lines.push(finalLine)
    }
  }

  context.save()
  context.fillStyle = color

  for (const [index, line] of lines.slice(0, maxLines).entries()) {
    context.fillText(line, x, y + index * lineHeight, maxWidth)
  }

  context.restore()

  return y + lines.slice(0, maxLines).length * lineHeight
}

const createFontConfig = (): ExportFontConfig => ({
  templateTitle: FONT_SIZE_TEMPLATE_TITLE,
  headerMeta: FONT_SIZE_HEADER_META,
  categoryTitle: FONT_SIZE_CATEGORY_TITLE,
  body: FONT_SIZE_BODY,
  meta: FONT_SIZE_META,
})

const setCanvasFont = (
  context: CanvasRenderingContext2D,
  weight: 400 | 500 | 600 | 700,
  size: number,
  style: 'normal' | 'italic' = 'normal',
) => {
  context.font = `${style} ${weight} ${size}px ${fontFamily}`
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

const setImageSmoothing = (context: CanvasRenderingContext2D) => {
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
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

const drawAniListBadgeIcon = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  image: HTMLImageElement,
) => {
  context.save()
  context.drawImage(image, x, y, size, size)
  context.restore()
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
  const drawImageSection = (
    targetContext: CanvasRenderingContext2D,
    source: CanvasImageSource,
    sourceX: number,
    sourceY: number,
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
  ) => {
    setImageSmoothing(targetContext)
    targetContext.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight)
  }

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

  let source: CanvasImageSource = image
  let currentWidth = sourceWidth
  let currentHeight = sourceHeight

  while (currentWidth / 2 > width || currentHeight / 2 > height) {
    const scale = Math.max(width / currentWidth, height / currentHeight, 0.5)
    const nextWidth = Math.max(width, Math.round(currentWidth * scale))
    const nextHeight = Math.max(height, Math.round(currentHeight * scale))
    const bufferCanvas = document.createElement('canvas')
    const bufferContext = bufferCanvas.getContext('2d')

    if (!bufferContext) {
      break
    }

    bufferCanvas.width = nextWidth
    bufferCanvas.height = nextHeight
    drawImageSection(
      bufferContext,
      source,
      sourceX,
      sourceY,
      currentWidth,
      currentHeight,
      nextWidth,
      nextHeight,
    )

    source = bufferCanvas
    sourceX = 0
    sourceY = 0
    currentWidth = nextWidth
    currentHeight = nextHeight
  }

  context.save()
  setImageSmoothing(context)
  drawRoundedRect(context, x, y, width, height, radius)
  context.clip()
  if (source === image && currentWidth === sourceWidth && currentHeight === sourceHeight) {
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
  } else {
    context.drawImage(source, 0, 0, currentWidth, currentHeight, x, y, width, height)
  }
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

const createMeasurementContext = () => createCanvas(1, 1).context

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
  layout,
  author,
  hideAuthor,
  showAniListBadge,
}: ExportRenderInput): Promise<ExportRenderResult> => {
  const palette = exportPaletteByTheme[theme]
  const fonts = createFontConfig()
  const measureContext = createMeasurementContext()
  const generatedLabel = new Date().toISOString().slice(0, 10)
  const columns = layout === 'landscape' ? CATEGORIES_PER_ROW_LANDSCAPE : CATEGORIES_PER_ROW_PORTRAIT
  const width = SIDE_MARGIN * 2 + CARD_WIDTH * columns + GRID_GAP * (columns - 1)
  const footerHeight = 56
  const filledSelections = template.categories.filter((category) => selectionByCategory[category.id]).length
  const rows = Math.max(1, Math.ceil(Math.max(template.categories.length, 1) / columns))
  const cardHeight = COVER_HEIGHT + CARD_PADDING * 2
  const gridHeight = rows * cardHeight + (rows - 1) * GRID_GAP
  const headerTextWidth = width - SIDE_MARGIN * 2 - 40
  const headerTitleLineHeight = Math.round(fonts.templateTitle * 1.15)
  const headerDescriptionLineHeight = Math.round(fonts.body * 1.35)
  const headerMetaLineHeight = Math.round(fonts.headerMeta * 1.3)
  const headerTitleLines = countWrappedTextLines(measureContext, template.name, headerTextWidth, 2)
  const headerDescriptionLines =
    template.description.trim().length > 0
      ? countWrappedTextLines(measureContext, template.description, headerTextWidth, 2)
      : 0
  const authorLabel = author.trim() || 'Anonymous'
  const headerMetaText = hideAuthor
    ? `Categories: ${filledSelections}/${template.categories.length}  •  ${generatedLabel}`
    : `Author: ${authorLabel}  •  Categories: ${filledSelections}/${template.categories.length}  •  ${generatedLabel}`
  const headerMetaTextWidth =
    hideAuthor || !showAniListBadge
      ? headerTextWidth
      : headerTextWidth - (measureContext.measureText('Author: ').width + 26 + 10)
  const headerMetaLines = countWrappedTextLines(measureContext, headerMetaText, headerMetaTextWidth, 2)
  const headerTopPadding = 32
  const headerBottomPadding = 24
  const headerHeight =
    headerTopPadding +
    headerTitleLineHeight * headerTitleLines +
    (headerDescriptionLines > 0 ? 10 + headerDescriptionLineHeight * headerDescriptionLines : 0) +
    12 +
    headerMetaLineHeight * headerMetaLines +
    headerBottomPadding
  const height = SIDE_MARGIN + headerHeight + 28 + gridHeight + footerHeight + SIDE_MARGIN
  const { canvas, context } = createCanvas(width, height)
  const aniListBadgeIcon = showAniListBadge ? await loadImage(anilistBadgeSvgDataUri) : null

  context.fillStyle = palette.background
  context.fillRect(0, 0, width, height)

  fillRoundedRect(context, SIDE_MARGIN, SIDE_MARGIN, width - SIDE_MARGIN * 2, headerHeight, 36, palette.surface)
  strokeRoundedRect(context, SIDE_MARGIN, SIDE_MARGIN, width - SIDE_MARGIN * 2, headerHeight, 36, palette.border, 2)

  const headerTextX = SIDE_MARGIN + 24
  const headerTitleY = SIDE_MARGIN + 32

  context.textBaseline = 'top'
  setCanvasFont(context, 700, fonts.templateTitle)
  context.fillStyle = palette.text
  const titleBottomY = drawWrappedText(
    context,
    template.name,
    headerTextX,
    headerTitleY,
    headerTextWidth,
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
      headerTextWidth,
      headerDescriptionLineHeight,
      2,
      palette.muted,
    )
  }

  setCanvasFont(context, 500, fonts.headerMeta)
  context.fillStyle = palette.muted
  const metaTopY = descriptionBottomY + 12

  if (hideAuthor) {
    drawWrappedText(
      context,
      `Categories: ${filledSelections}/${template.categories.length}  •  ${generatedLabel}`,
      headerTextX,
      metaTopY,
      headerTextWidth,
      headerMetaLineHeight,
      2,
      palette.muted,
    )
  } else if (showAniListBadge) {
    const authorPrefix = 'Author: '
    const iconSize = 26
    const iconSpacing = 10
    const iconY = metaTopY + Math.round((fonts.headerMeta - iconSize) / 2)

    context.fillText(authorPrefix, headerTextX, metaTopY)

    const prefixWidth = context.measureText(authorPrefix).width
    const iconX = headerTextX + prefixWidth
    const textX = iconX + iconSize + iconSpacing

    if (aniListBadgeIcon) {
      drawAniListBadgeIcon(context, iconX, iconY, iconSize, aniListBadgeIcon)
    }
    drawWrappedText(
      context,
      `${authorLabel}  •  Categories: ${filledSelections}/${template.categories.length}  •  ${generatedLabel}`,
      textX,
      metaTopY,
      headerTextWidth - (textX - headerTextX),
      headerMetaLineHeight,
      2,
      palette.muted,
    )
  } else {
    drawWrappedText(
      context,
      `Author: ${authorLabel}  •  Categories: ${filledSelections}/${template.categories.length}  •  ${generatedLabel}`,
      headerTextX,
      metaTopY,
      headerTextWidth,
      headerMetaLineHeight,
      2,
      palette.muted,
    )
  }

  context.textBaseline = 'alphabetic'

  const imageEntries = await Promise.all(
    template.categories.map(async (category) => {
      const selection = selectionByCategory[category.id] ?? null

      return [
        category.id,
        selection
          ? await loadImage(getSelectionCoverImage(selection).extraLarge ?? getSelectionCoverImage(selection).large)
          : null,
      ] as const
    }),
  )
  const imagesByCategoryId = new Map(imageEntries)

  if (template.categories.length === 0) {
    const emptyY = SIDE_MARGIN + headerHeight + 28

    fillRoundedRect(context, SIDE_MARGIN, emptyY, width - SIDE_MARGIN * 2, 220, 32, palette.surface)
    strokeRoundedRect(context, SIDE_MARGIN, emptyY, width - SIDE_MARGIN * 2, 220, 32, palette.border, 2)
    setCanvasFont(context, 700, fonts.categoryTitle)
    context.fillStyle = palette.text
    context.fillText('No categories in this template yet.', SIDE_MARGIN + 28, emptyY + 64)
    setCanvasFont(context, 500, fonts.body)
    context.fillStyle = palette.muted
    drawWrappedText(
      context,
      'Add category cards in the app before exporting to generate a filled grid image.',
      SIDE_MARGIN + 28,
      emptyY + 106,
      width - SIDE_MARGIN * 2 - 56,
      Math.round(fonts.body * 1.45),
      3,
      palette.muted,
    )
  }

  template.categories.forEach((category, index) => {
    const row = Math.floor(index / columns)
    const column = index % columns
    const x = SIDE_MARGIN + column * (CARD_WIDTH + GRID_GAP)
    const y = SIDE_MARGIN + headerHeight + 28 + row * (cardHeight + GRID_GAP)
    const selection = selectionByCategory[category.id] ?? null
    const image = imagesByCategoryId.get(category.id) ?? null
    const coverX = x + CARD_PADDING
    const coverY = y + CARD_PADDING
    const textX = coverX + COVER_WIDTH + 14
    const textWidth = CARD_WIDTH - (textX - x) - CARD_PADDING
    const selectionTitle = selection
      ? selection.kind === 'song'
        ? resolveSongTitle(selection.song, titleLanguage).primary
        : resolveAnimeTitle(selection.title, titleLanguage)
      : ''
    const metaText = selection
      ? selection.kind === 'song'
        ? truncateSongMeta(
            context,
            resolveAnimeTitle(selection.animeTitle, titleLanguage),
            selection.song.slug,
            selection.song.episodes ?? null,
            textWidth,
          )
        : [selection.seasonYear ?? null, selection.format ?? null]
            .filter((value): value is number | AnimeFormat => value !== null)
            .join(' • ')
      : ''

    fillRoundedRect(context, x, y, CARD_WIDTH, cardHeight, 28, palette.surface)
    strokeRoundedRect(context, x, y, CARD_WIDTH, cardHeight, 28, palette.border, 2)

    if (selection && image) {
      drawCoverImage(context, image, coverX, coverY, COVER_WIDTH, COVER_HEIGHT, 18)
      strokeRoundedRect(context, coverX, coverY, COVER_WIDTH, COVER_HEIGHT, 18, palette.border, 2)
    } else if (selection) {
      drawCoverPlaceholder(
        context,
        coverX,
        coverY,
        COVER_WIDTH,
        COVER_HEIGHT,
        18,
        palette,
        category.name,
        getSelectionCoverImage(selection).color ?? palette.elevated,
      )
    } else {
      drawMissingSelectionPlaceholder(
        context,
        coverX,
        coverY,
        COVER_WIDTH,
        COVER_HEIGHT,
        18,
        palette,
        palette.elevated,
      )
    }

    setCanvasFont(context, 500, fonts.categoryTitle, 'italic')
    context.fillStyle = palette.text
    let prevLineY = drawWrappedText(
      context,
      category.name,
      textX,
      y + CARD_PADDING + 22,
      textWidth,
      Math.round(fonts.categoryTitle * 1.15),
      3,
      palette.text,
    )

    setCanvasFont(context, 700, fonts.body)
    context.fillStyle = palette.text
    prevLineY = drawWrappedText(
      context,
      selectionTitle,
      textX,
      prevLineY + CARD_TEXT_GAP,
      textWidth,
      Math.round(fonts.body * 1.28),
      selection?.kind === 'song' ? 2 : 3,
      palette.text,
    )

    setCanvasFont(context, 500, fonts.meta)
    context.fillStyle = palette.muted
    if (selection?.kind === 'song') {
      const artist = selection.song.artist.trim()

      if (artist) {
        prevLineY = drawWrappedText(
          context,
          `by ${artist}`,
          textX,
          prevLineY + CARD_TEXT_GAP,
          textWidth,
          Math.round(fonts.meta * 1.3),
          2,
          palette.muted,
        )
      }
      drawWrappedText(
        context,
        metaText,
        textX,
        prevLineY + CARD_TEXT_GAP,
        textWidth,
        Math.round(fonts.meta * 1.3),
        2,
        palette.muted,
      )
    } else {
      drawWrappedText(
        context,
        metaText,
        textX,
        prevLineY + CARD_TEXT_GAP,
        textWidth,
        Math.round(fonts.meta * 1.3),
        2,
        palette.muted,
      )
    }

    setCanvasFont(context, 500, fonts.meta)
    context.fillStyle = palette.muted
  })

  setCanvasFont(context, 500, fonts.meta)
  context.fillStyle = palette.muted
  context.fillText(`Generated with ${appConfig.exportSiteUrl}`, SIDE_MARGIN, height - SIDE_MARGIN)

  return {
    blob: await toBlob(canvas),
    width,
    height,
  }
}
