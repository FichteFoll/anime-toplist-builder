# Templates

A template is the definition of a toplist:
a name,
a description,
a global filter,
and an ordered list of categories.
Your picks are not part of the template.
They are stored separately and keyed by template id and category id,
see [persistence](../reference/persistence.md).

## Template Origins

Every template has an origin that decides whether it can be edited in place
and whether it can be deleted.

- `predefined`:
  shipped with the app,
  protected,
  cannot be deleted.
- `user`:
  created locally or forked from a protected template,
  fully editable and deletable.
- `imported-file`:
  imported from a JSON file,
  fully editable and deletable.
- `imported-url`:
  imported from a remote URL,
  protected,
  cannot be deleted.

Predefined and remote-imported templates are protected,
because they are shared starting points that should keep matching their source.

## Fork On Edit

Editing a protected template does not change it.
Instead the app forks it:

1. a user-owned copy is created with a new id,
2. the existing selections are copied to the fork,
3. the fork becomes the active template,
4. further edits apply to the fork.

This happens on any structural change,
including renaming the template,
editing the global filter,
adding,
editing,
reordering,
or deleting a category.

The original stays untouched and can be reopened from the switcher.

## Switching Templates

The template switcher groups the available templates as:

- `Predefined`,
  shipped with the app,
- `My templates`,
  created locally,
  imported from a file,
  or forked,
- `Remote imports`,
  imported from a URL.

Each entry shows how many selections are stored for it,
so you can tell a filled-in list from an empty one before opening it.

Switching templates loads that template's stored selections.
The last opened template is remembered per device.

## Template Actions

The template actions menu offers:

- `Export template JSON`,
  downloads the active template with stable ids,
- `Create blank template`,
  creates and opens an empty user template,
- `Import template from file`,
  reads a JSON file and opens it as a new local template,
- `Import template from URL`,
  fetches a JSON template over HTTP or HTTPS,
- `Delete template`,
  disabled for predefined and remote-imported templates.

`Edit template` lives on the template card and opens the template dialog,
where name,
description,
and the global filter are edited.

Deleting a template also deletes its stored selections.
`Clear all selections` on the template card empties the picks for the active template only,
after a confirmation prompt.

## Import Failures

Imports are validated before anything is stored,
see [template JSON](../reference/template-json.md).
When a payload is malformed,
has an unsupported version,
or the remote request fails,
the app shows an error toast and aborts the import.
The previously active template stays untouched.

## Sharing A Template By URL

The URL hash carries the active template so a link can be shared:

- `#template=<template-id>` for a predefined or otherwise known template id,
- `#template=<url>` for a remote JSON template,
  URL-encoded in the hash.

The hash is rewritten whenever the active template changes,
and cleared when no template is active.
Opening a link with a remote URL fetches,
validates,
and imports that template during startup.

Remote imports are remembered by their URL.
Re-importing the same URL updates the existing local template
instead of creating a duplicate.

Only well-formed ids and `http` or `https` URLs are accepted.
Anything else in the hash is ignored.
