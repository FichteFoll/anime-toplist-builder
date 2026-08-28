# Anime Toplist Builder

Anime Toplist Builder is a statically hosted Vue 3 app for building anime ranking lists.
Pick a template,
filter what each category may contain,
choose your anime or anime songs,
and export the result as a themed PNG image.

Everything runs in the browser.
Templates,
selections,
and preferences stay on your device.

## Screenshots

### Main page

![Main page](./docs/assets/main_page.png)

### Anime picker

![Anime picker](./docs/assets/anime_picker.png)

## Features

- Predefined,
  local,
  file-imported,
  and URL-imported templates,
  with fork-on-edit for protected ones.
- Shared global and per-category filters against the AniList API.
- Anime categories and anime song categories,
  the latter backed by AnimeThemes.
- Persistent selections per template,
  keyed by stable ids.
- Optional AniList login for the `Hide My Anime` and `Only Show My Anime` filters.
- Template sharing by JSON file or `#template=` link.
- Browser-side PNG export in portrait or landscape,
  following the active theme.

## Documentation

Behavior is documented in [`docs/`](./docs/index.md),
which is kept up to date with the code.

- [Getting started](./docs/guide/getting-started.md)
- [Templates](./docs/guide/templates.md)
- [Categories](./docs/guide/categories.md)
- [Filters](./docs/guide/filters.md)
- [Picking anime](./docs/guide/picking-anime.md)
  and [picking songs](./docs/guide/picking-songs.md)
- [Image export](./docs/guide/image-export.md)
- [Account and settings](./docs/guide/account-and-settings.md)
- Reference:
  [data model](./docs/reference/data-model.md),
  [persistence](./docs/reference/persistence.md),
  [template JSON](./docs/reference/template-json.md),
  [architecture](./docs/reference/architecture.md),
  [configuration](./docs/reference/configuration.md),
  [limitations](./docs/reference/limitations.md)

## Stack

- Vue 3 with the Composition API and TypeScript.
- Vite for development and production builds.
- Pinia for shared state and local persistence.
- Tailwind CSS for styling.
- Reka UI for headless dialogs,
  menus,
  tooltips,
  and other primitives.
- SortableJS for category reordering.
- Vitest and Vue Test Utils for tests.
- ESLint for linting.
- `pnpm` for package and script management.

## Setup

1. `pnpm install`
2. `pnpm dev`

Verification:
`pnpm lint`,
`pnpm typecheck`,
`pnpm test`,
`pnpm build`.

Environment variables,
AniList app registration,
and the GitHub Pages deployment are documented in
[configuration](./docs/reference/configuration.md).

Contributor conventions live in [`AGENTS.md`](./AGENTS.md).
