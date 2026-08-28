# Image Export

The camera button in the toolbar opens the export dialog.
The image is rendered in the browser on a canvas,
previewed in the dialog,
and then downloaded.
Nothing is sent to a server.

## What The Image Contains

- the template name as the headline,
- the author line below it,
  unless hidden,
- one card per category,
  in the order shown in the app,
- for anime selections the cover and the title in the configured title language,
- for song selections the same three-line song format used on the category cards,
- a watermark line crediting the site,
  which cannot be disabled,
- an opaque background and colors taken from the currently active theme,
  light or dark.

## Layouts

Two layouts are available:

- `Portrait`,
  three category cards per row,
- `Landscape`,
  five category cards per row.

The dialog preselects landscape for templates with twelve or more categories,
portrait otherwise.
The height grows with the number of rows.
Card size,
cover size,
and font sizes are code-level constants in `src/lib/export-image.ts`.

## Author

- The author field defaults to your connected AniList username,
  or to `Anonymous` when nothing else is known.
- It can be overwritten freely,
  and the entered value is remembered for the next export.
- `Hide author in exported image` removes the author line entirely,
  including the badge.
- The AniList badge is rendered next to the author only when the value is still
  your connected AniList username,
  so it always means "this is that AniList account".

## Download And Copy

The download filename is `<template name>.png`,
or `<template name> by <author>.png` when an author is shown.
Characters that are invalid in Windows filenames are replaced,
whitespace is collapsed,
and reserved device names are prefixed,
so the name is safe to save anywhere.

There is no copy button.
The dialog explains that copying works through the browser's own
`Copy Image` context menu entry on the preview.

## Fallbacks

- Covers that fail to load are drawn as placeholders,
  which also covers image hosts without permissive CORS headers.
- Long song text is truncated,
  the anime name first,
  then song title and artist if needed,
  while the song slug is preserved.
- If rendering fails,
  the dialog shows the error and keeps the previous preview.
