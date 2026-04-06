# AniList Auth And List Filters Plan

## Goal

Add optional AniList authentication for the currently logged-in user,
then use that auth context to unlock shared anime picker filters for list membership.

The new filters are:

- `Only on list`
- `Hide on list`

They are mutually exclusive,
disabled by default,
shared across all category anime pickers,
and not stored in templates or category filters.

## Documentation Sources

- AniList Implicit Grant:
  https://anilist.gitbook.io/anilist-apiv2-docs/docs/guide/auth/implicit.md
- AniList Authenticated Requests:
  https://anilist.gitbook.io/anilist-apiv2-docs/docs/guide/auth/authenticated-requests.md
- AniList API docs index:
  https://anilist.gitbook.io/anilist-apiv2-docs/sitemap.md

## Prerequisites

- Register an AniList application before implementation starts.
- Use the browser-side implicit grant flow.
- Register the redirect URI as the deployed app root,
  including the trailing slash and any GitHub Pages subpath,
  for example `https://<host>/<base-path>/`.
- Configure the AniList client id through an environment variable,
  not a hardcoded constant.

## Product Rules

- The app must stay usable without AniList login.
- Login should be optional and initiated from the header card next to settings.
- Logged-in state only affects AniList requests,
  not template persistence.
- When authenticated,
  the header should also show a logout action.
- The new list filters belong to the anime picker UI only.
- The filters must apply to every category picker through shared state.
- If the user logs out,
  the shared list filters should become unavailable or reset to their default inactive state.
- Keep the feature scoped to anime.
- Persist the AniList token in `sessionStorage` across page reloads in the same tab.
- Detect expired or invalid tokens during API use,
  force a logout,
  and show a toast notification to the user.

## AniList API Decisions

- Use AniList OAuth2,
  not passwords.
- Prefer AniList implicit grant for this browser-only app,
  because it returns the access token directly to the client without requiring a client secret.
- AniList access tokens are JWTs,
  so the app can inspect expiry metadata,
  but it should still treat the token as opaque for request auth.
- The implicit grant returns the access token in the redirect URI fragment,
  so the app must parse and clear the fragment carefully,
  and never persist the full callback URL.
- Use the authenticated user's token when building AniList requests.
- For current-user list checks,
  prefer `Media.onList` or `mediaListEntry` only where the docs allow authenticated-user data.
- Do not try to support an arbitrary other AniList user through this feature.

## Security Considerations

- Treat the AniList token as sensitive browser state.
- Avoid persisting the token in `localStorage` unless there is no better browser-safe alternative,
  because any XSS or malicious extension can read it.
- Use `sessionStorage` for reload survival in the same tab,
  and document that it is still readable by JavaScript and is cleared when the tab or browser session ends.
- Validate the redirect URI exactly against the AniList app registration.
- Never log access tokens,
  or full OAuth error payloads.
- Clear the stored token immediately on logout or when AniList returns a real auth failure,
  such as 401 or 403.
- Keep the existing frontend CSP and XSS posture in mind,
  because auth safety depends on it.

## Architecture

### Auth state

- Add a dedicated auth store for AniList connection state.
- Store the access token and derived session state separately from templates and settings.
- Store the AniList username alongside the token so the app can reuse it as display data.
- Add a small auth API helper layer so UI code never handles OAuth details directly.
- Keep token handling isolated so the rest of the app only knows whether AniList auth is available.
- Read the AniList client id from app configuration fed by an environment variable.

### Shared list-filter state

- Add shared UI state for:

  - `listVisibility: 'only' | 'hide' | null`

- Keep this field outside template serialization.
- Keep them outside category filter models.
- Expose them to all anime pickers from a single shared source.
- Enforce mutual exclusion in the shared state layer,
  not in each picker component.

### Query behavior

- Extend AniList search variable building to include the list-based filter when auth is available.
- When auth is absent,
  hide or disable the list filter controls and avoid sending user-specific query fields.
- Map `Only on list` to `onList: true`.
- Map `Hide on list` to `onList: false`.
- Use the same `onList` query field for both states,
  with the shared state ensuring they remain mutually exclusive.

## UI Work

### Header

- Add a `Connect AniList` action to the header card next to settings.
- Show connected state once authentication succeeds.
- Add a disconnect action for clearing the current AniList session.
- Keep the entry point visually adjacent to existing settings controls.

### Anime picker

- Show the list filters in the picker filter bar or advanced filter area.
- Hide them completely when the user is not authenticated.
- Keep the existing picker layout and pagination behavior intact.
- Make the mutual exclusion obvious in the control logic and UI state.
- Use the AniList UI labels:

  - `Hide My Anime`
  - `Only SHow My Anime`

## Data Flow

1. User clicks `Connect AniList`.
2. App starts AniList OAuth2 implicit grant and receives an access token in the redirect fragment.
3. App stores the token in `sessionStorage` and marks the session active.
4. Shared picker state enables the list filters.
5. Search requests include the auth context when needed.
6. All category pickers consume the same shared list-filter state.

## Image Export Updates

- When authenticated,
  use the AniList username as the default author value in the image generation dialog.
- If the AniList username is used as the author,
  render an AniList icon next to that username in the exported image.
- The icon should communicate that the author value came from an authenticated AniList account.
- Keep manual author overrides possible,
  but preserve the authenticated username as the default starting point.
- Add an export option to hide the author completely in the generated image.
- When that option is enabled,
  do not render the author text or the AniList badge.

## Files Likely To Change

- `src/components/AppHeader.vue`
- `src/components/SettingsDialog.vue`
- `src/components/categories/*`
- `src/components/export/*`
- `src/api/anilist*.ts`
- `src/stores/*`
- `src/types/*`
- `src/lib/*` for shared filter or auth helpers
- `plans/` for deviation notes if implementation diverges

## Rollout Steps

1. Define auth and shared list-filter state shape.
2. Add AniList client id configuration via environment variable.
3. Add AniList OAuth connection flow and session storage.
4. Thread auth into AniList request creation.
5. Add picker-only list filter controls with mutual exclusion.
6. Wire header controls and connected/disconnected states.
7. Verify search, pagination, and unauthenticated fallback behavior.
8. Thread authenticated username into image export defaults and badge rendering.
9. Add an export toggle for hiding the author entirely.
10. Add README notes about the backend-less AniList implicit-grant flow,
   the redirect-fragment token handling,
   the `sessionStorage` tradeoff,
   and the required AniList app registration and redirect URI.

## Open Questions
