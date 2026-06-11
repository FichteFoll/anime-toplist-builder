# Song Categories Plan

## Goal

Add category support for selecting songs that belong to an anime,
while keeping anime categories working as they do today.

The new entity type is `song`.
Songs are discovered through AnimeThemes,
not AniList,
but every song remains tied to an anime by AniList media id.

## Documentation Sources

- AnimeThemes GraphQL intro:
  https://api-docs.animethemes.moe/graphql/intro/
- AnimeThemes GraphQL endpoint:
  `https://graphql.animethemes.moe/graphql`

### GraphQL query with all needed fields

```graphql
query ThemesQuery($anilistIds: [Int!]) {
  findAnimeByExternalSite(site: ANILIST, id: $anilistIds) {
    name
    animethemes {
      type
      slug
      animethemeentries {
        episodes
        videos {
          nodes {
            link
            audio {
              path
            }
          }
        }
      }
      song {
        performances {
          artist {
            name
          }
          as
        }
        title
        titleNative
      }
    }
  }
}
```

## Product Rules

- Keep existing anime-category behavior intact.
- Add a new category entity type `song`.
- A song category still starts by searching anime through the existing AniList search flow.
- Song lookup happens only after the user picks an anime search result.
- Songs are filtered separately from anime filters.
- The only song-specific filter in scope is theme type:

  - `OP`
  - `IN`
  - `ED`

- AnimeThemes uses the word `theme`.
  The app should keep using the word `song` in user-facing UI.
- Songs are uniquely identified by:

  - AniList anime id,
  - AnimeThemes theme slug.

- The category card,
  selection state,
  and PNG export should all render song data with anime context.
- The anime image remains the visual image for songs.
- Song data should be cached in local storage,
  limited to the last 50 anime requests,
  with entries expiring after one week.

## Song Data Model

### Song fields

Each song selection should store enough information to render without a fresh network request:

- `animeId`
- `animeTitle`
- `animeCoverImage`
- `type`
- `slug`
- `title`
- `titleNative`
- normalized display artist string
- optional raw performance data if needed for reformatting later
- optional preview video link

Suggested derived fields:

- `displayTitleDefault`
- `displayTitleNative`
- `displayArtist`

The display rules are:

- Default language mode:
  show `title`,
  and show `titleNative` as a tooltip if it exists.
- If `title` is missing,
  use `titleNative` as the visible title,
  and do not show a tooltip.
- If app-global title language is `native`,
  swap the primary and tooltip values.
- Artist text is either the artist name verbatim,
  or `$artist (as: $as)` when AnimeThemes performance data contains `as`.
- Episode hints should be shown as user guidance during song selection.
  Valid examples include `1-`, `2-12, 14`, and `1, 4, 5, 6`.
  Treat `1-` as equivalent to "always",
  so omit the episode hint in that case.

### Category model

Extend `Category` to include an explicit entity kind,
similar to the earlier related-entity planning direction.
For this feature the supported values should be:

- `anime`
- `song`

Song categories also need a song-specific filter section,
separate from the existing AniList `FilterState`.

Suggested shape:

- `filter: FilterState` for anime search,
- `songFilter: { types: ThemeType[] }` for AnimeThemes client-side narrowing.
- `entityKind: 'anime' | 'song'` next to `filter` and `songFilter`.

This keeps AniList query logic unchanged,
while allowing song result filtering after the anime has been chosen.

### Selection model

The current selection type is anime-only.
Replace it with a discriminated union so the persistence layer,
cards,
and export renderer can branch by entity kind.

Suggested variants:

- `AnimeSelection`
- `SongSelection`

`SongSelection` should include:

- `kind: 'song'`
- `animeId`
- `animeTitle`
- `animeCoverImage`
- `song: {
    type,
    slug,
    title,
    titleNative,
    artist,
    videoLink?,
    episodes?
  }`

This allows rendering and persistence without needing to re-open the cache.

## AnimeThemes API Integration

## Query

Use the supplied query against AnimeThemes GraphQL,
with AniList ids passed through `findAnimeByExternalSite(site: ANILIST, id: $anilistIds)`.

The implementation should always request all theme types for the selected anime,
then narrow to the category's song filter on the client.
That matches the caching requirement and avoids type-fragmented cache keys.

### API layer plan

- Add a dedicated AnimeThemes client module under `src/api`.
- Keep request and response types local to the API layer,
  then map them into app-level song types.
- Normalize AnimeThemes response data into a compact internal shape:

  - anime identity,
  - anime display title,
  - list of songs,
  - video preview link when present.

- Treat missing `song` or `performances` blocks as valid partial data,
  not a fatal response error.
- Normalize API and network failures into user-facing errors similar to the AniList API layer.

### Response normalization rules

- Preserve `slug` exactly as returned.
- Preserve `type` exactly as returned,
  but validate that only supported theme types are surfaced in the UI.
- Flatten `performances` into a single display artist string.
- If multiple performances are returned,
  join them deterministically with `, ` between earlier entries,
  and ` & ` for the final pair.
- Apply the `(as: ...)` suffix per performance entry before joining.
- Choose one video link for preview.
  The AnimeThemes video link is a raw URL,
  so the UI can use it directly.
  Prefer the first available video node link unless the API docs recommend a different stable ordering.

## Local Cache Plan

Add a dedicated local-storage-backed cache for AnimeThemes anime lookups.
This cache is separate from template and selection persistence.

### Cache key

- AniList anime id only.

### Cache value

- normalized anime-level song response,
- fetch timestamp,
- last-access timestamp.

### Cache rules

- Cache full song lists for a selected anime,
  not filter-specific subsets.
- Invalidate entries older than one week.
- Keep only the 50 most recently accessed anime responses.
- Update recency on cache hit,
  not just on network fetch.
- Ignore malformed cache entries during load.
- Put cache parsing and pruning in `src/lib` helpers,
  not in components.

## Picker UX Plan

### Component split

Create a dedicated `SongPickerDialog` component.
Do not keep extending `CategoryMediaPickerDialog.vue` with song-specific logic.

Refactor the current anime picker into reusable subcomponents for shared UI such as:

- dialog shell and header,
- search input row,
- sort controls,
- active-filter summary,
- pagination bar,
- loading skeletons,
- error and empty states,
- anime search result card.

The goal is to share the AniList anime-search stage between anime and song pickers,
without duplicating the current large dialog template.

### Song picker flow

1. Open `SongPickerDialog`.
2. Search anime with the existing AniList media search flow and effective anime filters.
3. User selects an anime result.
4. Trigger AnimeThemes request for that anime id,
   unless a fresh cached response already exists.
5. Show a loading spinner or inline loading state on the expanded anime card.
6. Expand the anime result card to show matching songs filtered by `songFilter.types`.
7. Let the user select one song,
   or show `No results` if the anime has no songs matching the song criteria.
8. Allow collapsing the expanded song list again.

The songs items are displayed as:
`$song_title by $artist_name ($theme_slug, $episodes)`

### Re-open behavior

When opening the dialog for a category that already has a selected song:

- the selected anime should appear first in the result list,
- its song section should already be expanded,
- and the current song should be visibly selected.

This likely requires either pinning the selected anime above the normal search results,
or injecting a synthetic first result card backed by the stored selection and cache data.

Once the user changes the search term,
sort,
page,
or other active picker filters,
the pinned selected-anime result may disappear and normal result ordering can resume.

### Filtering behavior

- Anime filters still affect the AniList anime search step.
- Song filters only affect the expanded song list under a chosen anime.
- Song filtering is entirely client-side.
- Song type filters are category-definition state,
  and should not be editable inside the song picker.
- If no song types are selected for a song category,
  all types will be allowed.

### Song row rendering

Each song row in the expanded list should show:

- title,
- optional native-title tooltip,
- theme type,
- slug,
- artist string,
- selection affordance,
- optional preview action when a video link exists.

### Video preview dialog

If a song has a video link,
show an encircled play icon.
Clicking it opens a dedicated dialog with a `<video>` element.

Dialog copy:

- title: `$song_title by $artist_name`
- description: `from $anime_name ($theme_slug, $episodes)`

The video dialog should degrade gracefully if the remote video cannot load.

## Category Card And Grid Plan

Song category cards should switch from anime-metadata-focused rendering to song-focused rendering.

Display template:

```text
$song_title
by $artist_name
from $anime_name ($theme_slug, $episodes)
```

Rules:

- Song title on the first line.
- `by $artist_name` on the second line.
- `from $anime_name ($theme_slug, $episodes)` on the third line in smaller text.
- Use the anime cover image as the card image.
- Omit `, $episodes` when the hint is `1-`.
- Keep the category name visible as category chrome,
  unless the current card layout is intentionally redesigned during implementation.

Anime cards should continue using their current rendering.

## Title Language Handling

The app currently has a global anime title-language setting.
Song titles should follow that same setting,
but with song-specific swap rules:

- non-`native` mode:
  primary `title`,
  tooltip `titleNative` if both exist.
- `native` mode:
  primary `titleNative`,
  tooltip `title` if both exist.
- if only one of the two exists,
  show it as the primary text and omit the tooltip.
- if both `title` and `titleNative` are absent,
  show `N/A`.

Anime names in song cards and dialogs should continue using the existing anime title resolver.

## Template Import, Export, And Persistence

### Template structure

If category entity kind and song filter become part of `Template`,
then `src/lib/template-validation.ts` and the import/export payload types must be extended accordingly.

Requirements:

- keep backward compatibility by defaulting missing song fields and `entityKind` to anime-safe values,
- reject unsupported payloads rather than guessing,
- ensure imported categories without the new fields normalize safely to `anime` categories.

### Selection persistence

Extend `src/lib/persistence.ts` and `src/stores/selections.ts` to persist the new discriminated selection union.

Requirements:

- keep template selections keyed by template id and category id,
- preserve anime selections already stored,
- parse invalid song selections defensively,
- do not hide migration logic inside components.

## Export Image Plan

Extend `src/lib/export-image.ts` to render song cards.

### Song card export content

Use the same textual format as the category grid:

```text
$song_title
by $artist_name
from $anime_name ($theme_slug)
```

### Truncation rules

- Truncate anime name first when the final line becomes too long.
- Song title and artist string may also be truncated individually if card height would otherwise overflow.
- Preserve the theme slug if possible,
  because it is part of the song identity.

### Layout approach

- Keep the current cover-left text-right card layout unless testing shows song metadata needs a taller card.
- Branch rendering by selection kind,
  not by category name.
- Reuse the anime cover image loading path.

## Footer Attribution

Update `src/components/AppFooter.vue` to add AnimeThemes attribution alongside the existing AniList mention and repository link.

Suggested content:

- mention AnimeThemes by name,
- link to `https://animethemes.moe/`.

If the footer already has a compact attribution sentence,
extend it rather than adding a second unrelated block.

## Files Likely To Change

- `src/types/templates.ts`
- `src/types/selections.ts`
- `src/types/index.ts`
- `src/lib/template-validation.ts`
- `src/lib/persistence.ts`
- `src/lib/export-image.ts`
- `src/lib/anime-title.ts` or a new adjacent helper for song title resolution
- `src/stores/selections.ts`
- `src/components/categories/CategoryCard.vue`
- `src/components/categories/CategoryEditDialog.vue`
- `src/components/categories/CategoryMediaPickerDialog.vue`
- new `src/components/categories/SongPickerDialog.vue`
- new shared picker subcomponents under `src/components/categories/` or `src/components/pickers/`
- `src/components/AppFooter.vue`
- new AnimeThemes API files under `src/api/`
- new cache helpers under `src/lib/`
- tests covering API normalization,
  persistence,
  picker behavior,
  and export rendering

## Suggested Implementation Phases

1. Extend the category model with `entityKind` and song filter state.
2. Introduce a discriminated selection union for anime and song selections.
3. Add template validation and persistence support for the new shapes.
4. Implement the AnimeThemes API client and response normalization.
5. Implement a local song-cache helper with one-week TTL and 50-entry pruning.
6. Refactor the current anime picker into reusable shared picker subcomponents.
7. Add `SongPickerDialog` with anime search,
   expandable song loading,
   client-side type filtering,
   and re-open restoration behavior.
8. Update category cards and selection summaries to render song selections.
9. Add video preview dialog support.
10. Extend PNG export rendering for song cards and truncation behavior.
11. Update footer attribution for AnimeThemes.
12. Add tests and run the full verification commands.

## Suggested Execution Order

1. Update shared types and validation.
2. Extend persistence for the new shapes.
3. Implement the AnimeThemes client and local cache.
4. Refactor the anime picker into shared pieces.
5. Build `SongPickerDialog` on those shared pieces.
6. Update category cards and selection rendering.
7. Extend PNG export and video preview.
8. Update the footer attribution.
9. Add tests and run verification.

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`

Manual QA should cover:

- anime categories still working unchanged,
- creating and editing song categories,
- song-type filtering for `OP`, `IN`, and `ED`,
- loading spinner and `No results` state,
- cache hit,
  expiry,
  and eviction behavior,
- reopening a picker with an existing song selection,
- native title language swap behavior,
- video preview dialog rendering and failure fallback,
- PNG export truncation with long song,
  artist,
  and anime names,
- mobile dialog usability.

## Open Questions
