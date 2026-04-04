# Step 11 Manual QA Checklist

## Mobile Layout

- Open the app in a narrow mobile viewport,
  around `360px` to `430px` wide,
  and confirm the main shell remains readable without horizontal scrolling.
- Verify the category workspace falls back to a single-column card layout.
- Confirm the add-category popover,
  category edit popover,
  settings dialog,
  and PNG export dialog remain usable on touch-sized screens.
- Reorder categories on a touch device or emulator,
  and verify the drag handle still works without accidental taps on nearby actions.

## Import And Export

- Export the active template as JSON,
  and confirm the downloaded file contains stable template and category ids.
- Import the exported JSON back into the app,
  and verify the template loads without validation errors.
- Import a malformed JSON file,
  and confirm the app shows a clear validation or parse error toast.
- Import a payload with an unsupported `version`,
  and confirm the app rejects it explicitly.

## Remote Template Loading

- Import a template from an `https://` URL,
  and confirm it becomes active and is listed under Remote Imports.
- Reload the page with `#template=<encoded-url>` in the hash,
  and verify the same remote template hydrates during startup.
- Edit a remote-imported template,
  and confirm the app forks it to a user-owned copy before mutating it.
- Try a broken remote URL or a non-200 response,
  and confirm the app surfaces an error toast instead of failing silently.

## Search Errors

- Open a category search popover while online,
  and confirm the initial results load immediately.
- Enter a search term,
  and verify requests stay debounced rather than firing on every keystroke.
- Simulate an AniList network failure,
  and confirm the search UI shows an error state with retry guidance.
- Create a category filter that conflicts with the global filter,
  and confirm the resulting search returns an empty state rather than crashing.

## Image Export

- Export a PNG in both light and dark themes,
  and confirm the generated image reflects the current theme.
- Verify the exported layout keeps category order,
  template title,
  watermark,
  author,
  and selection metadata.
- Export a template with missing covers or blocked remote images,
  and confirm the renderer falls back to placeholders instead of failing.
- Confirm the download filename is sanitized for Windows-invalid characters.
