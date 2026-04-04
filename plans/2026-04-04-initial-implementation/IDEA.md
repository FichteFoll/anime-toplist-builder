# Anime Toplist

This project is a statically hosted web application
that interacts with the AniList API
to create an anime toplist image.
Categories can be defined by the user
or imported from a template.

## Technology

- Statically compiled website hosted via GitHub Pages
- Vue.js as frontend framework
- Tailwind CSS + Radix Vue as UI/style frontends
- TypeScript
- pnpm as package manager
- ESlint configuration with default rules
- Github Actions to build and deploy the site via GitHub Pages
- No i18n. Everything will be English only.

### Vue.js guidelines

- Use composition API and always define the script block first.
- Make components re-usable and encapsulate functionality to keep per-component context minimal and isolated.
- Prefer bi-directonal data transfer using the `defineModel` directive.
- Use a `types` folder for types shared by multiple components.
- Use a `composables` folder to collect various utility composables.
- Use pinia to share and inject application data across several components.
  - Also use pinia to persist user data in local storage,
    specifically the user's selections per template
    and their own (or imported) templates.

## Features

- Ability to set a name for the toplist.
- Ability to set an author of the toplist.
- Categories can be created, removed and moved via drag and drop.
- Categories must have a non-blank name.
- Categories include a configurable filter that will be used to limit search results.
- An overarching "template filter" can be specified that applies to all categories.
  The template filter is then combined with the category filter
  when searching for anime matches in the respective category.
  Example template filter: Start Date 2026
- Query Anilist's GraphQL API to search for anime matching filter criteria.
- Anime title can be configured to use the English, Romaji or Native name.
- Selections per template are persisted in local storage
  so that the user can reload the page and continue where they left off.
  - Category selections are stored by the category name.
  - When a category is renamed, the selection remains.
- Supports mobile layouts.

### Filters

- The global and category filters support many filters that the AniList API exposes, including:
  - Start Date (exact date range or just the year (fuzzydate))
  - End Date (same as Start Date)
  - Season (multi-select/tags)
  - Country of Origin (Japan, China, Korea) (multi-select/tags)
  - Tags (one or multiple) with a minimum tag rank for each (numeric, 1 to 100) (e.g. Isekai, Primarily Female Cast, Slapstick)
  - Genre (one or multiple) (e.g. Comedy, Action, etc.) (multi-select/tags, AND-combined)
  - Format (e.g. TV, Movie, ONA, etc.) (multi-select/tags, AND-combined)
  - Minimum Popularity
  - Source (e.g. Light Novel, Manga, Original) (multi-select/tags)
- There is a search input field that matches against the media title (uses `search` field).
- Sort fields and order is configurable, defaulting to descending popularity.
  - Supported fields are: title, start date, trending, favorites, score.
  - Supported orders are: ascending and descending (default).
  - Maps to single `MediaSort` enum value in Anilist's API.
- Available tags and genres should be fetched from the Anilist API, if possible,
  along with their description.

#### Overarching filter

- The overarching filter will be combined with the category filters to build an intersection.
- To reduce complexity,
  the fields specified by the overarching filter will not be editable in the category filters
  and a tooltip on the disabled filter inputs will mention this.

### Image generation

- Can generate an image with the title,
  all categories and their selected anime
  that looks similar to the site itself
  but without any interactive UI elements.
- Includes a code-configurable watermark string
  references the site itself.
  Cannot be disabled.
- Includes the author below the template name.
- Matches Dark or light theme from the current UI settings.
- Image format is png.
- Resolution is 1400px in width and height as much as needed to fit all categories.
- Four categories are rendered per line.
- Resolution and number of categories, as well as font size, are configurable in code.
- Background should be filled and not transparent.
- Colors and general look-and-feel is inferred from the theme.
- Categories are rendered in the same order as in the UI.

### Templates

- Templates consist of:
  - a unique id (string),
  - a name,
  - and a list of categories with their respective filters.
- Hard-coded category templates can be loaded and referenced via URL fragments
  to give people a common starting ground, such as "Crunchyroll Anime Awards 2026".
  The fragment look like `#template=<template-id>`.
- When opening the site without an explicitly referenced template in the URL fragments,
  either the previously opened template (local storage)
  or a hard-coded default template (defined by a build-time constant)
  will be loaded.
- A set of default templates is provided by the app itself.
- Users can create their own templates,
  in which case the template's ID will be randomly generated.
- Templates can be exported as JSON from the site itself.
- Template JSON files are versioned by a `version` property
  that allows implementing soft-migrations later on.
- Templates can be uploaded and will create a new user-local template with a generated ID.
- Template JSON can also be uploaded to a different site and loaded via an input field or query parameter.
  In that case, the URL fragment will look like `#template=<escaped-url>`
  using `encodeURIComponent` and `decodeURIComponent` for escaping and unescaping.
  The URL is properly unescaped when loading the page.
- When a template cannot be imported (by file or remote URL),
  display a validation error and abort the import.
- When the user makes a change
  to a URL-imported or default template (category order, category name, category filters, template name),
  a new template is automatically forked from it
  and the name gets suffixed with " (modified)".
  The `template` URL fragment is removed as well.
- Selections per template are persisted in local storage (by template id)
  so that the user can reload the page and continue where they left off.

## Future feature ideas (for later consideration)

In a later iteration of this tool,
there may be some enhancements.
These extra features may be loosely considered
when drafting out the architecture of the software
but they should **not** be implemented yet!

### Characters

- In addition to filtering for Media,
  there will be a way to create a category for characters
  that appear in an anime that matches the specified filters.
- Additional filter: Role (Main, Supporting, or Background)
- Search input matches both characters and anime titles.

### Staff

- Similar to Characters,
  there will be a way to create a category
  for staff members of anime that match the specified filters.
- Additional filter: Role (e.g. Director, Character Design, Music)
- Search input matches both staff name and anime titles.

### Manga

For now, only Anime will be supported
but a manga/light novel toplist could be interesting as well.

## UI

- Dark and light theme.
- Settings menu (in a popup) with configuration options for:
  - anime title language (English, Romaji, Native)
- Template name is displayed in large text at the top of the site, centered.
  - Below the name is a small clickable text for the "template filter"
    with a filter icon.
  - Clicking on the template filter text opens a popover similar to the categories
    where the template filter can be configured.
  - There is a "Change Template" button that opens a menu with the following items:
    - "Create new" to create a new template.
    - Open one of the user's custom or a predefined templates.
      - Will also load the user's selection from local storage.
    - "Export to file" to export the current template as JSON.
    - "Import from file" to import a template file as JSON via file upload.
    - "Import from URL" to load a JSON template file from a remote URL.
    - "Clear selections" to reset all selections for the current template with a confirmation prompt,
      including the persisted selection for this template.
  - The menu items are accompanied by fitting icons.
  - When importing a template (file or URL) fails,
    an error toast is displayed
    with some details on the error if available
    or a generic error text.
- Categories should be rendered in a grid
  - The category is rendered with
    - its name
    - an image for the anime's image (key visual) or a placeholder if none has been selected yet,
    - the name of the selected anime, if any,
    - a few action buttons in the top right corner,
    - a draggable handle in the form of three vertical lines (icon)
      that can be used to drag the category to a different position.
  - Each category has an "edit" icon/button that can be clicked to open a popover.
    - In the popover, there will be an input to set the category name.
    - In the popover, the category filters can be configured.
  - Each category has a trash icon/button to delete the category
    with a confirmation prompt if its configuration is not empty.
  - When clicking on a category's image, a popover will open to search for and select an anime.
    - Shows a text input at the top to search for an anime title matching the given criteria.
      - Is added to the category filters and template filter.
    - Shows a result grid with one entry for each matching Anime, including the anime's:
      - image (key visual)
      - title
      - release year
      - format
    - When a search request fails, display an error toast
      and render "Something went wrong" in the result grid.
    - When no results can be found,
      render "No results found" in the result grid.
    - Search inputs are debounced by 250ms.
    - Clicking on one anime in the result grid will select this anime for the category.
    - A dropdown to select the sort field and order.
    - Use a page size of 15 and provide pagination buttons.
    - When the popover opens, results should already be loaded and displayed
      according to the filter criteria and default sort order.
    - Show loading spinner while search results are being requested.
  - There is a clear icon/button that removes the selected anime for this category.
- There is a button to export an image.
  The image will then be generated and displayed in a popup for the user to download or copy.
  - While the image is generated, a loading spinner is shown.
  - The default image name is `Anime Toplist <template name>.png`
    with characters that are invalid on NTFS/Windows replaced with `_`.
  - For the copy feature, a text is displayed
    that mentions to use the browser's context menu "Copy image" item.
- Footer
  - Mentions that it is powered by AniList with a link to it.
  - Mentions that it is open source with a link to a github repository.
- Font: Use a simple and readable sans-serif font.

### Mobile layout

- Instead of a grid, show one category and one search result per line.

## References

- AniList's GraphQL Docs
  - Getting Started: https://docs.anilist.co/guide/graphql/
  - Pagination: https://docs.anilist.co/guide/graphql/pagination
  - Reference: https://docs.anilist.co/reference/
    - Media: https://docs.anilist.co/reference/object/media
    - MediaSort: https://docs.anilist.co/reference/enum/mediasort
    - Query: https://docs.anilist.co/reference/query
- Vue.js docs: https://vuejs.org/guide/introduction.html
- Radix Vue docs: https://www.radix-vue.com/overview/getting-started.html
