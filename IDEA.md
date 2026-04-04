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
- Categories can be created and removed at will with a filter.
- Ability to set an overarching filter that applies to all categories.
  The overarching filter is then combined with the category filter when searching for completions.
- Query Anilist's GraphQL API to search for anime matching filter criteria.
- Anime title can be configured to use the English, Romaji or Native name.
- Selections per template are persisted in local storage
  so that the user can reload the page and continue where they left off.

### Filters

- The global and category filters support many filters that the AniList API exposes, including:
  - Start Date (range or year)
  - End Date (range or year)
  - Airing date
  - Season
  - Country of Origin (Japan, China, Korea)
  - Tags (one or multiple) with a minimum tag rank for each (numeric, 1 to 100) (e.g. Isekai, Primarily Female Cast, Slapstick)
  - Genre (one or multiple) (e.g. Comedy, Action, etc.)
  - Format (e.g. TV, Movie, ONA, etc.)
  - Popularity (minimum)
  - Source (e.g. Light Novel, Manga, Original)
- There is a search input field that matches against the media title.
- Sort order should be configurable, defaulting to popularity.
- Available tags and genres should be fetched from the Anilist API, if possible,
  along with their description.

### Image generation

- Can generate an image with the title,
  all categories and their selected anime
  that looks similar to the site itself
  but without any interactive UI elements.
- Includes a configurable watermark string
  that can be used to reference the site itself.
- Dark and light theme.

### Templates

- Templates consist of a name and a list of categories with their respective filters.
- Hard-coded category templates can be loaded and referenced via URL fragments
  to give people a common starting ground, such as "Crunchyroll Anime Awards 2026".
- When opening the site without an explicitly referenced template,
  a hard-coded default template will be loaded by default
  by referencing a provided template in code.
- Templates can be exported as JSON from the site itself and added to the source code.
- Template JSON can also be uploaded to a different site and loaded via an input field or query parameter.
- Users can create their own templates.
- Selections per template are persisted in local storage
  so that the user can reload the page and continue where they left off.

## Future features (for later consideration)

In a later iteration of this tool,
there may be some enhancements.
These extra features should be loosely considered
when drafting out the architecture of the software
but they should not be implemented yet.

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
- Categories should be rendered in a grid
  - The category is rendered with
    - its name
    - an image for the anime's image (key visual) or a placeholder if none has been selected yet,
    - the name of the selected anime, if any,
    - a few action buttons in the top right corner.
  - Each category has an "edit" icon/button that can be clicked to open a popover.
    - In the popover, there will be an input to set the category name.
    - In the popover, the category filters can be configured.
  - Each category has a trash icon/button to delete the category
    with a confirmation prompt if its configuration is not empty.
  - When clicking on a category's image, a popover will open to search for and select an anime.
    - Includes a text input at the top to search for an anime title matching the given criteria.
    - Includes a result grid with one entry for each matching Anime, including the anime's:
      - image (key visual)
      - title
      - release year
      - format
    - Clicking on one anime in the result grid will select this anime for the category.
    - A dropdown to select the sort field and order.
    - Use a page size of 15.
    - Results should already be displayed without having inserted text according to the filter criteria and default sort order.
    - Show loading spinner while search results are being requested.
- There is a button to generate an image.
  The image will then be displayed in a popup for the user to download or copy.
- There is a "Template" section/menu.
  - Can create a new template.
  - Can select one of the predefined templates.
  - Can export the current template as JSON.
  - Can import a template file as JSON via file upload.
- Footer
  - Mentions that it is powered by AniList with a link to it.
  - Mentions that it is open source with a link to a github repository.
- Font: Use a simple and readable sans-serif font.

## References

- AniList's GraphQL Docs
  - Getting Started: https://docs.anilist.co/guide/graphql/
  - Pagination: https://docs.anilist.co/guide/graphql/pagination
  - Reference: https://docs.anilist.co/reference/
  - Query: https://docs.anilist.co/reference/query
- Vue.js docs: https://vuejs.org/guide/introduction.html
