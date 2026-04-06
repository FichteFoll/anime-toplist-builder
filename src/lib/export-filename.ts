const windowsInvalidCharacters = /[<>:"/\\|?*]/g
const trailingWindowsCharacters = /[ .]+$/g
const repeatedWhitespace = /\s+/g
const reservedWindowsNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i

const stripControlCharacters = (value: string) =>
  [...value].filter((character) => character.charCodeAt(0) >= 32).join('')

export const sanitizeDownloadFilename = (value: string, fallback: string) => {
  const normalizedValue = stripControlCharacters(value)
    .replace(windowsInvalidCharacters, '-')
    .replace(repeatedWhitespace, ' ')
    .trim()
    .replace(trailingWindowsCharacters, '')

  const safeValue = normalizedValue || fallback

  if (reservedWindowsNames.test(safeValue)) {
    return `${fallback}-${safeValue}`
  }
  return safeValue || fallback
}

export const createPngExportFilename = (templateName: string, author?: string | null) => {
  let fileName = templateName
  if (author?.trim()) {
    fileName = `${templateName} by ${author}`
  }
  const safeFileName = sanitizeDownloadFilename(fileName, 'anime-toplist')
  return `${safeFileName}.png`
}
