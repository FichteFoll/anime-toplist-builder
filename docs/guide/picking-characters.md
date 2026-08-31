# Picking Characters And Voice Actors

A character category selects a character of an anime.
A voice-actor category selects a voice actor credited for a character of an anime.
Both stay anime-first,
because the anime relation is part of what the card shows.

## Character: The Two Steps

The picker shows a stepper with `Select anime` and `Select character`.

1. Step one is the normal anime search,
   with the same filters,
   sorting,
   pagination,
   and states as the [anime picker](./picking-anime.md).
2. Step two lists the characters of the chosen anime,
   filtered by the category's role filter,
   with an empty filter meaning every role.

Rules:

- the dialog always opens on step one,
- step two is disabled until an anime is available,
- selecting an anime result advances to step two immediately
  and starts loading its characters,
- reopening a category that already has a character enables step two right away,
  with the previously selected anime highlighted in step one
  and the stored character marked as selected,
- going back to step one keeps the current character
  until a different character is actually picked.

Each row in step two shows the character image,
the character name,
with the alternate name as a tooltip when both exist,
and the character's role.

## Voice Actor: The Two Steps

The voice-actor picker follows the same anime-first shape,
with a stepper reading `Select anime` and `Select voice actor`.

1. Step one is the same anime search as above.
2. Step two lists a flat row per character-and-voice-actor pair,
   filtered by the category's language filter,
   with an empty filter meaning every language.
   A character voiced by two actors, for example in two dubs,
   appears as two rows.

Each row shows the voice actor image and name,
`as <character>` with the character's role,
and the credited language.
The character comes with the credit,
so picking a row stores the voice actor,
the character,
and the anime together.

Reopening a category that already has a voice actor
restores the anime in step one
and marks the stored voice-actor-and-character row as selected,
the same way the character picker restores its stored row.

A category that already holds a pick opens on step two,
where that pick is,
rather than on the anime search.
Step two keeps the chosen anime in a panel on the left,
beside the credit list,
the way the song picker does.

## Where Character And Voice-Actor Data Comes From

Both pickers fetch character and voice credits from AniList
for the anime chosen in step one.
Unlike songs,
credits are not cached in local storage across page loads:
the picker keeps the credits of the anime it has already fetched
only in memory for the lifetime of the dialog,
so reopening the picker on the same anime later refetches it.

AniList returns at most 25 credits per request,
so a large cast arrives one page at a time.
The picker loads the next page
as the list nears its end,
and a `Load more characters` or `Load more voice actors` button
below the list does the same without scrolling.
When the category's role or language filter
excludes every credit fetched so far,
the picker keeps loading further pages on its own
until a match appears or the credits run out,
so a filter that matches nothing on the first page
never shows an empty list while more credits remain.

AniList does not publish an enum for voice-credit languages,
so the language filter accepts any non-empty value,
and the language shortlist offered in the category editor
is not an exhaustive list of what AniList can report.
