# Limitations And Known Issues

Deliberate constraints and rough edges that are worth knowing before filing them as bugs.

## Product Scope

- Anime categories and anime song categories only.
  Character,
  staff,
  and manga categories are not implemented.
- English-only interface,
  no localization layer.
- Static hosting only,
  no backend,
  so all data is per-device and per-browser.
  Clearing site data deletes templates and selections.

## Filters

- AniList exposes a single `tagRank` argument for a tag query,
  not one threshold per tag.
  The app therefore has one `Minimum tag rank` field that applies to all selected tags.
  Per-tag thresholds would need client-side post-filtering or a different query strategy.
- A conflicting merge of the global and category filter,
  for example two disjoint format lists,
  yields an empty result set rather than an error.
  This is intentional,
  the picker states that nothing matched.
- Genre and tag suggestions depend on the AniList metadata request at startup.
  If it fails,
  the suggestion lists stay empty until the page is reloaded.

## Image Export

- Covers from image hosts without permissive CORS headers cannot be drawn
  and fall back to placeholders.
- There is no copy-to-clipboard button.
  Copying uses the browser's own `Copy Image` context menu entry on the preview.
- Long song metadata is truncated,
  the anime name first,
  then the song title and artist.

## Songs

- Song data depends on AnimeThemes coverage.
  An anime that AnimeThemes does not know has no selectable songs.
- Cached song data can be up to one week old,
  and only the 50 most recently used anime stay cached.
- Video previews stream directly from AnimeThemes.
  A failing video degrades the preview dialog only.

## UI

- On Firefox,
  category drag and drop uses SortableJS fallback mode,
  because the native drag preview of a card is oversized.
- The multi-select comboboxes have UX quirks:
  the popover can flip between above and below the input,
  and the scroll position resets after selecting an item.

## AniList Session

- The access token lives in `sessionStorage`,
  readable by JavaScript on the page,
  and is gone after closing the tab.
  This is a deliberate trade-off against `localStorage` persistence.
- A rejected or expired token forces a logout with a toast;
  the `My Anime` filters disappear until you reconnect.

## Worth Re-Checking Manually

Areas where automated tests do not cover the real behavior:

- narrow viewports between 360 px and 430 px,
  including dialogs and the mobile sheet,
- drag reordering on touch devices,
- exporting and re-importing a template,
  plus rejecting malformed and unsupported payloads,
- `#template=<encoded-url>` startup hydration and broken remote URLs,
- picker error and empty states with a failing network,
- PNG export in both themes,
  with missing covers and very long titles,
- reopening a song picker with an existing selection,
- native title language swapping.
