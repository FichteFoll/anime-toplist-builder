# Step 4 Deviations

## Collapsed AniList tag rank mapping

The shared filter model already stores `minimumRank` per selected tag.
AniList's GraphQL media search currently exposes a single `tagRank` argument for a `tag_in` query,
not a distinct rank threshold for each tag.

Step 4 therefore maps merged tag filters to:

- `tag_in`: all selected tag names.
- `tagRank`: the strictest merged `minimumRank` among those tags.

### Downstream implications

Later filter-editing UI should not imply that AniList enforces a different rank threshold per tag during remote search.
If the product later requires exact per-tag rank semantics,
it will need either a different query strategy,
client-side post-filtering,
or a revised filter model.
