# AGENTS.md

## Tech Stack

- Vite with Vue 3 Composition API and TypeScript.
- Pinia for shared state and local persistence integration.
- Tailwind CSS for styling.
- Reka UI for headless UI primitives.
- Vitest and Vue Test Utils for tests.
- ESLint for linting.
- `pnpm` for dependency and script management.

## Source Of Truth Directories

- `src/types`: shared domain models and payload contracts.
- `src/lib`: pure helpers, validation, persistence adapters, id helpers, and filter logic.
- `src/stores`: Pinia stores only.
  Keep serialization and validation outside stores.
- `src/api`: AniList GraphQL access and response mapping.
  UI code should not build GraphQL requests directly.
- `src/components`: reusable UI primitives and composed interface pieces.
  Export UI lives under `src/components/export`.
- `src/composables`: reusable stateful Vue helpers.
- `src/templates`: predefined template definitions only.
- `src/config`: app-wide configuration constants.
- `plans/`: planning artifacts and step deviation notes.

## Coding Conventions

- Use TypeScript throughout.
- In Vue SFCs, keep the `<script>` block before `<template>`.
- Make components re-usable and encapsulate functionality to keep per-component context minimal and isolated.
- Prefer bi-directional data transfer using the `defineModel` directive.
- Prefer small pure helpers in `src/lib` for normalization, validation, and merge logic.
- Do not introduce character, staff, or manga support.
  The current product scope is anime only.
- Keep the app English-only unless the plan is explicitly updated.
- Preserve static-hosting compatibility for GitHub Pages.

## Domain Invariants

- `Template` structure and `TemplateSelections` persistence are separate concerns.
- Template ids and category ids are stable internal identities.
  Category renames must never break stored selections.
- Categories are keyed by internal ids, not display names.
- When the app exports templates, it should keep stable ids in the payload.
  When it imports older or hand-written payloads without ids, it should generate ids during normalization.
- Template origin matters.
  Predefined and imported templates should be forked before in-place edits that would otherwise mutate protected sources.
- `imported-url` templates stay protected like predefined templates.
  Editing them must fork to a user-owned template before mutation.
- Import and export payloads are versioned.
  Reject unsupported versions instead of guessing.
- Filters are a single shared model used by both global template filters and category filters.
- Category filters must only narrow or refine the effective query relative to the global filter.
  Later UI should disable fields already fixed by the global filter.

## Persistence Rules

- Persist template structure separately from selected anime entries.
- Persist selections by template id and category id.
- Do not key persisted selections by category name.
- Keep schema versioning explicit for persisted local storage records.
- Avoid hidden migrations inside components.
  Put migrations and normalization in `src/lib` helpers.

## Filter Rules

- Use the shared `FilterState` model for template-wide and category-specific filters.
- Preserve deterministic ordering when normalizing string collections like genres, countries, and tags.
- Treat search text as trimmed user input.
- Keep validation strict for enum-like values such as seasons, formats, sources, and sort directions.

## Template Import And Export Rules

- Validate imported JSON before it reaches stores or UI state.
- Check the payload version first and fail with a clear error for unsupported versions.
- Normalize imported templates into internal `Template` objects with guaranteed ids.
- Export only validated template data.
- Do not persist origin-specific runtime details inside exported template JSON unless the plan explicitly requires it.

## Implemented Architecture Notes

- `src/lib/template-validation.ts` is the only source of truth for template import parsing,
  normalization,
  and export serialization.
- `src/lib/persistence.ts` owns local-storage schema handling.
  Stores should call it,
  not duplicate record parsing.
- `src/stores/templates.ts` resolves startup template ids,
  tracks remote template URLs,
  and performs fork-on-edit for protected origins.
- `src/stores/selections.ts` persists anime selections separately from template structure,
  and can duplicate selections during template forking.
- `src/api` contains AniList request code and query-variable building.
  Components should never assemble GraphQL payloads directly.
- `src/lib/export-image.ts` renders PNG exports in the browser with canvas.
  Keep export logic browser-safe and static-hosting compatible.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- Manual QA checklist:
  `plans/2026-04-04-initial-implementation/step-11-qa-checklist.md`

## Current Notes

- Remote template startup hydration is triggered from the app after store initialization,
  using `pendingStartupTemplateUrl` captured by the template store.
- PNG export can fall back to placeholders when remote covers fail to load,
  including CORS-restricted images.
