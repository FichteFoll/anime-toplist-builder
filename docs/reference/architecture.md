# Architecture

A short map of where behavior lives.
Contributor conventions and coding rules stay in [`AGENTS.md`](../../AGENTS.md).

## Layers

- `src/types`:
  shared domain models and payload contracts.
- `src/lib`:
  pure helpers for validation,
  normalization,
  merging,
  persistence,
  and canvas rendering.
- `src/stores`:
  Pinia stores only.
  Serialization and validation stay outside.
- `src/api`:
  AniList and AnimeThemes access plus query building.
  Components never assemble GraphQL payloads.
- `src/components`:
  UI primitives and composed pieces.
  Export UI under `components/export`,
  icons under `components/icons`.
- `src/composables`:
  reusable stateful Vue helpers.
- `src/templates`:
  predefined template definitions,
  written as import payloads and normalized through the same validation path as user imports.
- `src/config`:
  app-wide configuration constants fed by environment variables.

## Key Modules

- `src/lib/template-validation.ts`:
  the single source of truth for template import parsing,
  normalization,
  and export serialization.
- `src/lib/filter-merge.ts`:
  merges the global filter with a category filter and reports conflicts.
- `src/lib/persistence.ts`:
  owns local-storage schema handling for templates,
  settings,
  and selections.
- `src/lib/song-cache.ts`:
  local cache for AnimeThemes lookups,
  with TTL and eviction.
- `src/lib/export-image.ts`:
  browser-side PNG rendering,
  including layout constants and truncation rules.
- `src/lib/anilist-auth.ts`:
  OAuth URL building,
  callback parsing,
  and session storage handling.
- `src/stores/templates.ts`:
  startup template resolution,
  remote URL tracking,
  and fork-on-edit for protected origins.
- `src/stores/selections.ts`:
  selection persistence,
  pruning,
  and duplication on fork.

## Runtime Flow

1. Stores hydrate from local storage,
   predefined templates are registered,
   and the startup template is resolved from the hash,
   the last opened template,
   or the configured default.
2. If the hash referenced a remote URL,
   that template is fetched and imported after store initialization.
3. AniList metadata for genres and tags is loaded once for the filter editors.
4. Pickers build effective filters through `filter-merge.ts`
   and query AniList,
   or AnimeThemes for songs.
5. Every mutation goes through the stores,
   which persist immediately.

## Constraints

- Static hosting must keep working,
  GitHub Pages included.
  No server-side code,
  no build-time secrets.
- The product scope is anime and anime song categories.
  Character,
  staff,
  and manga support are not implemented.
- The app is English-only.
