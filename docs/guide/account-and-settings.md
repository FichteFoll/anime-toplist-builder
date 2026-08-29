# Account And Settings

The account and preferences menu sits at the right end of the toolbar.
It shows your AniList avatar when connected,
and a cog icon otherwise.
Both open the same menu.

## Optional AniList Connection

The app is fully usable without logging in.
Connecting an AniList account only adds:

- the `Hide My Anime` and `Only Show My Anime` picker filters,
  see [picking anime](./picking-anime.md#my-anime-filters),
- your avatar in the toolbar,
  with the username in a tooltip,
- your username as the default author for image exports.

Connecting uses the AniList OAuth2 implicit grant,
which suits a backend-less app because the token is returned straight to the browser.
The token is:

- kept in `sessionStorage`,
  so it survives a reload in the same tab but not a new tab or a browser restart,
- readable by JavaScript running on the page,
  which is why it is deliberately not stored in `localStorage`,
- cleared on disconnect,
  when it expires,
  and when AniList rejects it.

An expired or rejected session logs you out and explains it in a toast,
for example `Your AniList session expired. Connect AniList again to keep using My Anime filters.`
Auth state is never written into templates or selections,
so nothing you export depends on being logged in.

Connecting requires a registered AniList client id and an exactly matching redirect URI,
see [configuration](../reference/configuration.md).
When no client id is configured,
the connect action is not offered.

## Preferences

The menu holds:

- `Title language`:
  `Romaji`,
  `English`,
  or `Native`.
  It applies to search results,
  category cards,
  and the exported image,
  see the [title language rules](./categories.md#title-language).
- `Theme`:
  `System`,
  `Light`,
  or `Dark`.
  The exported image follows the currently active theme.

Both preferences are stored per device,
together with the last opened template and the export author settings,
see [persistence](../reference/persistence.md).

### Changelog

The menu also holds a `What's new` action
that opens the changelog popup on demand.
The popup also opens by itself
when the app has entries newer than the version last shown on this device,
and entries newer than that version are marked `New`.
Nothing is shown on a first visit,
because the app is used as-is then.
The version last shown is stored per device,
see [persistence](../reference/persistence.md).
