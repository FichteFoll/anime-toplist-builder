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
- for song selections the cover,
  and the category name,
  song title,
  artist,
  and the anime the song is from with its slug and episode range
  as separate text blocks,
  with the number of lines a block gets depending on how much room
  the card has,
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

## Card Text Allocation

Each card's text blocks are measured,
and the vertical space the card offers is handed out between them
rather than capping every block at a fixed number of lines.

- The category name is always spelled out in full.
- For a song card,
  the song title gets at least one line,
  and the block naming the anime the song is from,
  together with its slug and episode range,
  gets at least two lines,
  unless its whole text already fits on one.
- When a song has an artist,
  the artist block exists and gets at least one line;
  a song without an artist has no artist block at all.
- For an anime card,
  the anime title gets at least one line,
  and the year and format line gets at least one line.
- Once every block has its minimum,
  spare vertical space is given out in priority order:
  for a song card,
  to the song title first,
  then to the anime and slug block,
  then to the artist;
  for an anime card,
  to the anime title first,
  then to the year and format line.
  No block is ever given more lines than its text needs.

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
- Long text is wrapped and truncated
  with grapheme- and script-aware measurement,
  so text without spaces,
  for example a Japanese title,
  wraps instead of overflowing its column,
  emoji are never split apart,
  and a word longer than the column is broken across lines
  rather than spilling out of the card.
  A line that still does not fit ends with an ellipsis.
- Long song text is only truncated
  once a block has been given every line the card can spare it,
  and the song slug always keeps its own last line,
  never truncated away.
- If rendering fails,
  the dialog shows the error and discards the preview,
  so the download button stays disabled until a render succeeds.
