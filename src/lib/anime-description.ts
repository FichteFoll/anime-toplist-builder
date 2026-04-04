const allowedInlineTags = new Set([
  'br',
  'i',
  'em',
  'b',
  'strong',
  'u',
  's',
  'small',
  'sub',
  'sup',
])

const escapeHtml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

const serializeNode = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent ?? '')
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return ''
  }

  const element = node as Element
  const tagName = element.tagName.toLowerCase()

  if (!allowedInlineTags.has(tagName)) {
    return escapeHtml(element.outerHTML)
  }

  if (tagName === 'br') {
    return '<br>'
  }

  return `<${tagName}>${Array.from(element.childNodes).map(serializeNode).join('')}</${tagName}>`
}

export const sanitizeAnimeDescriptionHtml = (description: string) => {
  const parser = new DOMParser()
  const document = parser.parseFromString(`<div>${description}</div>`, 'text/html')
  const container = document.body.firstElementChild

  if (!container) {
    return escapeHtml(description)
  }

  return Array.from(container.childNodes).map(serializeNode).join('')
}
