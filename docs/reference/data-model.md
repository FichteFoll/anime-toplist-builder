# Data Model

The shared domain types live in `src/types`.
This page describes their meaning and the invariants that the rest of the app relies on.

## Template

```ts
interface Template {
  id: TemplateId
  name: string
  description: string
  categories: Category[]
  globalFilter: FilterState
  origin: TemplateOrigin
  version: TemplateVersion
}
```

- `id` is a stable internal identity,
  a UUID for new templates,
  a readable slug for predefined ones.
- `origin` is one of `predefined`,
  `user`,
  `imported-file`,
  `imported-url`.
  `predefined` and `imported-url` are protected and fork on edit.
- `version` is the schema version,
  currently `1`,
  and is also the version of the import and export payloads.
- `categories` is ordered,
  and that order is user-visible everywhere.

## Category

```ts
interface Category {
  id: CategoryId
  name: string
  description: string
  filter: FilterState
  entityKind: CategoryEntityKind
  songFilter: SongFilterState
}
```

- `id` is stable.
  Renames and reorders must never break stored selections,
  which is why selections are keyed by id and never by name.
- `entityKind` is `anime` or `song`.
  It belongs to the category definition,
  not to the selection payload.
- `filter` always applies to the AniList anime search,
  for both entity kinds.
- `songFilter` is `{ types: ThemeType[] }` with `ThemeType` in `OP`,
  `IN`,
  `ED`.
  An empty list means all types.

## FilterState

```ts
interface FilterState {
  yearRange?: NumericRange
  episodes?: NumericRange
  duration?: NumericRange
  popularity?: NumericRange
  seasons: AnimeSeason[]
  countryOfOrigin?: string
  tags: string[]
  excludedTags: string[]
  genres: string[]
  excludedGenres: string[]
  formats: AnimeFormat[]
  source: AnimeSource[]
  minimumTagRank?: number
  sort?: FilterSort
}
```

`NumericRange` is `{ minimum?: number, maximum?: number }`.
`FilterSort` is a field out of `POPULARITY`,
`SCORE`,
`TRENDING`,
`START_DATE`,
`TITLE`,
`UPDATED_AT`
plus a direction of `asc` or `desc`.

The same model is used for the global template filter and for category filters.
Array fields are always present,
never `undefined`,
and are normalized to a deterministic order.
Merge semantics are documented in [filters](../guide/filters.md).

## Selections

Selections are a discriminated union on `kind`,
so persistence,
cards,
and the export renderer can branch safely:

```ts
type CategorySelection = AnimeSelection | SongSelection
type CategorySelectionMap = Record<CategoryId, CategorySelection | null>
type TemplateSelectionsMap = Record<TemplateId, CategorySelectionMap>
```

- `AnimeSelection` carries `mediaId`,
  `title`,
  `coverImage`,
  and optional `season`,
  `seasonYear`,
  `format`.
- `SongSelection` carries `animeId`,
  `animeTitle`,
  `animeCoverImage`,
  and a `song` object with `id`,
  `type`,
  `slug`,
  `title`,
  `titleNative`,
  `artist`,
  optional raw `performances`,
  `videoLink`,
  and `episodes`.

A song is uniquely identified by its AniList anime id plus its AnimeThemes slug.
Both selection kinds store everything needed for rendering,
so no network request is required to display a saved list.

A selection whose `kind` does not match the category's `entityKind` is pruned,
which is what makes changing the entity kind discard the previous pick.
