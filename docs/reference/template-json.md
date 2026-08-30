# Template JSON

Templates are exported and imported as versioned JSON.
`src/lib/template-validation.ts` is the only place that parses,
normalizes,
and serializes these payloads.

## Rules

- The `version` field is checked first.
  An unsupported version is rejected with an explicit error,
  never guessed at.
  The current version is `1`.
- Invalid JSON,
  a non-object payload,
  a missing name,
  a non-array `categories`,
  an unusable id,
  or duplicate category ids all abort the import with a validation error.
- Ids are optional in an import payload.
  Missing template and category ids are generated during normalization,
  so hand-written payloads work.
- Missing `entityKind`,
  `songFilter`,
  `characterFilter`,
  and `voiceActorFilter` default to anime-safe values,
  which keeps payloads written before song,
  character,
  and voice-actor categories valid.
  `characterFilter` defaults to `{ roles: [] }`
  and `voiceActorFilter` defaults to `{ languages: [] }`,
  meaning every role and every language.
  The schema version stays `1`
  for this addition.
- Filters are normalized:
  unknown enum values are rejected,
  array fields default to empty,
  and string collections are deduplicated and ordered deterministically.
- A payload's legacy `countryOfOrigin`,
  as a string or as an array,
  is still accepted and normalized into `countriesOfOrigin`,
  which is the key exports write.
- Exports always contain stable template and category ids,
  so re-importing an export preserves the selections keyed to those ids.
- Exports do not contain origin-specific runtime details,
  the remote URL of a URL import,
  or any selection data.
  Only the template structure is exported.

## Example Payload

```json
{
  "version": 1,
  "id": "cr-anime-awards-2025",
  "name": "Crunchyroll Anime Awards 2025",
  "description": "My picks for the 2025 Crunchyroll Anime Awards",
  "globalFilter": {
    "yearRange": { "minimum": 2025, "maximum": 2025 },
    "sort": { "field": "SCORE", "direction": "desc" }
  },
  "categories": [
    {
      "id": "animeoftheyear01",
      "name": "Anime Of The Year",
      "description": "The strongest overall anime of the year"
    },
    {
      "id": "filmoftheyear01",
      "name": "Film Of The Year",
      "filter": {
        "formats": ["MOVIE", "ONA"],
        "episodes": { "maximum": 1 },
        "duration": { "minimum": 30 }
      }
    },
    {
      "id": "bestopening01",
      "name": "Best Opening Sequence",
      "entityKind": "song",
      "songFilter": { "types": ["OP"] }
    }
  ]
}
```

Everything except `version`,
`name`,
and `categories[].name` is optional.
Field meanings are documented in [data model](./data-model.md)
and [filters](../guide/filters.md).

## Sharing

An exported file can be imported through `Import template from file`,
or hosted anywhere and loaded through `Import template from URL`
or a `#template=<url>` link,
see [templates](../guide/templates.md#sharing-a-template-by-url).
A remote host must allow cross-origin reads for the fetch to succeed.
