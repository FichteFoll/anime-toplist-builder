// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'

import { sanitizeAnimeDescriptionHtml } from '@/lib/anime-description'

describe('sanitizeAnimeDescriptionHtml', () => {
  it('preserves safe inline markup and escapes disallowed html', () => {
    expect(
      sanitizeAnimeDescriptionHtml(
        'A <i>stylish</i> story<br><script>alert(1)</script><a href="https://example.com">link</a>',
      ),
    ).toBe(
      'A <i>stylish</i> story<br>&lt;script&gt;alert(1)&lt;/script&gt;&lt;a href=&quot;https://example.com&quot;&gt;link&lt;/a&gt;',
    )
  })

  it('escapes raw angle brackets in plain text', () => {
    expect(sanitizeAnimeDescriptionHtml('2 < 3 and 5 > 4')).toBe('2 &lt; 3 and 5 &gt; 4')
  })
})
