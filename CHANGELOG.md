# Changelog

User-facing changes, newest first.
The app shows these entries in its changelog popup.

## Unreleased

- Categories can now pick a character of an anime,
  or a voice actor credited for a character,
  in addition to anime and song categories.
  Both are picked anime-first:
  choose an anime,
  then a character from it,
  or one of its voice credits.
- Character and voice-actor cards now show the related anime as a small inset
  overlapping their primary image,
  and a voice-actor card also shows the character as a second inset,
  in the app and in the exported image,
  without changing the size of any card.
- Changing a category's type now asks for confirmation before discarding
  its saved selection,
  since a pick cannot be converted between entity kinds.
- The predefined **Crunchyroll Anime Awards 2025** template now uses the new
  character and voice-artist category types for its four matching categories,
  which discards any anime already picked for them.

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
