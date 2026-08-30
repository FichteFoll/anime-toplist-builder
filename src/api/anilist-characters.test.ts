import { afterEach, describe, expect, it, vi } from 'vitest'

import { CharacterRole } from '@/types'

import { fetchAnimeCharacterCredits } from './anilist-characters'
import { fetchAnimeCharacterCreditsQuery } from './anilist-queries'

const pageInfoPayload = {
  currentPage: 1,
  hasNextPage: false,
  lastPage: 1,
  perPage: 25,
  total: 1,
}

const createEdge = (overrides: Record<string, unknown> = {}) => ({
  role: 'MAIN',
  node: {
    id: 118737,
    name: { userPreferred: 'Rem', native: 'レム' },
    image: {
      large: 'https://example.test/character/large.jpg',
      medium: 'https://example.test/character/medium.jpg',
    },
  },
  voiceActors: [],
  ...overrides,
})

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

const readRequest = (fetchMock: ReturnType<typeof stubFetch>) => {
  const [url, requestInit] = fetchMock.mock.calls[0] ?? []
  const body = JSON.parse(String(requestInit?.body)) as {
    query: string
    variables: Record<string, unknown>
  }

  return {
    url,
    headers: requestInit?.headers as Record<string, string> | undefined,
    query: body.query,
    variables: body.variables,
  }
}

const stubCredits = (edges: Array<unknown>) =>
  stubFetch({
    data: {
      Media: {
        id: 21,
        characters: {
          pageInfo: pageInfoPayload,
          edges,
        },
      },
    },
  })

describe('fetchAnimeCharacterCredits', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests the credits query with the default paging variables', async () => {
    const fetchMock = stubCredits([createEdge()])

    await fetchAnimeCharacterCredits({ animeId: 21 })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const request = readRequest(fetchMock)

    expect(request.url).toBe('https://graphql.anilist.co')
    expect(request.query).toBe(fetchAnimeCharacterCreditsQuery)
    expect(request.variables).toEqual({ id: 21, page: 1, perPage: 25 })
    expect(request.headers?.Authorization).toBeUndefined()
  })

  it('sends the requested page and the access token', async () => {
    const fetchMock = stubCredits([createEdge()])

    await fetchAnimeCharacterCredits({
      animeId: 21,
      page: 3,
      perPage: 10,
      accessToken: 'token-value',
    })

    const request = readRequest(fetchMock)

    expect(request.variables).toEqual({ id: 21, page: 3, perPage: 10 })
    expect(request.headers?.Authorization).toBe('Bearer token-value')
  })

  it('maps every voice actor of a credit with its language', async () => {
    stubCredits([
      createEdge({
        voiceActors: [
          {
            id: 95159,
            name: { userPreferred: 'Rie Takahashi', native: '高橋李依' },
            image: {
              large: 'https://example.test/staff/large.jpg',
              medium: 'https://example.test/staff/medium.jpg',
            },
            languageV2: 'Japanese',
          },
          {
            id: 118458,
            name: { userPreferred: 'Brianna Knickerbocker', native: null },
            image: { large: null, medium: null },
            languageV2: null,
          },
        ],
      }),
    ])

    const response = await fetchAnimeCharacterCredits({ animeId: 21 })

    expect(response.pageInfo).toEqual(pageInfoPayload)
    expect(response.credits).toHaveLength(1)

    const [credit] = response.credits

    expect(credit.characterId).toBe(118737)
    expect(credit.name).toBe('Rem')
    expect(credit.nativeName).toBe('レム')
    expect(credit.role).toBe(CharacterRole.Main)
    expect(credit.voiceActors).toEqual([
      {
        voiceActorId: 95159,
        name: 'Rie Takahashi',
        nativeName: '高橋李依',
        image: {
          large: 'https://example.test/staff/large.jpg',
          medium: 'https://example.test/staff/medium.jpg',
        },
        language: 'Japanese',
      },
      {
        voiceActorId: 118458,
        name: 'Brianna Knickerbocker',
        nativeName: null,
        image: { large: '', medium: null },
        language: null,
      },
    ])
  })

  it('falls back to the medium image and finally to an empty string', async () => {
    stubCredits([
      createEdge({
        node: {
          id: 1,
          name: { userPreferred: 'Medium Only', native: null },
          image: { large: null, medium: 'https://example.test/character/medium.jpg' },
        },
      }),
      createEdge({
        node: {
          id: 2,
          name: { userPreferred: 'No Image', native: null },
          image: { large: null, medium: null },
        },
      }),
    ])

    const response = await fetchAnimeCharacterCredits({ animeId: 21 })

    expect(response.credits.map((credit) => credit.image)).toEqual([
      { large: 'https://example.test/character/medium.jpg', medium: 'https://example.test/character/medium.jpg' },
      { large: '', medium: null },
    ])
  })

  it('maps an unknown role to null', async () => {
    stubCredits([createEdge({ role: 'NARRATOR' })])

    const response = await fetchAnimeCharacterCredits({ animeId: 21 })

    expect(response.credits[0]?.role).toBeNull()
  })

  it('returns an empty credit list for an unknown anime', async () => {
    stubFetch({ data: { Media: null } })

    const response = await fetchAnimeCharacterCredits({ animeId: 404, page: 3, perPage: 10 })

    expect(response.credits).toEqual([])
    expect(response.pageInfo).toEqual({
      currentPage: 3,
      hasNextPage: false,
      lastPage: 1,
      perPage: 10,
      total: 0,
    })
  })
})
