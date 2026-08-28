# Picking Anime

Clicking a category's image area opens the picker for that category.
For anime categories this is the anime picker.
Song categories start from the same anime search,
see [picking songs](./picking-songs.md).

## Search Behavior

- Results are already loaded when the dialog opens,
  using the effective filter of that category and its sort order.
- The search box matches anime titles and is debounced by 250 ms,
  so typing does not fire a request per keystroke.
- A summary above the results lists the filters currently in effect,
  so it is visible why a result set is narrow.
- The sort control changes the order for this picker session.
  It starts from the category sort,
  falling back to the template order.
- Pagination uses a page size of 15,
  with next and previous controls.

## Result Cards

Each result shows the cover image,
the title in the configured title language,
the release year,
and the format.
Clicking a card stores it as the selection for the category and closes the picker.
The currently selected anime is highlighted when the picker is reopened.

## States

- While the first page loads,
  placeholder cards are shown.
- On a failed request,
  the error message from AniList is shown together with a `Retry search` button.
- When the query succeeded but matched nothing,
  the picker states that no anime matched the current effective filters and search term.

## My Anime Filters

When AniList is connected,
the picker offers two extra filters:

- `Hide My Anime`,
  excludes everything on your AniList lists,
- `Only Show My Anime`,
  restricts results to your AniList lists.

Rules:

- they are mutually exclusive,
  selecting one clears the other,
- they are shared state,
  so they apply to every category picker in the session,
- they are off by default,
- they are hidden while not connected,
  and reset when you disconnect,
- they are never written into templates or category filters,
  so an exported template does not depend on your account.

See [account and settings](./account-and-settings.md) for connecting.
