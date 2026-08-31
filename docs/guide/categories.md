# Categories

Categories are the slots of a toplist,
for example `Anime Of The Year` or `Best Opening Sequence`.
They are ordered,
and that order is used everywhere,
including the exported image.

Each category has a stable internal id.
Renaming or moving a category never drops the selection stored for it,
because selections are keyed by that id and not by the name.

## What A Category Holds

- a name,
  which must not be blank,
- an optional description,
  shown as context in the editor and on the card,
- an entity kind,
  one of `Anime`,
  `Song`,
  `Character`,
  or `VoiceActor`,
- an anime filter,
  used for searching anime,
  see [filters](./filters.md),
- a song filter,
  only relevant for song categories,
- a character filter,
  a list of `CharacterRole` values to narrow which characters are offered,
  only relevant for character categories,
  with an empty list meaning every role,
- a voice-actor filter,
  a list of AniList `languageV2` values to narrow which voice credits are offered,
  only relevant for voice-actor categories,
  with an empty list meaning every language.

## Adding, Editing And Reordering

- `Add category` creates a new anime category at the end of the grid.
- The edit action on a card opens the category dialog for name,
  description,
  entity kind,
  filters,
  and the song type filter.
- The drag handle reorders categories.
  On Firefox a fallback drag mode is used,
  see [limitations](../reference/limitations.md).

Editing a category of a protected template forks the template first,
see [fork on edit](./templates.md#fork-on-edit).

## Changing The Entity Kind

The entity kind is part of the category definition.
A stored selection that no longer matches the category kind is discarded,
because an anime pick cannot be converted into a song pick,
a character pick,
or a voice-actor pick,
or the other way around.

When a category already holds a selection,
changing its entity kind in the editor opens a confirmation dialog first,
naming the stored selection and both entity kinds,
for example
`Changing this category from Anime to Character discards the saved selection "<label>". It cannot be converted.`
Confirming applies the new kind and discards the selection.
Cancelling keeps the dialog open with the drafted kind still selected,
so further edits are not lost.
The kind changes immediately, without a prompt,
when the category has no stored selection.

## Deleting

Deleting a category asks for confirmation when it would lose work,
that is when the category has a stored selection
or a non-empty filter.
The prompt names what will be lost,
the number of custom rules and the saved selection.
Empty categories are deleted without a prompt.

## What The Cards Show

### Anime categories

The card shows the category name,
the cover image of the selected anime or a placeholder,
and the anime title in the configured title language.
A clear action removes the selection.

### Song categories

The card uses the anime cover as its image and renders three lines:

```text
<song title>
by <artist>
from <anime name> (<slug>, <episodes>)
```

The episode hint is omitted when the song plays for the whole run,
which AnimeThemes expresses as `1-`.
The slug is kept because it is part of the song identity.

### Character categories

The card uses the character image as its primary image,
with the anime cover as a small inset
in the lower right of the image slot.
The character image shrinks to make room for it,
and the inset reaches past the character image's edge
rather than covering a corner of it:

```text
+-------------+    Rem
|             |    Main character
|  character  |    in Re:Zero kara Hajimeru
|    image    |       Isekai Seikatsu
|             |
|          +-------+
|          | anime |
+----------| cover |
           +-------+
```

Below the character name,
the relation line reads `<Role> character in <anime>`,
for example `Main character in Re:Zero kara Hajimeru Isekai Seikatsu`,
or `Character in <anime>` when AniList reports no role.
A clear action removes the selection.

### Voice-actor categories

The card uses the voice actor image as its primary image,
with two insets side by side along the bottom of the image slot,
the character left of the anime cover.
The voice actor image shrinks to make room for them,
and both insets reach past its lower edge:

```text
+-------------+    Rie Takahashi
|             |    Voiced Rem
|    voice    |    in Re:Zero kara Hajimeru
|    actor    |       Isekai Seikatsu
|    image    |    Japanese
|             |
+--+-------+--+----+
   | chara | | anime |
   | cter  | | cover |
   +-------+ +-------+
```

Below the voice actor name,
the relation line reads `Voiced <character> in <anime>`,
and the credited language,
for example `Japanese`,
sits on its own muted line beneath it
when the credit reports one.
A clear action removes the selection.

## Title Language

The title language chosen in the account menu applies to anime titles
and to song titles.

For anime,
the preferred language is used when available,
with a fallback to what AniList provides.

For songs:

- in `Romaji` or `English` mode the transliterated title is primary
  and the native title is shown as a tooltip when both exist,
- in `Native` mode the two swap,
- when only one of the two exists it is shown without a tooltip,
- when neither exists the title renders as `N/A`.

Anime names inside song cards always use the normal anime title resolution.
