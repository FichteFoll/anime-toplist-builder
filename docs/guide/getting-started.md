# Getting Started

Anime Toplist Builder runs entirely in the browser.
There is no backend and no account requirement:
templates,
selections,
and preferences live in the browser's local storage of the device you use,
and nothing you build is uploaded anywhere.

Only two things leave the browser:
read-only queries to AniList for anime metadata and search,
and read-only queries to AnimeThemes for song data.

## What Loads On First Visit

The app resolves the active template in this order:

1. the template referenced by the URL hash,
   see [sharing a template by URL](./templates.md#sharing-a-template-by-url),
2. the template that was last opened on this device,
3. the build-time default template,
   see `VITE_DEFAULT_TEMPLATE_ID` in [configuration](../reference/configuration.md),
4. the first available template,
5. a fresh blank template,
   if nothing else exists.

Predefined templates are always available,
so a first visit without a hash normally opens the build-time default
or the first predefined template.

## Page Anatomy

### Sticky toolbar

The toolbar stays visible while the page scrolls.
From left to right it holds:

- the product name,
  on wide screens only,
- the template switcher,
  showing the active template name,
- the template actions menu,
- the image export button,
  a camera icon,
- the account and preferences menu,
  showing your AniList avatar when connected and a cog icon otherwise.

### Template card

Below the toolbar,
one card holds the active template:
its name as the card title,
its description,
an `Edit template` action,
a `Clear all selections` action,
and the category grid.

Categories are shown as cards in a responsive grid.
Each card offers an image area for picking an entry,
an edit action,
a delete action,
and a drag handle for reordering.

### Mobile layout

On narrow screens the toolbar keeps the export button and a hamburger button.
The hamburger opens a left-side sheet containing template switching,
template actions,
AniList actions,
and preferences.
The category grid falls back to a single column.

## Typical First Session

1. Pick a template from the switcher,
   or create a blank one.
2. Optionally set a global filter through `Edit template`,
   for example a release year.
3. Add or edit categories and give each one its own filter.
4. Click a category image to open the picker and choose an entry.
5. Export the finished list as a PNG image.

Every step is saved immediately,
so reloading the page continues where you left off.

## Running It Locally

Install with `pnpm install`,
start the dev server with `pnpm dev`.
Environment variables,
verification commands,
and deployment are documented in [configuration](../reference/configuration.md).
