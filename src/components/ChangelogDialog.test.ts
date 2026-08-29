// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'

import ChangelogDialog from '@/components/ChangelogDialog.vue'
import type { ChangelogEntry } from '@/types'

const entries: Array<ChangelogEntry> = [
  {
    version: '2026-08-29',
    items: [
      {
        spans: [
          { kind: 'text', text: 'Documentation now lives under ' },
          { kind: 'code', text: 'docs/' },
          { kind: 'text', text: ', powered by ' },
          { kind: 'link', text: 'AniList', href: 'https://anilist.co/' },
          { kind: 'text', text: '.' },
        ],
      },
    ],
  },
  {
    version: '2026-01-01',
    items: [
      { spans: [{ kind: 'text', text: 'Countries of origin can be filtered.' }] },
    ],
  },
]

const mountDialog = async (seenVersion: string | null) => {
  const wrapper = mount(ChangelogDialog, {
    attachTo: document.body,
    props: { open: true, entries, seenVersion },
  })

  await nextTick()
  await nextTick()

  return wrapper
}

const entryElement = (version: string) => {
  const element = document.querySelector<HTMLElement>(`[data-changelog-version="${version}"]`)

  if (element === null) {
    throw new Error(`No changelog entry rendered for ${version}`)
  }

  return element
}

describe('ChangelogDialog', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders every entry with its items', async () => {
    const wrapper = await mountDialog('2026-01-01')

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')

    expect(dialog?.textContent).toContain('2026-08-29')
    expect(dialog?.textContent).toContain('2026-01-01')
    expect(dialog?.textContent).toContain('Documentation now lives under docs/, powered by AniList.')
    expect(dialog?.textContent).toContain('Countries of origin can be filtered.')

    wrapper.unmount()
  })

  it('marks only the unseen entries as new', async () => {
    const wrapper = await mountDialog('2026-01-01')

    const badges = document.querySelectorAll('[data-testid="changelog-new-badge"]')

    expect(badges).toHaveLength(1)
    expect(entryElement('2026-08-29').querySelector('[data-testid="changelog-new-badge"]')).not.toBeNull()
    expect(entryElement('2026-01-01').querySelector('[data-testid="changelog-new-badge"]')).toBeNull()

    wrapper.unmount()
  })

  it('renders code and link spans as their own elements', async () => {
    const wrapper = await mountDialog('2026-01-01')

    const code = document.querySelector<HTMLElement>('[role="dialog"] code')
    const link = document.querySelector<HTMLAnchorElement>('[role="dialog"] a[href="https://anilist.co/"]')

    expect(code?.textContent).toBe('docs/')
    expect(link?.textContent?.trim()).toBe('AniList')
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noreferrer noopener')

    wrapper.unmount()
  })

  it('marks nothing as new on a first visit', async () => {
    const wrapper = await mountDialog(null)

    expect(document.querySelectorAll('[data-testid="changelog-new-badge"]')).toHaveLength(0)

    wrapper.unmount()
  })
})
