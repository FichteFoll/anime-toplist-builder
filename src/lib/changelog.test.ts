import { describe, expect, it } from 'vitest'

import { changelogEntries, latestChangelogVersion } from '@/config/changelog'
import { findUnseenVersions, parseChangelog, resolveChangelogAutoOpen } from '@/lib/changelog'
import type { ChangelogEntry } from '@/types'

const fixture = [
  '# Changelog',
  '',
  'A preamble that is not part of any entry.',
  '',
  '## 2026-08-29',
  '',
  '- A change written across two lines',
  '  with a semantic break.',
  '- A change with `code`, a [link](https://example.com/docs) and **bold** text.',
  '',
  '## Unreleased',
  '',
  '- This item belongs to an ignored heading.',
  '',
  '## 2026-01-02',
  '',
  '- An older change.',
  '',
].join('\n')

const createEntry = (version: string): ChangelogEntry => ({ version, items: [] })

describe('parseChangelog', () => {
  it('parses date entries in file order and ignores the preamble', () => {
    const entries = parseChangelog(fixture)

    expect(entries.map((entry) => entry.version)).toEqual(['2026-08-29', '2026-01-02'])
  })

  it('joins a semantically broken item into a single text span', () => {
    const [entry] = parseChangelog(fixture)

    expect(entry.items[0].spans).toEqual([
      { kind: 'text', text: 'A change written across two lines with a semantic break.' },
    ])
  })

  it('splits inline code, links and bold text into spans', () => {
    const [entry] = parseChangelog(fixture)

    expect(entry.items[1].spans).toEqual([
      { kind: 'text', text: 'A change with ' },
      { kind: 'code', text: 'code' },
      { kind: 'text', text: ', a ' },
      { kind: 'link', text: 'link', href: 'https://example.com/docs' },
      { kind: 'text', text: ' and ' },
      { kind: 'strong', text: 'bold' },
      { kind: 'text', text: ' text.' },
    ])
  })

  it('ignores a non-date heading together with its items', () => {
    const entries = parseChangelog(fixture)

    expect(entries.flatMap((entry) => entry.items)).toHaveLength(3)
    expect(entries[1].items).toEqual([{ spans: [{ kind: 'text', text: 'An older change.' }] }])
  })

  it('parses emphasis written with either marker', () => {
    const [entry] = parseChangelog('## 2026-08-29\n\n- *one* and _two_\n')

    expect(entry.items[0].spans).toEqual([
      { kind: 'emphasis', text: 'one' },
      { kind: 'text', text: ' and ' },
      { kind: 'emphasis', text: 'two' },
    ])
  })

  it('never parses inside a code span', () => {
    const [entry] = parseChangelog('## 2026-08-29\n\n- `**not bold**`\n')

    expect(entry.items[0].spans).toEqual([{ kind: 'code', text: '**not bold**' }])
  })
})

describe('the shipped changelog file', () => {
  it('parses into at least one dated entry', () => {
    expect(changelogEntries.length).toBeGreaterThanOrEqual(1)
    expect(latestChangelogVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('findUnseenVersions', () => {
  const entries = [createEntry('2026-08-29'), createEntry('2026-01-02')]

  it('returns nothing when no version was ever seen', () => {
    expect(findUnseenVersions(entries, null)).toEqual([])
  })

  it('returns every version newer than an older seen version', () => {
    expect(findUnseenVersions(entries, '2026-01-01')).toEqual(['2026-08-29', '2026-01-02'])
  })

  it('excludes the seen version itself', () => {
    expect(findUnseenVersions(entries, '2026-01-02')).toEqual(['2026-08-29'])
  })

  it('returns nothing when the newest version was already seen', () => {
    expect(findUnseenVersions(entries, '2026-08-29')).toEqual([])
  })
})

describe('resolveChangelogAutoOpen', () => {
  const entries = [createEntry('2026-08-29'), createEntry('2026-01-02')]

  it('does nothing without entries', () => {
    expect(resolveChangelogAutoOpen([], null)).toEqual({ shouldOpen: false, versionToRecord: null })
  })

  it('records the latest version without opening on a first visit', () => {
    expect(resolveChangelogAutoOpen(entries, null)).toEqual({
      shouldOpen: false,
      versionToRecord: '2026-08-29',
    })
  })

  it('opens and records when newer entries exist', () => {
    expect(resolveChangelogAutoOpen(entries, '2026-01-02')).toEqual({
      shouldOpen: true,
      versionToRecord: '2026-08-29',
    })
  })

  it('stays closed when the latest version was already seen', () => {
    expect(resolveChangelogAutoOpen(entries, '2026-08-29')).toEqual({
      shouldOpen: false,
      versionToRecord: null,
    })
  })
})
