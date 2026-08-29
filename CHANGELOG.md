# Changelog

User-facing changes, newest first.
The app shows these entries in its changelog popup.

## 2026-08-29

- The page header and the template card are now one sticky toolbar
  that stays visible while the page scrolls.
  Settings and the AniList account moved behind a single button
  that shows your avatar once an account is connected.
- Countries of origin can now be filtered by more than one country at a time.
- Song lookups work again:
  AnimeThemes changed its API and every song query had been failing.
- The image export dialog shows a spinner while the first preview renders,
  and its download bar no longer lets content scroll through it.
- Menu entries no longer flash as highlighted when a menu opens.
- The category delete button now tints red on hover,
  like the other destructive actions.
- Exported images fit their text:
  cards grow to hold the text they were given,
  lines are allocated from measured text metrics instead of fixed caps,
  and wrapping is script-aware,
  so titles without spaces such as Japanese ones wrap
  and emoji are never split.
- The project now ships usage and reference documentation under `docs/`.
