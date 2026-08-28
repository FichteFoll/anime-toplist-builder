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
  either `Anime` or `Song`,
- an anime filter,
  used for searching anime,
  see [filters](./filters.md),
- a song filter,
  only relevant for song categories.

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
because an anime pick cannot be converted into a song pick or the other way around.

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
