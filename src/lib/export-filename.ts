const windowsInvalidCharacters = /[<>:"/\\|?*]/g
const trailingWindowsCharacters = /[ .]+$/g
const repeatedWhitespace = /\s+/g
const reservedWindowsNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i

const stripControlCharacters = (value: string) =>
  [...value].filter((character) => character.charCodeAt(0) >= 32).join('')

export const sanitizeDownloadFilename = (value: string, fallback = 'anime-toplist') => {
  const normalizedValue = stripControlCharacters(value)
    .replace(windowsInvalidCharacters, '-')
    .replace(repeatedWhitespace, ' ')
    .trim()
    .replace(trailingWindowsCharacters, '')

  const safeValue = normalizedValue.length > 0 ? normalizedValue : fallback

  if (reservedWindowsNames.test(safeValue)) {
    return `${fallback}-${safeValue}`
  }

  return safeValue
}

export const createPngExportFilename = (templateName: string, author?: string | null) => {
  const safeTemplateName = sanitizeDownloadFilename(templateName)

  if (!author?.trim()) {
    return `${safeTemplateName}.png`
  }

  return `${sanitizeDownloadFilename(`${templateName} by ${author}`) || 'anime-toplist'}.png`
}
