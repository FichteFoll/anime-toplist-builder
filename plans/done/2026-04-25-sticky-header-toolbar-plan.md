# Sticky Header Toolbar Plan

## Goal

Replace the current large page heading card and standalone template card with a single sticky toolbar at the top of the page.
The toolbar should centralize template actions,
settings,
theme,
AniList account affordances,
and image export.

The categories section should become the primary page content.
Its title should reflect the active template name,
instead of showing a separate template card above it.

## Current State Summary

The current page shell is split across two large cards:

- `src/components/AppHeader.vue` renders the page heading,
  description,
  AniList connection state,
  a settings button,
  and the theme toggle.
- `src/components/templates/TemplateManagementSection.vue` renders a second full-width card for the active template,
  including template load,
  create,
  import,
  export,
  edit,
  delete,
  and image export actions.
- `src/components/categories/CategoryGrid.vue` still uses a static `Categories` heading,
  even though the active template name is already the higher-level context for the page.

This means the page currently spends a large amount of vertical space on shell UI before the user reaches the category cards.

## UX Outcome

The revised shell should behave like this:

- Remove the current hero-style heading card.
- Remove the standalone template card.
- Add a sticky top toolbar that stays visible while scrolling.
- Show `Anime Toplist Builder` in the toolbar as the product title,
  then collapse or remove it once the user scrolls down.
- Merge settings and theme controls into a single header menu.
- Show the logged-in AniList avatar in the header,
  with the username exposed via tooltip.
- Show a cog icon fallback when the user is not logged in.
- Move template selection and template actions into the sticky toolbar.
- Move image export into the sticky toolbar,
  using a camera icon button placed on the right,
  left of the settings item.
- Change the categories card title from `Categories` to the active template name.
- Move the template description into the main categories card body.
- Keep the categories grid as the main content focus.

## Recommended Desktop Structure

Use Reka UI `Toolbar` as the outer sticky shell,
and keep `DropdownMenu` for grouped actions.

Suggested desktop layout,
left to right:

1. App brand / compact page title.
2. Active template switcher trigger.
3. Current template action menu trigger.
4. Image export icon button.
5. Account / preferences menu trigger at the far right.

The AniList avatar trigger and the cog trigger should open the same merged menu.
Its contents should adapt to application state,
including whether the user is logged in.

Suggested sticky container behavior:

- `sticky top-0 z-*` within the page shell.
- translucent or elevated surface so content can scroll beneath it cleanly.
- compact height,
  clearly smaller than the current heading card.
- preserve the current rounded shell language,
  but as a toolbar row rather than a hero panel.

## Component Direction

### 1. Replace `AppHeader.vue` with a compact sticky toolbar

`src/components/AppHeader.vue` should stop rendering the large title and descriptive copy.
It should instead become the top sticky application toolbar,
or be renamed to `AppToolbar.vue` if the rename makes the code clearer.

The toolbar should own:

- the compact app identity,
- the template switcher trigger,
- the template actions menu trigger,
- the image export trigger,
- the account / settings / theme trigger.

### 2. Break `TemplateManagementSection.vue` apart

`src/components/templates/TemplateManagementSection.vue` currently mixes two responsibilities:

- template-related actions and dialogs,
- full card presentation.

The card presentation should be removed.
The logic and dialogs should be retained,
then split into smaller toolbar-friendly pieces.

Suggested extraction direction:

- allow component renames where the new purpose is clearer
- `TemplateSwitcherMenu.vue` for loading predefined,
  local,
  and remote templates.
- `TemplateActionsMenu.vue` for edit,
  export JSON,
  delete,
  create,
  and import actions.
- move the edit template button and edit functionality into the current categories card,
  which will be repurposed into the main template body.
- introduce `TemplateCard.vue` for the surrounding main card layout,
  including the template description and the repurposed edit affordance.
- keep `TemplateEditDialog.vue` and `ImageExportDialog.vue` as dialog components,
  triggered from toolbar buttons or normal buttons.
- keep remote import dialog behavior,
  but trigger it from the toolbar menu instead of a standalone card.

This lets the current data and mutation logic survive,
while removing the extra vertical card.

### 3. Retitle the categories section using the active template name

`src/components/categories/CategoryGrid.vue` should no longer hardcode `Categories` as its main heading.

Recommended heading treatment:

- eyebrow label: `Categories`
- main title: `activeTemplate.name` or `No active template`
- supporting text includes the template description as the card description

That keeps the categories area understandable,
while making the template context visible where the user is actually working.

This can be done by passing one additional prop from `src/App.vue`:

- `title: string`

Optionally also pass a small description string if the final copy needs to vary for empty states.

## Toolbar Interaction Plan

### Template switcher

Keep the existing `Load template` dropdown logic,
but adapt its trigger for toolbar use.

Recommended behavior:

- trigger label shows the current template name,
  truncated if necessary
- menu still groups:
  predefined templates,
  local templates,
  remote imports
- each item should continue showing the selection count summary

This is the main way to move between templates,
so it should remain visible on desktop rather than being buried behind a generic overflow menu.

### Current template actions menu

Move the existing template card actions into a dedicated `DropdownMenu` in the sticky toolbar.

Recommended menu items:

- Edit template
- Export template JSON
- Create blank template
- Import template from file
- Import template from URL
- Delete template

The edit template action should also remain available in the repurposed categories card.

Potential grouping:

- edit/export at the top
- create/import in the middle
- delete in a destructive-styled final group

### Image export

Move `ImageExportDialog` triggering into the sticky toolbar.

Use a camera icon button,
not a text button.

Recommended accessible labeling:

- tooltip: `Export image`
- `title`: `Export image`
- `aria-label`: `Export image`

The current icon set does not include a camera icon,
so a new reusable icon component will be needed under `src/components/icons`.

### Account and preferences menu

Merge settings and theme controls into a single right-side menu.

Recommended trigger behavior:

- when authenticated:
  show AniList avatar via Reka `Avatar`,
  with tooltip showing the username
- when not authenticated:
  show a cog icon trigger
- if AniList is configured but not connected,
  the menu should still expose `Connect AniList`
- when connected,
  the menu should expose `Disconnect AniList`

The AniList and cog triggers should open the same merged menu.

Recommended menu content:

- AniList connect / disconnect action with the AniList icon
- current title language controls
- theme preference controls

Because `ThemeToggle.vue` is currently a segmented inline control,
it will likely need a second compact presentation variant for menu usage,
or a small menu-local theme selector component.

## AniList Avatar Data Requirement

The current AniList flow already fetches the authenticated viewer,
but it only stores `username` in `AniListAuthSession`.

Relevant files:

- `src/api/anilist-queries.ts`
- `src/api/anilist-types.ts`
- `src/api/anilist.ts`
- `src/types/anilist.ts`
- `src/stores/anilist-auth.ts`
- `src/lib/anilist-auth.ts`

The plan should include a small auth model update so the header can render the viewer avatar consistently after reload.

Suggested data change:

- extend `AniListViewer` to include avatar image URLs
- extend `AniListAuthSession` to persist the chosen avatar URL
- update the viewer query and mapping if needed
- update auth persistence helpers and tests

Important note:
the AniList GraphQL query currently only maps `Viewer.name` into the store-facing model,
even though this is the right place to add avatar support.

## Mobile UI Direction

The desktop toolbar should not simply collapse linearly on mobile.
It needs a compact action model.

Recommended mobile approach:

- keep a short sticky top bar
- show app identity on the left
- show current template name in compact form,
  or as a secondary row if needed
- use a hamburger trigger for overflow actions
- keep the toolbar width small enough that the export icon remains visible on mobile
- open the hamburger sidebar on the left on mobile

## Reka UI Fit For Mobile

Reka UI provides primitives that fit this well:

- `Toolbar` for the sticky action row
- `DropdownMenu` for compact action groups
- `Avatar` for the AniList user image
- `Dialog` for a mobile slide-over or sheet-style menu
- `Collapsible` if the mobile menu needs nested expansion inside the sheet

`NavigationMenu` is less suitable here,
because these controls are mostly actions and dialogs,
not page-to-page site navigation.

Recommended mobile implementation:

- use a hamburger button in the sticky bar
- open a `Dialog` styled as a left-side sheet or full-width top sheet
- place template switching,
  template actions,
  AniList actions,
  settings,
  and theme controls inside that sheet

This keeps the mobile interaction understandable,
without forcing multiple tiny icon-only buttons into the header.

## Layout And Styling Notes

- Preserve the existing rounded,
  elevated shell language,
  but reduce the toolbar height significantly.
- Ensure sticky behavior does not hide anchored dialogs or menu content behind z-index conflicts.
- Keep enough top padding in `App.vue` so sticky content does not visually collide with the page edge.
- Avoid introducing a second sticky row unless mobile testing proves it necessary.
- Preserve keyboard accessibility for every icon-only trigger using visible tooltip text and ARIA labels.

## File Impact

Most likely files to update:

- `src/App.vue`
- `src/components/AppHeader.vue`
- `src/components/templates/TemplateManagementSection.vue`
- `src/components/categories/CategoryGrid.vue`
- `src/components/ThemeToggle.vue`
- `src/components/SettingsDialog.vue`
- `src/stores/anilist-auth.ts`
- `src/lib/anilist-auth.ts`
- `src/types/anilist.ts`
- `src/api/anilist.ts`
- `src/api/anilist-types.ts`
- `src/api/anilist-queries.ts`

Likely new components:

- `src/components/templates/TemplateSwitcherMenu.vue`
- `src/components/templates/TemplateActionsMenu.vue`
- `src/components/AppAccountMenu.vue`
- `src/components/icons/CameraIcon.vue`
- `src/components/icons/CogIcon.vue`
- `src/components/icons/MenuIcon.vue`

Depending on implementation preference,
`TemplateManagementSection.vue` may either be deleted,
or reduced to a non-visual logic host that is then folded into the new toolbar components.

## Suggested Execution Order

1. Refactor template card logic into toolbar-ready menu/dialog components,
   without changing behavior yet.
2. Add AniList avatar data support to the auth model,
   persistence,
   and tests.
3. Convert `AppHeader.vue` into a sticky toolbar shell,
   including the merged account/settings/theme menu.
4. Move image export and template action triggers into the toolbar.
5. Update `CategoryGrid.vue` to show the active template name as its title.
6. Remove the standalone template card from `App.vue`.
7. Add a mobile hamburger sheet built from Reka `Dialog`,
   and verify toolbar behavior on narrow widths.
8. Run `pnpm lint`,
   `pnpm typecheck`,
   `pnpm build`,
   and `pnpm test`.

## Testing And QA Focus

- desktop sticky behavior while scrolling category cards
- toolbar menu positioning and z-index behavior
- keyboard navigation for dropdown menus,
  tooltip triggers,
  and icon-only buttons
- authenticated AniList state with avatar shown correctly after reload
- unauthenticated state showing cog fallback
- compact mobile header behavior with long template names
- mobile sheet usability for template switching and settings
- image export discoverability with icon-only trigger

## Open Questions

Resolved decisions:

- keep `Anime Toplist Builder` in the toolbar as the product title,
  then collapse or remove it on scroll
- keep image export as a top-level toolbar icon on desktop,
  placed left of the settings item
- use the same merged menu for the AniList avatar trigger and the cog trigger
- move the template description into the main categories card body
- use only the template name as the categories card title
