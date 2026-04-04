# Initial Implementation Plan

## Shared Context For All Steps

### Product scope

Build a statically hosted Vue + TypeScript web app that lets users assemble anime toplists from AniList data,
manage reusable templates,
persist local progress,
and export the resulting list as a themed PNG image.

### Core constraints

- Use Vue with the Composition API,
  with the `<script>` block first in SFCs.
- Use TypeScript throughout.
- Use Tailwind CSS and Radix Vue for styling and headless UI primitives.
- Use Pinia for shared state,
  and also for local-storage-backed persistence.
- Use `pnpm` for package management,
  scripts,
  and CI setup.
- Keep the app English-only.
- Target static hosting on GitHub Pages.
- Support desktop and mobile layouts.
- Do not implement future ideas yet,
  especially characters,
  staff,
  or manga support.

### Cross-cutting architectural decisions

- Treat `Template` and `TemplateSelections` as separate persisted concerns.
  Template structure stores categories and filters.
  Selection state stores chosen anime keyed by stable category identity.
- Preserve category selections across category rename operations.
  This implies categories need a stable internal id that is distinct from the display name,
  even if exported JSON keeps a simpler public shape.
- Define a single internal filter model that can represent both global template filters and per-category filters,
  with logic to compute effective AniList query variables via intersection/merge rules.
- Isolate AniList access behind a small API layer,
  so UI code does not construct GraphQL requests directly.
- Separate app state,
  persistence,
  validation,
  and presentation.
  This reduces coupling between sub-agents.
- Prefer configuration constants for image export size,
  categories per row,
  watermark,
  and default template selection.
- Template imports need explicit versioning and validation from the start,
  even if only version `1` exists initially.

### Suggested repository structure

- `src/components` for reusable UI components.
- `src/composables` for frontend helpers and reusable stateful logic.
- `src/stores` for Pinia stores.
- `src/types` for shared TypeScript types.
- `src/lib` for pure helpers,
  validation,
  persistence adapters,
  and AniList query builders.
- `src/api` for AniList GraphQL integration.
- `src/templates` for predefined template definitions.
- `src/assets` for static assets.
- `plans/` for planning artifacts.

### Shared domain model to align on early

- `Template`
  with `id`,
  `name`,
  `categories`,
  `globalFilter`,
  `origin`,
  and `version`.
- `Category`
  with stable internal `id`,
  `name`,
  and `filter`.
- `AnimeSelection`
  with AniList media id,
  chosen display title fields,
  cover image,
  year,
  and format.
- `TemplateSelections`
  keyed by template id,
  then by category id.
- `FilterState`
  covering search,
  date constraints,
  season,
  country,
  tags with rank,
  genres,
  formats,
  popularity,
  source,
  and sort selection.
- `TemplateImportPayloadV1`
  as the validated JSON file shape.

### Shared UX rules

- Search requests are debounced by 250ms.
- Search popovers load results immediately on open.
- Category filters must disable fields already fixed by the global template filter,
  with tooltip text explaining why.
- Destructive actions that would drop non-empty user work require confirmation.
- Failed remote actions show toast feedback.
- The app should remain usable even if AniList metadata fetches fail.

### Required external references

- AniList GraphQL pagination and media sorting behavior.
- Vue 3 Composition API and `defineModel` usage.
- Radix Vue primitives for dialogs,
  popovers,
  dropdown menus,
  tooltips,
  and toasts.

## Step 1: Scaffold The Application Shell

### Goal

Create the runnable project foundation,
including Vite-based Vue + TypeScript setup,
Tailwind,
Radix Vue,
ESLint,
Pinia,
basic app layout,
and GitHub Pages build/deploy workflow.

### Deliverables

- Build tooling and package scripts.
- `pnpm`-based install,
  lint,
  build,
  and test script conventions.
- Base `App.vue` with page shell,
  theme support,
  header,
  content area,
  and footer placeholders.
- Tailwind configuration and base styling.
- GitHub Actions workflow for build and Pages deployment.
- Initial environment/config module for build-time constants.

### Notes for the sub-agent

- Keep the initial shell minimal,
  but establish the directory structure that later steps depend on.
- Use a static-site compatible router strategy only if routing is actually needed.
  The current spec can work without Vue Router.

### Dependencies

- None.

## Step 2: Define Shared Types, Validation, And Agent Guidance

### Goal

Create the shared TypeScript model layer,
runtime validators for template import/export,
and a project-specific `AGENTS.md` that tells AI agents how to work safely in this repo.

### Deliverables

- `src/types` definitions for templates,
  categories,
  filters,
  selections,
  AniList search results,
  and import/export payloads.
- Validation helpers for template JSON parsing and version checks.
- Stable id strategy for templates and categories.
- `AGENTS.md` with repo-specific structure,
  coding conventions,
  invariants,
  and verification commands.

### AGENTS.md should include

- Current tech stack and key libraries.
- Source-of-truth directories and what belongs in each.
- Domain invariants,
  especially category stable ids,
  template fork behavior,
  and persistence rules.
- Guidance to avoid implementing future character/staff/manga support.
- Testing and lint/build commands.
- Rules for editing filters,
  persistence,
  and template import/export behavior.

### Dependencies

- Step 1.

## Step 3: Implement Persistence And Core Pinia Stores

### Goal

Build the app state layer for templates,
current template selection,
user settings,
persisted anime selections,
and local storage hydration.

### Deliverables

- Pinia stores for templates,
  settings,
  and selections.
- Local storage adapters with schema version keys.
- Logic for startup resolution:
  URL fragment template,
  last-opened template,
  or configured default template.
- Fork-on-edit behavior for predefined or URL-imported templates.
- Clear selections workflow for the active template.

### Notes for the sub-agent

- Separate persistent serialization from store logic,
  so state migrations remain manageable later.
- Forking should happen before mutating protected template origins.

### Dependencies

- Step 2.

## Step 4: Add AniList API Integration And Query Builder

### Goal

Implement the AniList GraphQL client,
filter-to-query mapping,
metadata loading for tags/genres,
and paginated media search.

### Deliverables

- Typed AniList API wrapper.
- Query variable builder that combines global and category filters.
- `MediaSort` mapping from UI sort field + order.
- Metadata fetch for tags and genres,
  including descriptions where available.
- Error normalization for UI toasts and inline fallback states.

### Notes for the sub-agent

- Keep AniList request/response typing local to the API layer,
  then map to app-level types.
- Build the filter merge logic as pure functions with focused tests.
- Respect static hosting constraints.
  API access must work fully client-side.

### Dependencies

- Step 2.

## Step 5: Build The Filter Editing UI

### Goal

Create reusable filter editor components for template-wide and category-specific filters,
including disabled inherited fields,
multi-select controls,
tag rank editing,
and sort controls.

### Deliverables

- Shared filter form components.
- Global template filter popover.
- Category filter editor section.
- Tooltip behavior for disabled inherited fields.
- Validation for non-blank category names.

### Notes for the sub-agent

- Keep the filter editor driven by shared types and model update events,
  not ad hoc local state.
- Build the UI to tolerate metadata not being loaded yet.

### Dependencies

- Steps 2 and 4.

## Step 6: Build Template Management UX

### Goal

Implement predefined templates,
user-created templates,
template switching,
import/export,
remote template loading,
and URL fragment integration.

### Deliverables

- Predefined template registry in `src/templates`.
- Change Template menu with create/open/export/import/reset actions.
- JSON export implementation.
- File import flow with validation errors.
- Remote URL import flow using `#template=<escaped-url>` and explicit input.
- URL fragment parsing and normalization.

### Notes for the sub-agent

- Reuse the validation layer from Step 2,
  not a second implementation.
- Preserve a clear distinction between predefined,
  user-local,
  and URL-imported template origins.

### Dependencies

- Steps 2 and 3.

## Step 7: Build Category Grid And Editing Workflows

### Goal

Implement the main toplist editing surface:
category cards,
create/delete/edit flows,
drag-and-drop reordering,
and responsive layout.

### Deliverables

- Category grid for desktop,
  single-column layout for mobile.
- Add category flow.
- Edit category popover with name and filter controls.
- Delete flow with conditional confirmation.
- Drag handle and reorder behavior.
- Empty states and placeholder visuals.

### Notes for the sub-agent

- Choose a drag-and-drop library or native strategy compatible with mobile,
  Vue 3,
  and minimal bundle overhead.
- Reordering must preserve stable category ids and existing selections.

### Dependencies

- Steps 3 and 5.

## Step 8: Build Anime Search And Selection UX

### Goal

Implement the category media picker popover,
including immediate initial load,
debounced search,
pagination,
sorting,
selection,
and clear-selection behavior.

### Deliverables

- Search popover/dialog component.
- Debounced query handling.
- Results grid/list with loading,
  empty,
  and error states.
- Pagination controls with page size 15.
- Selection persistence integration.
- Clear selected anime action on each category card.

### Notes for the sub-agent

- Use the merged effective filter plus search term when requesting data.
- Render title according to the user setting for title language.

### Dependencies

- Steps 3,
  4,
  and 7.

## Step 9: Implement Theme, Settings, Toasts, And Final App Polish

### Goal

Add the remaining shared UX systems:
theme switching,
settings popup,
toast notifications,
footer links,
and overall layout polish.

### Deliverables

- Dark/light theme system.
- Settings popup for title-language selection.
- Reusable toast setup for errors and confirmations.
- Footer with AniList attribution and repository link.
- Accessibility pass on interactive controls and popovers.

### Notes for the sub-agent

- Theme state must be reusable by the image export step.
- Keep title-language selection in a global setting store.

### Dependencies

- Steps 1 and 3.

## Step 10: Implement PNG Export Rendering

### Goal

Generate a downloadable PNG image from the current template,
matching the app theme and category order,
including watermark,
author,
and configurable layout rules.

### Deliverables

- Export renderer that produces a filled-background PNG.
- Configurable constants for width,
  categories per row,
  and font sizing.
- Export modal/popup with preview or generated image display.
- Download filename sanitization for Windows-invalid characters.
- Copy guidance text in the UI.

### Notes for the sub-agent

- Pick a browser-side rendering approach early,
  such as DOM-to-canvas or canvas-first rendering,
  based on theme fidelity and static-hosting compatibility.
- Ensure the generated layout remains stable even when images are missing.

### Dependencies

- Steps 7,
  8,
  and 9.

## Step 11: Verification, Hardening, And Documentation

### Goal

Close the loop with tests,
QA coverage,
docs,
and deployment validation.

### Deliverables

- Unit tests for filter merge logic,
  template validation,
  persistence helpers,
  and fork-on-edit behavior.
- Component/integration tests for critical flows where feasible.
- Manual QA checklist for mobile layout,
  import/export,
  remote template loading,
  search errors,
  and image export.
- `README` with setup,
  development,
  build,
  and deployment notes.
- Review and update `AGENTS.md` to reflect the implemented architecture,
  commands,
  and known constraints.

### Dependencies

- All prior steps.

## Recommended Parallelization Order

1. Step 1.
2. Step 2.
3. Steps 3 and 4 in parallel.
4. Steps 5 and 6 in parallel.
5. Step 7.
6. Step 8.
7. Steps 9 and exploratory work for 10 in parallel.
8. Step 10.
9. Step 11.

## Key Risks And Decisions To Resolve Early

- Export rendering approach:
  choose between DOM capture and custom canvas rendering.
- Category identity model:
  confirm whether stable internal ids may exist even if not exposed prominently in exported templates.
- Template URL semantics:
  define exact precedence and failure behavior for `#template=<id>` vs `#template=<url>`.
- AniList metadata coverage:
  verify which tag descriptions and filter inputs are realistically available from the API.
- GitHub Pages base path:
  ensure asset URLs and SPA behavior work under the repository path.

## Definition Of Done For The First Usable Release

- A user can load or create a template,
  edit global and category filters,
  search AniList,
  assign anime per category,
  reorder categories,
  reload the page without losing work,
  import/export templates,
  switch theme and title language,
  and export a PNG image that reflects the current toplist.
