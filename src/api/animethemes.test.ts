import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchAnimeSongs } from './animethemes'

const themesPayload = {
  data: {
    findAnimeByExternalSite: [
      {
        title: {
          romaji: 'Kaubooi Bibappu',
          english: 'Cowboy Bebop',
          native: 'カウボーイビバップ',
        },
        animethemes: [
          {
            id: 1,
            type: 'OP',
            slug: 'OP1',
            animethemeentries: [
              {
                episodes: '1-25',
                videos: {
                  nodes: [
                    {
                      link: 'https://v.animethemes.moe/CowboyBebop-OP1.webm',
                      resolution: 1080,
                      audio: { path: 'audio/CowboyBebop-OP1.ogg' },
                    },
                  ],
                },
              },
            ],
            song: {
              title: { romaji: 'Tank!', native: 'Tank!（ネイティブ）' },
              performances: [
                {
                  artist: { name: { main: 'The Seatbelts' } },
                  as: 'Seatbelts',
                },
              ],
            },
          },
        ],
      },
    ],
  },
}

const stubFetch = (payload: unknown) => {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

const readRequestQuery = (fetchMock: ReturnType<typeof stubFetch>) => {
  const requestInit = fetchMock.mock.calls[0]?.[1]
  const body = JSON.parse(String(requestInit?.body)) as { query: string }

  return body.query
}

describe('fetchAnimeSongs', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('normalizes the new AnimeThemes title and name shapes', async () => {
    stubFetch(themesPayload)

    const result = await fetchAnimeSongs({
      animeId: 1,
      animeTitle: {
        userPreferred: 'Cowboy Bebop',
        romaji: 'Cowboy Bebop',
        english: 'Cowboy Bebop',
        native: 'カウボーイビバップ',
      },
    })

    expect(result.songs).toHaveLength(1)

    const [song] = result.songs

    expect(song.title).toBe('Tank!')
    expect(song.titleNative).toBe('Tank!（ネイティブ）')
    expect(song.artist).toBe('The Seatbelts (as: Seatbelts)')
    expect(song.performances).toEqual([{ artist: 'The Seatbelts', as: 'Seatbelts' }])
    expect(song.videoLink).toBe('https://v.animethemes.moe/CowboyBebop-OP1.webm')
    expect(song.videoHeight).toBe(1080)
    expect(song.episodes).toBe('1-25')
  })

  it('selects the nested title and name fields in the query', async () => {
    const fetchMock = stubFetch(themesPayload)

    await fetchAnimeSongs({ animeId: 1 })

    const query = readRequestQuery(fetchMock)

    expect(query).toContain('title {')
    expect(query).toContain('romaji')
    expect(query).toContain('native')
    expect(query).toContain('name {')
    expect(query).not.toContain('titleNative')
    expect(query).not.toMatch(/artist\s*\{\s*name\s*\}/)
    // The stub answers any query, so the query text is the only place
    // a stale selection set can be caught.
    expect(query).toMatch(/song\s*\{[\s\S]*?\btitle\s*\{/)
    expect(query).not.toMatch(/^\s*name\s*$/m)
  })

  it('builds the fallback anime title from the response title object', async () => {
    stubFetch(themesPayload)

    const result = await fetchAnimeSongs({ animeId: 1 })

    expect(result.animeTitle).toEqual({
      userPreferred: 'Kaubooi Bibappu',
      romaji: 'Kaubooi Bibappu',
      english: 'Cowboy Bebop',
      native: 'カウボーイビバップ',
    })
  })
})
