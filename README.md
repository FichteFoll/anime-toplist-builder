# Anime Toplist

Anime Toplist is a statically hosted Vue 3 app for building anime ranking templates,
searching AniList,
persisting local progress,
and exporting the current list as a themed PNG image.

## Features

- Template management for predefined,
  local,
  file-imported,
  and remote URL templates.
- Shared global filters plus category-specific filters,
  with deterministic merge rules.
- Persistent anime selections keyed by stable template and category ids.
- Client-side AniList search,
  metadata loading,
  error toasts,
  and remote template startup hydration via `#template=<id-or-url>`.
- Browser-side PNG export that follows the current theme,
  category order,
  and selected title language.

## Stack

- Vue 3 with the Composition API and TypeScript.
- Vite for development and production builds.
- Pinia for shared state and local persistence.
- Tailwind CSS and Reka UI for UI.
- Vitest and Vue Test Utils for unit and component testing.

## Setup

1. Install dependencies with `pnpm install`.
2. Start the dev server with `pnpm dev`.
3. Open the local Vite URL shown in the terminal.

## Available Commands

- `pnpm dev`: start the local development server.
- `pnpm build`: create the production build in `dist/`.
- `pnpm preview`: serve the production build locally.
- `pnpm typecheck`: run `vue-tsc --noEmit`.
- `pnpm lint`: run ESLint across the repo.
- `pnpm test`: run the Vitest suite.

## Environment Notes

The app is fully client-side.
AniList requests run in the browser,
so no server secrets are required.

Useful optional environment variables:

- `VITE_BASE_PATH`:
  base path for GitHub Pages or other subpath hosting.
- `VITE_DEFAULT_TEMPLATE_ID`:
  default template id used when there is no URL hash and no persisted last-opened template.
- `VITE_REPOSITORY_URL`:
  repository link shown in the UI.

## Development Notes

- Template structure and anime selections are persisted separately.
- Category ids are stable internal identities.
  Renaming or reordering a category must not drop saved selections.
- Imported or predefined protected templates are forked before in-place edits.
- Remote templates can be loaded directly by hash,
  for example `#template=https%3A%2F%2Fexample.com%2Ftemplate.json`.

## Testing And QA

Automated coverage currently focuses on:

- filter merge behavior,
- template validation and normalization,
- persistence helpers,
- fork-on-edit store behavior,
- and a critical category-grid component flow.

Manual QA coverage for mobile layout,
import and export,
remote template loading,
search failures,
and PNG export is tracked in `plans/2026-04-04-initial-implementation/step-11-qa-checklist.md`.

## Build And Deployment

The app targets static hosting,
including GitHub Pages.

1. Set `VITE_BASE_PATH` to the repository subpath when deploying under Pages.
2. Run `pnpm build`.
3. Publish the generated `dist/` directory with the existing Pages workflow.

## Known Constraints

- AniList currently exposes a single `tagRank` argument for tag queries,
  so the app collapses merged tag thresholds to the strictest rank.
  See `plans/2026-04-04-initial-implementation/step-4-deviations.md`.
- Firefox uses Sortable's fallback drag mode for category reordering.
  This avoids the browser's oversized native drag preview for the card.
- PNG export runs in the browser canvas.
  Remote image hosts without suitable CORS headers may fall back to placeholders in the generated image.
