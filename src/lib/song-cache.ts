import type { AnimeThemesAnimeSongs } from '@/api/animethemes'

import { getBrowserStorage } from '@/lib/persistence'

const songCacheStorageKey = 'anime-toplist-builder.song-cache'
const songCacheSchemaVersion = 2 as const
const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000
const maxSongCacheEntries = 50

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type JsonRecord = Record<string, unknown>

interface StoredSongCacheEntry {
  value: AnimeThemesAnimeSongs
  fetchedAt: number
  lastAccessedAt: number
}

interface StoredSongCacheRecord {
  schemaVersion: typeof songCacheSchemaVersion
  entries: Record<string, StoredSongCacheEntry>
}

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const readCacheRecord = (storage: BrowserStorage | null): StoredSongCacheRecord | null => {
  if (!storage) {
    return null
  }

  const serializedValue = storage.getItem(songCacheStorageKey)

  if (!serializedValue) {
    return null
  }

  try {
    const parsedValue = JSON.parse(serializedValue) as unknown

    if (!isRecord(parsedValue) || parsedValue.schemaVersion !== songCacheSchemaVersion || !isRecord(parsedValue.entries)) {
      return null
    }

    return {
      schemaVersion: songCacheSchemaVersion,
      entries: Object.fromEntries(
        Object.entries(parsedValue.entries).filter(([, entry]) => {
          if (!isRecord(entry)) {
            return false
          }

          return isFiniteNumber(entry.fetchedAt) && isFiniteNumber(entry.lastAccessedAt) && isRecord(entry.value)
        }),
      ) as Record<string, StoredSongCacheEntry>,
    }
  } catch {
    return null
  }
}

const writeCacheRecord = (storage: BrowserStorage | null, record: StoredSongCacheRecord | null) => {
  if (!storage) {
    return
  }

  if (!record || Object.keys(record.entries).length === 0) {
    storage.removeItem(songCacheStorageKey)
    return
  }

  storage.setItem(songCacheStorageKey, JSON.stringify(record))
}

const pruneCacheEntries = (entries: Record<string, StoredSongCacheEntry>, now: number) => {
  const freshEntries = Object.entries(entries)
    .filter(([, entry]) => now - entry.fetchedAt <= oneWeekInMilliseconds)
    .sort((left, right) => right[1].lastAccessedAt - left[1].lastAccessedAt)
    .slice(0, maxSongCacheEntries)

  return Object.fromEntries(freshEntries)
}

export const loadCachedAnimeSongs = (
  animeId: number,
  storage = getBrowserStorage(),
  now = Date.now(),
) => {
  const record = readCacheRecord(storage)

  if (!record) {
    return null
  }

  const entries = pruneCacheEntries(record.entries, now)
  const cacheEntry = entries[String(animeId)]

  if (!cacheEntry) {
    writeCacheRecord(storage, {
      schemaVersion: songCacheSchemaVersion,
      entries,
    })

    return null
  }

  const nextEntries = {
    ...entries,
    [animeId]: {
      ...cacheEntry,
      lastAccessedAt: now,
    },
  }

  writeCacheRecord(storage, {
    schemaVersion: songCacheSchemaVersion,
    entries: pruneCacheEntries(nextEntries, now),
  })

  return cacheEntry.value
}

export const saveCachedAnimeSongs = (
  value: AnimeThemesAnimeSongs,
  storage = getBrowserStorage(),
  now = Date.now(),
) => {
  const record = readCacheRecord(storage)
  const entries = pruneCacheEntries(record?.entries ?? {}, now)

  writeCacheRecord(storage, {
    schemaVersion: songCacheSchemaVersion,
    entries: pruneCacheEntries(
      {
        ...entries,
        [value.animeId]: {
          value,
          fetchedAt: now,
          lastAccessedAt: now,
        },
      },
      now,
    ),
  })
}
