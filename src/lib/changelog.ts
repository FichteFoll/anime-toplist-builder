import type { ChangelogEntry, ChangelogInlineSpan } from '@/types'

const headingPrefix = '## '
const versionPattern = /^\d{4}-\d{2}-\d{2}$/
const itemStartPattern = /^\s*-\s+/

// One pass over the supported inline syntax, in precedence order:
// code, link, strong, emphasis. Code contents are never parsed further,
// which the alternation gives for free by consuming the whole span.
const inlinePattern = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_/g

const parseInlineSpans = (text: string): Array<ChangelogInlineSpan> => {
  const spans: Array<ChangelogInlineSpan> = []
  let lastIndex = 0

  const pushText = (value: string) => {
    if (value.length > 0) {
      spans.push({ kind: 'text', text: value })
    }
  }

  inlinePattern.lastIndex = 0

  let match = inlinePattern.exec(text)

  while (match) {
    pushText(text.slice(lastIndex, match.index))

    const [matched, code, linkText, href, strong, emphasisStar, emphasisUnderscore] = match

    if (code !== undefined) {
      spans.push({ kind: 'code', text: code })
    } else if (linkText !== undefined && href !== undefined) {
      spans.push({ kind: 'link', text: linkText, href })
    } else if (strong !== undefined) {
      spans.push({ kind: 'strong', text: strong })
    } else {
      spans.push({ kind: 'emphasis', text: emphasisStar ?? emphasisUnderscore ?? '' })
    }

    lastIndex = match.index + matched.length
    match = inlinePattern.exec(text)
  }

  pushText(text.slice(lastIndex))

  return spans
}

export const parseChangelog = (source: string): Array<ChangelogEntry> => {
  const entries: Array<ChangelogEntry> = []

  let currentEntry: ChangelogEntry | null = null
  let currentItemText: string | null = null

  const closeItem = () => {
    if (currentItemText === null || !currentEntry) {
      return
    }

    currentEntry.items.push({ spans: parseInlineSpans(currentItemText) })
    currentItemText = null
  }

  for (const line of source.split('\n')) {
    if (line.startsWith(headingPrefix)) {
      closeItem()

      const version = line.slice(headingPrefix.length).trim()

      if (versionPattern.test(version)) {
        currentEntry = { version, items: [] }
        entries.push(currentEntry)
      } else {
        currentEntry = null
      }

      continue
    }

    if (!currentEntry) {
      continue
    }

    if (itemStartPattern.test(line)) {
      closeItem()
      currentItemText = line.replace(itemStartPattern, '')
      continue
    }

    if (line.trim().length === 0) {
      closeItem()
      continue
    }

    if (currentItemText !== null) {
      currentItemText = `${currentItemText} ${line.trim()}`
    }
  }

  closeItem()

  return entries
}

export const findUnseenVersions = (
  entries: Array<ChangelogEntry>,
  seenVersion: string | null,
): Array<string> => {
  if (seenVersion === null) {
    return []
  }

  return entries
    .filter((entry) => entry.version > seenVersion)
    .map((entry) => entry.version)
}

export const resolveChangelogAutoOpen = (
  entries: Array<ChangelogEntry>,
  seenVersion: string | null,
): { shouldOpen: boolean, versionToRecord: string | null } => {
  const latest = entries[0]?.version ?? null

  if (latest === null) {
    return { shouldOpen: false, versionToRecord: null }
  }

  if (seenVersion === null) {
    return { shouldOpen: false, versionToRecord: latest }
  }

  if (latest > seenVersion) {
    return { shouldOpen: true, versionToRecord: latest }
  }

  return { shouldOpen: false, versionToRecord: null }
}
