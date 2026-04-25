# Related Entity Search And Export Plan

## Goal

Support category types that select something other than an anime,
while still keeping the anime relation visible in category editing,
selection state,
and generated PNG export.

The first target relations are:

- `character` in an anime
- `staff` credited on an anime
- `voice-actor` tied to a character role in an anime

## Current Architecture Baseline

The app already supports a non-anime category type (`song`) with the following patterns:

- category kind is modeled explicitly with `entityKind`
- each category stores its own relation-specific state alongside the AniList filter
- selections are a discriminated union
- picker flows are split into dedicated dialogs that reuse shared picker shell components
- export rendering branches by selection kind
- mismatched selections are pruned defensively by store logic

This plan extends those existing patterns to related entities.

## Product Rules

- Keep the current anime-only behavior working for existing categories.
- Preserve the shipped song-category behavior unchanged.
- Treat the selected entity type as part of the category definition,
  not just the selection payload.
- Preserve stable category ids and template ids.
- Do not infer or auto-convert old selections when the entity type changes.
- When the entity type changes,
  discard the previous selection instead of attempting conversion.
- Show a confirmation dialog before saving an entity-type change that would discard the current selection.
- Keep the app English-only.

## Category Model

Extend `CategoryEntityKind` beyond:

- `anime`
- `song`

with:

- `character`
- `staff`
- `voice-actor`

Each category should continue to store:

- `filter: FilterState` for the shared AniList anime search stage
- `entityKind` as the branch discriminator
- relation-specific state on the category itself

The relation-specific state should be normalized and persisted for every category,
even when the current entity kind does not actively use it.

Likely additions:

- `characterFilter`
- `staffFilter`
- `voiceActorFilter`

## Selection Model

Extend the discriminated `CategorySelection` union with relation-aware variants.

Likely variants:

- `CharacterSelection`
- `StaffSelection`
- `VoiceActorSelection`

Each selection variant should store enough data to render cards,
editor summaries,
and PNG export without a follow-up network request.

Each variant should include:

- primary entity id and display name
- related anime id and title
- image metadata needed for export
- relation metadata specific to the variant,
  such as role,
  character,
  or credit language

## Search And Editing UX

### Category editor

- Keep the existing category type selector in the editor.
- When switching entity kind away from a category that already has a saved selection,
  show a confirmation dialog before saving the change.
- After confirmation,
  reset the current selection and clear any relation-specific metadata that no longer applies.
- Keep editor fields contextual to the selected entity type.

### Search flow

- `anime` uses the existing anime picker.
- `song` uses the dedicated song picker.
- `character`, `staff`, and `voice-actor` should use dedicated relation pickers,
  with the anime context kept explicit in the UI.
- Prefer anime-first narrowing flows for related entities,
  so the user picks an anime before choosing the relation.

### Selection summary

- Always show the full relation chain in the editor summary.
- Primary entity should be visually dominant.
- The related anime should remain explicit.
- For `voice-actor` categories,
  show the character and anime together,
  because the same person can have many credits.

## Export Image Plan

### General approach

- Keep the current card frame and export pipeline.
- Branch rendering by selection kind,
  not by category name.
- Use a dominant primary image with compact supporting context.

### Layout rules

- `anime` categories keep the current layout.
- `song` categories keep the current text-first relation layout.
- `character`, `staff`, and `voice-actor` categories always render an inset image.
- `voice-actor` categories render two inset images.

### Information density

- Use a strict hierarchy:
  - primary name first
  - relation text second
  - secondary ids or credits last
- Prefer abbreviated relation labels where helpful,
  such as `Character in`, `Credited as`, and `Voiced`.
- Keep AniList links out of the rendered image by default.

## Persistence, Import, And Validation

The category import/export and persistence layers should be extended in the same way the existing category kinds are handled.

Requirements:

- extend `CategoryEntityKind` validation
- add new per-kind filter objects with safe defaults
- extend exported template payloads with the new fields
- preserve backward compatibility by defaulting missing newer fields
- keep rejecting unsupported top-level template versions
- extend stored selection parsing with new discriminated variants
- continue pruning mismatched selections in `selectionsStore`

## Implementation Direction

### Phase 1: shared groundwork

1. Extend `CategoryEntityKind` and category type definitions.
2. Add normalized default state for all new per-kind category filters.
3. Extend template validation,
   import,
   export,
   and blank-category factories.
4. Extend `CategorySelection` with new discriminated variants.
5. Extend persistence parsing and selection pruning tests.

### Phase 2: category-type switching UX

1. Detect entity-kind changes while editing a category.
2. If the category already has a selection,
   require confirmation before saving the type change.
3. Reuse the existing confirmation-dialog infrastructure.
4. Keep store-side pruning as a defensive backstop,
   even after confirmation UX is added.

### Phase 3: entity-specific relation pickers

1. Build one picker dialog per new entity kind or per closely related family.
2. Reuse shared picker-shell components.
3. Prefer anime-first narrowing flows.
4. Add relation display helpers analogous to `song-selection.ts`.
5. Add caching only where repeated relation fetches make it worthwhile.

### Phase 4: card and export rendering

1. Extend category cards with relation-specific summaries.
2. Extend PNG export with per-kind text and inset-image rendering.
3. Add a two-inset variant for voice-actor cards.

### Phase 5: tests and QA

1. Add validation and persistence tests for all new shapes.
2. Add picker tests for reopen and selected-relation restoration.
3. Add category-type switching confirmation tests.
4. Add export tests per selection kind.

## Files Likely To Change

- `src/types/templates.ts`
- `src/types/selections.ts`
- `src/lib/template-factories.ts`
- `src/lib/template-validation.ts`
- `src/lib/persistence.ts`
- `src/stores/selections.ts`
- `src/components/categories/CategoryEditDialog.vue`
- `src/components/categories/CategoryCard.vue`
- `src/components/categories/CategoryGrid.vue`
- existing shared picker-shell components under `src/components/categories/`
- new relation-picker components under `src/components/categories/`
- new relation helper modules under `src/lib/`
- `src/lib/export-image.ts`
- `src/api/*`
- tests covering validation,
  persistence,
  picker behavior,
  and export branches
