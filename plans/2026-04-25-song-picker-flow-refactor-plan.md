# Song Picker Flow Refactor Plan

## Goal

Refactor the song picker dialog so it no longer uses a side-by-side anime search plus song sidebar layout.
Instead,
the dialog should use a two-stage flow where the user selects the anime first,
then the anime search area and result grid are replaced with the song picker view.

Both a tabbed flow and a stepper flow are valid.
This plan outlines a shared refactor foundation,
then documents implementation details,
tradeoffs,
and UI behavior for each option so one direction can be chosen later.

## Current State Summary

`src/components/categories/SongPickerDialog.vue` currently keeps the anime search UI visible on the left,
while `SongPickerSidebar.vue` renders anime details and song choices on the right.

The current implementation already has most of the required data behavior:

- anime search state,
- selected anime tracking via `focusedAnimeId`,
- song loading and caching per anime id,
- selected song hydration on reopen,
- preview dialog support.

The main refactor is therefore structural and naming-oriented,
not a full rewrite of the data flow.

## Required UX Rules

- The dialog always opens on the anime-selection view.
- The song-selection tab or step is always visible.
- The song-selection tab or step is disabled when no anime has been selected yet.
- Selecting an anime immediately opens the song-selection view.
- If the category already has a selected anime or song,
  reopening the dialog still starts on the anime-selection view,
  but the song-selection tab or step is enabled so the user can switch manually.
- The song view replaces the anime search area and anime result grid.
  It is not shown as a sidebar.
- Components and tests should be renamed to match the new UI structure.
  `SongPickerSidebar` should become a song list or song grid component.
- The song view should use a responsive split with the anime summary on the left and songs on the right when the dialog is wide enough.
- When the dialog is narrow,
  show the anime summary above the song content.
- The song list itself should render as a compact single-column grid,
  styled similarly to the anime result grid.
- Selecting a different anime should not clear the currently selected song until a new song is chosen.
- The selected anime summary in the song view should not be sticky.
- When reopening with an existing selection,
  the previously selected anime should still be highlighted visually in the anime result list.

## Shared Refactor Foundation

These changes are needed regardless of whether the final UI uses tabs or a stepper.

### 1. Introduce explicit dialog-stage state

Add a local dialog state such as:

```ts
type SongPickerView = 'anime' | 'song'
```

Suggested local refs in `SongPickerDialog.vue`:

- `activeView`
- `selectedAnimeId` or continue using `focusedAnimeId`
- `canOpenSongView`
- `resolvedSelectedAnime`

Behavior:

- `resetState()` should always reset `activeView` to `'anime'`.
- `canOpenSongView` should be `true` when `detailAnime` exists or when a previously selected anime has been hydrated.
- `loadSongsForAnime(result)` should still set the focused anime,
  but should also switch `activeView` to `'song'` immediately.
- On reopen,
  `hydrateSelectedAnime()` should re-enable the song view without auto-opening it.

### 2. Split the dialog body into two view-specific content areas

The dialog should stop rendering anime results and song results at the same time.
Instead,
render one primary content area based on `activeView`.

Suggested split:

- `SongPickerAnimeView.vue`
- `SongPickerSongView.vue`

`SongPickerAnimeView` would own:

- `PickerSearchToolbar`
- `PickerFilterSummary`
- `PickerResultsFrame`
- the anime result card grid

`SongPickerSongView` would own:

- selected anime summary card
- back action to the anime step
- song status handling
- song list or grid rendering
- retry and clear actions

This keeps the main dialog component focused on state transitions,
data loading,
and top-level navigation.

### 3. Rename sidebar-specific components

The current `SongPickerSidebar.vue` name will become misleading.

Suggested rename direction:

- `SongPickerSidebar.vue` -> `SongPickerSongList.vue`
- or `SongPickerSongPanel.vue` if the final layout includes anime summary plus list in one component

Preferred direction:

- `SongPickerSongView.vue` for the full song-selection screen
- `SongPickerSongList.vue` for the reusable list of selectable songs inside that screen

Tests should be renamed accordingly:

- `SongPickerSidebar.test.ts` -> `SongPickerSongView.test.ts` or `SongPickerSongList.test.ts`

### 4. Preserve existing data behavior

Keep the existing request and cache behavior unless the refactor reveals a clear need to adjust it.

Important preserved behavior:

- AniList search still runs from the anime view.
- AnimeThemes song loading still happens after anime selection.
- Cached song payloads should still be used first.
- Existing selected song highlighting should still work.
- The preview dialog remains available from the song list.
- The currently selected song should remain intact when a different anime is chosen,
  until the user picks another song.

### 5. Add reusable navigation-state helpers

To avoid scattering button-disable and auto-open logic across the template,
compute these values centrally:

- `hasSelectedAnime`
- `hasSelectedSong`
- `canNavigateToSongView`
- `isAnimeView`
- `isSongView`

This will make either the tab or stepper variant easier to implement and test.

## Option A: Tabbed Flow

### Summary

Use a two-tab header inside the dialog:

- `Select Anime`
- `Select Song`

The tab list remains visible at all times.
The song tab is disabled until an anime has been selected or restored.

### UI Structure

Suggested layout:

1. Dialog header
2. Tab navigation row
3. One tab panel for anime search
4. One tab panel for song selection

Suggested component additions:

- `SongPickerTabs.vue` for the shared navigation chrome,
  or inline use of Reka `TabsRoot`,
  `TabsList`,
  `TabsTrigger`,
  and `TabsContent`
- `SongPickerAnimeView.vue`
- `SongPickerSongView.vue`

### Tabbed Behavior Details

- `Select Anime` is always enabled.
- `Select Song` is rendered in a disabled visual state until `canNavigateToSongView` is true.
- Clicking an anime result:
  1. stores the anime as the focused selection,
  2. starts song loading,
  3. switches the active tab to `song`.
- On reopen with an existing selection,
  the active tab is reset to `anime`,
  but `Select Song` is enabled.
- From the song tab,
  the user can switch back to the anime tab without losing the focused anime.

### Tabbed Implementation Notes

- Keep the active tab controlled from `SongPickerDialog.vue` rather than delegating it entirely to the tab primitive.
- Avoid unmounting important state accidentally if the chosen tab implementation removes inactive tab content.
  Preserve the dialog's search and pagination refs in the parent.
- Use disabled semantics on the song tab trigger,
  not just muted styling,
  so keyboard and screen-reader behavior match the requirement.
- Add helper copy in the song tab when enabled,
  such as the selected anime title and a back-to-anime action.
- Prefer Reka UI tab primitives for the navigation chrome.

### Pros

- Familiar pattern for switching between two related views.
- Fits well if the team already prefers headless UI primitives.
- Makes the optional return to the anime view feel lightweight.
- The disabled song tab clearly communicates that another step is required first.

### Risks

- Tabs can imply that both views are peers,
  while the actual flow is sequential.
- A disabled tab may feel slightly unusual if the user reads the flow as a wizard.
- The visual distinction between progress and navigation is weaker than with a stepper.

## Option B: Stepper Flow

### Summary

Use a two-step progress header inside the dialog:

- `1. Select Anime`
- `2. Select Song`

The second step is always visible but disabled until an anime has been selected or restored.
Selecting an anime advances the flow to step 2 automatically.

### UI Structure

Suggested layout:

1. Dialog header
2. Horizontal stepper row with connector
3. Current step content below

Suggested component additions:

- `SongPickerStepper.vue`
- `SongPickerAnimeView.vue`
- `SongPickerSongView.vue`

Use the Reka UI `Stepper` component instead of building custom step controls.

### Stepper Behavior Details

- Step 1 is always available.
- Step 2 is shown as disabled until `canNavigateToSongView` is true.
- Clicking an anime result:
  1. stores the anime as the focused selection,
  2. starts song loading,
  3. advances the active step to `song`.
- On reopen with an existing selection,
  the dialog still opens on step 1,
  but step 2 is enabled.
- From step 2,
  the user can click step 1 to revise the anime selection.

### Stepper Implementation Notes

- Model the stepper as navigation,
  not as form submission state.
- Use explicit step states such as `complete`,
  `current`,
  `upcoming`,
  and `disabled`.
- Keep the connector and button layout responsive so it works on narrow dialog widths.
- The selected anime summary inside the song screen becomes more important here,
  because the stepper communicates progress but does not itself show context.
- Prefer Reka UI stepper primitives for the navigation chrome and state handling.

### Pros

- Better matches the sequential nature of the interaction.
- Communicates that anime selection is a prerequisite for song selection.
- Makes the disabled second step feel more natural.

### Risks

- Requires a custom component and more styling work.
- Slightly heavier interaction chrome for a flow that only has two stages.
- If not designed carefully,
  it can feel more like a wizard than a flexible picker.

## Recommended Shared Song View Structure

Regardless of the chosen navigation pattern,
the song-selection screen should be a full replacement view,
not a narrow side panel.

Suggested song view sections:

1. Top row with a back action and selected anime summary.
2. Anime cover,
   title,
   year,
   format,
   and short description.
3. Song list header showing the effective song-type filter summary.
4. Song status area for loading,
   error,
   and empty states.
5. Song list or song grid.

Preferred content shape:

- use a responsive layout that places the anime summary on the left and songs on the right when the dialog width allows it.
- fall back to an stacked layout with the anime summary above the songs on narrow screens.
- keep the song list as a compact single-column grid in both cases,
  with song cards styled in the same general language as the anime result cards.
- keep song rows compact enough that the dialog still reads as a picker,
  not a dense catalog browser.

Song card details:

- place the video preview button on the left side of the card.
- when a song has no video link,
  render an empty spacer in that left slot so the text columns stay aligned.

## State Transition Plan

### Open dialog

1. Set `activeView = 'anime'`.
2. Reset search,
   pagination,
   and transient errors.
3. Load anime search results.
4. Hydrate the previously selected anime if a song is already selected.
5. Keep song navigation disabled until hydration or a new anime selection provides a valid anime context.

### Select anime

1. Update `focusedAnimeId`.
2. Resolve the anime detail object.
3. Load songs for that anime.
4. Switch `activeView` to `'song'`.

### Switch back to anime view

1. Preserve the focused anime.
2. Preserve loaded songs cache in component state.
3. Allow selecting a different anime,
   which replaces the active song context without clearing the current song selection until a new song is chosen.

### Reopen with existing selection

1. Open on anime view.
2. Hydrate the existing anime.
3. Enable the song navigation control.
4. Preserve the ability to manually switch to song view.
5. Keep the previously selected song visibly selected once the song view opens.

## Component Rename And File Impact

Likely files to update:

- `src/components/categories/SongPickerDialog.vue`
- `src/components/categories/SongPickerDialog.test.ts`
- `src/components/categories/SongPickerSidebar.vue`
- `src/components/categories/SongPickerSidebar.test.ts`

Likely new or renamed components:

- `src/components/categories/SongPickerAnimeView.vue`
- `src/components/categories/SongPickerSongView.vue`
- `src/components/categories/SongPickerSongList.vue`
- `src/components/categories/SongPickerTabs.vue` or `src/components/categories/SongPickerStepper.vue`

Rename intent:

- remove `Sidebar` from user-facing and code-facing naming,
- align component names with the fact that the song UI is now a full view,
- keep `SongPickerDialog` as the top-level entry point.

## Testing Plan

Add or update component tests to cover:

- dialog opens on anime view every time,
- song tab or step is rendered but disabled with no anime selected,
- selecting an anime switches to song view automatically,
- reopening with an existing song keeps the dialog on anime view but enables song navigation,
- switching back to anime view preserves state as intended,
- selected song remains highlighted after hydration,
- retry and error states still work in the song view,
- preview dialog still opens from the renamed song list component.

Manual QA should cover:

- desktop and mobile dialog layout,
- keyboard navigation for disabled and enabled tab or step controls,
- long anime descriptions and long song titles,
- selecting a different anime after returning from the song view,
- categories with no matching songs for the configured song filter types.

## Suggested Execution Order

1. Extract the current song sidebar internals into a neutral song-view or song-list component.
2. Introduce explicit `activeView` and navigation-state computed helpers in `SongPickerDialog.vue`.
3. Split the dialog body into `SongPickerAnimeView` and `SongPickerSongView`.
4. Implement either `SongPickerTabs` or `SongPickerStepper`.
5. Rename tests and update mocks to match the new component names.
6. Run `pnpm lint`,
   `pnpm typecheck`,
   `pnpm build`,
   and `pnpm test`.

## Decision Guidance

Choose tabs if the goal is lighter UI chrome,
faster implementation,
and a more general navigation pattern.

Choose stepper if the goal is stronger sequential guidance,
clearer prerequisite signaling,
and UI that more explicitly reflects the two-stage flow.

My lean is toward the stepper option,
because this interaction is inherently ordered,
and the disabled second control maps naturally to the requirement.
Tabs remain a valid lower-effort alternative.

## Open Questions

None at the moment.
