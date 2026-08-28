# Filters

Filters decide which anime can be picked.
There is one filter model,
used in two places:

- the global filter,
  edited through `Edit template`,
  which applies to every category,
- the category filter,
  edited in the category dialog,
  which refines the global filter for that one category.

A search inside a picker adds a title search on top,
without changing either stored filter.

## Filter Fields

- `Release year`:
  minimum and maximum release year.
- `Season`:
  one or more of winter,
  spring,
  summer,
  fall.
- `Formats`:
  TV,
  TV short,
  movie,
  special,
  OVA,
  ONA,
  music.
- `Source material`:
  original,
  manga,
  light novel,
  visual novel,
  video game,
  novel,
  web novel,
  doujinshi,
  anime,
  live action,
  other.
- `Genres`:
  included and excluded genres,
  suggested from AniList metadata.
- `Tags`:
  included and excluded tags,
  suggested from AniList metadata.
- `Country of origin`:
  one or more of China,
  Japan,
  South Korea,
  Taiwan.
- `Popularity`:
  minimum and maximum.
- `Minimum tag rank`:
  one threshold from 1 to 100 that applies to all selected tags,
  see [limitations](../reference/limitations.md).
- `Episode count`:
  minimum and maximum.
- `Duration`:
  minimum and maximum,
  in minutes.
- `Sort`:
  one of popularity,
  score,
  trending,
  start date,
  title,
  updated at,
  ascending or descending.
  A category with no sort inherits the template order;
  a template with no sort leaves the AniList default order in place.

Sort,
country of origin,
popularity,
minimum tag rank,
episode count,
and duration sit behind `Advanced filters` in the editor.

Genre and tag suggestions come from AniList metadata that is loaded once at startup.
If that request fails a toast is shown and the suggestion lists stay empty,
while everything else keeps working.

## How Global And Category Filters Combine

The effective filter of a category is the intersection of the global filter
and the category filter.
Category filters therefore narrow,
they never widen.
Fields that the global filter already fixes are disabled in the category editor,
with a tooltip that explains why.

The merge rules are:

- numeric ranges intersect,
  the higher minimum and the lower maximum win,
- multi-value lists,
  such as country of origin,
  intersect,
- exclusions are unioned and win over inclusions,
  an excluded value is removed from the included list,
- lists are deduplicated and sorted deterministically,
  so the same filter always produces the same query,
- the category sort replaces the template sort,
  and a category without a sort inherits it,
- the higher minimum tag rank wins.

When the intersection is empty,
for example a global `Movie` format against a category `TV` format,
the merge is a conflict.
The picker then legitimately returns no results
rather than silently ignoring one of the two filters.

Search text is trimmed before use,
and an empty search means no title constraint.
