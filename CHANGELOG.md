# Changelog

User-facing changes, newest first.
The app shows these entries in its changelog popup.

## Unreleased

- The Dark Reader browser extension now leaves the app alone,
  so its own dark theme is used instead of a generated one.
- Scrolling and zooming is much smoother on mobile.
  The header, the category section and the category cards
  no longer blur the page behind them,
  and cover images now load only once they come into view.

## 2026-08-31

- Added character and voice-actor categories.
  Both are picked anime-first:
  choose an anime,
  then a character from it,
  or one of its voice credits.
- Character and voice-actor cards show the anime they come from
  as a small inset beside their primary image,
  and a voice-actor card also shows the character as a second inset,
  in the app and in the exported image.
- Changing a category's type now asks for confirmation before discarding
  its saved selection,
  since a pick cannot be converted between entity kinds.
- The predefined **Crunchyroll Anime Awards 2025** template now uses the new
  character and voice-artist category types
  for its five character and voice-artist categories,
  which discards any anime already picked for them.
- Native-title tooltips now appear next to the name they belong to
  instead of floating in the middle of the row.
  This affected song titles in the song picker
  and the selected entry's title on a category card.

## 2026-08-29

- The page header and the template card are now one sticky toolbar
  that stays visible while the page scrolls.
  Settings and the AniList account moved behind a single button
  that shows your avatar once an account is connected.
- Countries of origin can now be filtered by more than one country at a time.
- Updated to upstream AnimeThemes API changes.
- The image export dialog shows a spinner while the first preview renders,
  and its download bar no longer lets content scroll through it.
- Menu entries no longer flash as highlighted when a menu opens.
- Exported images fit their text:
  cards grow to hold the text they were given,
  lines are allocated from measured text metrics instead of fixed caps,
  and wrapping is script-aware,
  so titles without spaces such as Japanese ones wrap
  and emoji are never split.
