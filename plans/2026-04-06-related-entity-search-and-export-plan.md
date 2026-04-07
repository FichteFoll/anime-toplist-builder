# Related Entity Search And Export Plan

## Goal

Support category types that select something other than an anime,
while still keeping the anime relation visible in the category editor,
selection state,
and generated PNG export.

The first target relations are:

- `character` in an anime,
- `staff` credited on an anime,
- `voice actor` who voiced a character in an anime.

## User Confirmation Requirement

- Switching a category's entity type must discard the previous selection.
- The UI must show a confirmation dialog before the switch completes.
- The dialog should state clearly that the current selection and its relation data will be lost.

## Product Rules

- Keep the current anime-only behavior working for existing categories.
- Allow switching the entity type while editing a category.
- Treat the selected entity type as part of the category definition,
  not just the selection value.
- Preserve stable category ids and template ids.
- Do not infer or auto-convert old selections when the entity type changes.
- Keep the app English-only.

## Proposed Data Model

### Category

Extend each category with an explicit target entity kind,
for example:

- `anime`
- `character`
- `staff`
- `voice-actor`

The category entity kind determines:

- which search API to use,
- which editor fields are shown,
- what gets persisted as the selection payload,
- and how the export card is rendered.

### Selection

Replace the current anime-only selection shape with a discriminated relation model,
or wrap the existing anime selection as one variant.

Each selection should be able to store:

- the primary entity id and display data,
- the related anime id and title,
- optional secondary relation data,
- and enough cover or portrait metadata for export.

Suggested relation shapes:

- `anime`: current behavior.
- `character`: character + anime.
- `staff`: staff member + credited role + anime.
- `voice-actor`: voice actor + voiced character + anime + credit language.

## Search And Editing UX

### Category editor

- Add an entity type selector near the category title and description fields.
- Switching entity type triggers the confirmation dialog.
- After confirmation,
  reset the current selection and clear any relation-specific metadata.
- Keep the editor fields contextual to the selected entity type.

### Search flow

- Search UI should branch by category entity type.
- `anime` uses the existing anime picker.
- `character` searches characters and shows their anime context.
- `staff` searches staff and shows the credited role plus anime.
- `voice-actor` searches staff credits or voice-role records,
  depending on the AniList data shape used.

### Selection summary

- Always show the full relation chain in the editor summary.
- Primary entity should be visually dominant,
  but the related anime should remain explicit.
- For voice actor categories,
  show the character and anime together,
  because the same person can have many credits.

## Export Image Plan

### General approach

- Avoid rendering several equally large images side by side.
- Prefer one dominant image with one or two compact secondary insets.
- Use smaller typography and denser metadata blocks where needed.
- Keep the card readable at both portrait and landscape export sizes.

### Layout suggestions

- `anime` categories: keep current layout.
- `character` or `staff` focus:
  - main focus image as the large hero image,
  - anime cover as a small inset in the bottom right,
  - relation text beneath the main title.
- `voice-actor` focus:
  - main person image as the hero,
  - character and anime shown as two smaller stacked or side-by-side insets,
  - relation labels kept very compact.

### Information density

- Use a strict hierarchy:
  - primary name first,
  - relation text second,
  - secondary ids or credits last.
- Prefer abbreviated labels such as:
  - `Character in`
  - `Credited as`
  - `Voiced`
- Keep AniList links out of the rendered image by default.
- If links are exposed at all,
  show them in the editor and in exported metadata,
  not as visible card clutter.

## Suggested Implementation Phases

1. Introduce category entity type in the template model and validation layer.
2. Add confirmation-gated entity type switching in the category editor.
3. Replace selection storage with a relation-aware selection schema.
4. Add entity-type-specific search and selection UI.
5. Extend export rendering to support relation-aware card layouts.
6. Tune typography,
   inset sizing,
   and placeholder behavior for dense cards.
7. Add tests for type switching,
   selection clearing,
   and export layout branches.

## Files Likely To Change

- `src/types/*`
- `src/lib/template-validation.ts`
- `src/lib/export-image.ts`
- `src/stores/selections.ts`
- `src/components/categories/*`
- `src/components/export/*`
- `src/api/*`
- `plans/` for follow-up deviation notes

## Open Questions

- Should voice actor selection be modeled from staff credits,
  or from a dedicated voice-role relation object?
- Should the export card show one hero image plus overlays,
  or a compact composite strip for voice actor categories?
- Should AniList URLs be available in the editor as copy actions,
  or hidden behind a details panel?
- Should `staff` categories allow non-voice roles only,
  or a generic credit role selector?
