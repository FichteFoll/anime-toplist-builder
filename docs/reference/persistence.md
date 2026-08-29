# Persistence

All user data lives in the browser of the device in use.
There is no server-side state.
Storage handling is centralized in `src/lib/persistence.ts`
and `src/lib/song-cache.ts`;
stores call those helpers instead of parsing records themselves.

## Local Storage Records

| Key | Schema | Contents |
| --- | --- | --- |
| `anime-toplist-builder.templates.v1` | 1 | local templates, their origin, and the remote URL of URL imports |
| `anime-toplist-builder.settings.v1` | 1 | theme, title language, last opened template, export author, hide-author flag, last shown changelog version |
| `anime-toplist-builder.selections.v1` | 1 | selections per template id and category id |
| `anime-toplist-builder.song-cache` | 2 | cached AnimeThemes responses per AniList anime id |

Predefined templates are not stored.
They are shipped in the bundle and registered at startup,
so an app update can change them.

## Session Storage Records

| Key | Contents |
| --- | --- |
| `anime-toplist-builder.anilist-auth` | AniList access token, username, avatar URL, expiry |
| `anime-toplist-builder.anilist-oauth-state.v1` | OAuth state value for the pending login |

`sessionStorage` is scoped to the tab,
which is why an AniList session survives a reload but not a new tab.

## Rules

- Template structure and selections are persisted separately,
  so editing a template never rewrites picks and the other way around.
- Selections are keyed by template id and category id.
  Names are never keys.
- Every record carries an explicit schema version,
  and unknown or malformed records are ignored rather than repaired by guesswork.
- Migrations and normalization live in `src/lib` helpers,
  never hidden inside components.
- Selections are pruned against the current templates:
  entries for unknown categories are dropped,
  and entries whose kind no longer matches the category's entity kind are dropped.
- Deleting a template deletes its selections.
- Forking a template duplicates its selections to the fork.
- The last shown changelog version is optional,
  and its absence is what marks a first visit on this device.

## Song Cache

- One entry per AniList anime id,
  holding the normalized song list plus fetch and last-access timestamps.
- Entries expire one week after they were fetched.
- At most 50 entries are kept,
  the least recently accessed are evicted first.
- A cache hit updates recency,
  not just a network fetch.
- Full song lists are cached,
  never filter-specific subsets,
  so categories with different song type filters share one entry.
