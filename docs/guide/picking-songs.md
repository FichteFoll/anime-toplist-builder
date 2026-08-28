# Picking Songs

A song category selects one anime song,
an opening,
insert,
or ending.
Songs always keep their anime relation,
so picking one is a two-step flow.

## The Two Steps

The picker shows a stepper with `Select anime` and `Select song`.

1. Step one is the normal anime search,
   with the same filters,
   sorting,
   pagination,
   and states as the [anime picker](./picking-anime.md).
2. Step two lists the songs of the chosen anime.

Rules:

- the dialog always opens on step one,
- step two is disabled until an anime is available,
- selecting an anime result advances to step two immediately
  and starts loading its songs,
- reopening a category that already has a song enables step two right away,
  with the previously selected anime highlighted in step one
  and the stored song marked as selected,
- going back to step one keeps the current song
  until a different song is actually picked.

On wide dialogs step two shows the anime summary next to the song list.
On narrow dialogs the summary moves above the list.

## Song List

Each row renders as:

```text
<song title> by <artist> (<slug>, <episodes>)
```

with the native title as a tooltip according to the
[title language rules](./categories.md#title-language).
Multiple performers are joined with commas and a final `&`,
and a credited alias is rendered as `<artist> (as: <alias>)`.

Episode hints are guidance about where a song plays,
for example `2-12, 14`.
A song that plays for the whole run reports `1-`,
which is treated as always and therefore omitted.

A song with a video link shows an encircled play button on the left of the row.
Rows without a video keep an empty slot there so the columns stay aligned.
The preview opens a dialog with the video,
titled `<song title> by <artist>` and subtitled with the anime,
slug,
and episode hint.
If the remote video cannot be played,
the dialog degrades instead of breaking the picker.

## Song Type Filter

The song types of interest,
`OP`,
`IN`,
and `ED`,
are part of the category definition and are edited in the category dialog,
not in the picker.
An empty selection allows all types.
Filtering happens on the client,
so switching types never triggers a new request.

When an anime has no song matching the configured types,
step two states that no songs matched the current theme filter.
A failed request offers `Retry songs`.

## Where Song Data Comes From

Songs are looked up on AnimeThemes by the AniList id of the chosen anime.
The app always requests all song types for that anime and narrows on the client,
which keeps the cache useful across categories with different type filters.

Responses are cached in local storage:
one entry per anime,
expiring after one week,
with only the 50 most recently used anime kept.
A cache hit refreshes recency,
so frequently used anime stay cached.
Incomplete data,
for example a theme without performer information,
is kept as partial data rather than treated as an error.

AnimeThemes is credited in the page footer.
