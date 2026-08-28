# Configuration

The app is configured at build time through `VITE_*` environment variables,
collected in `src/config/app.ts`.
There are no runtime settings files and no secrets:
everything in the bundle is public.

## Environment Variables

- `VITE_APP_NAME`:
  product name available to the app through `appConfig`.
  Defaults to `Anime Toplist Builder`.
  The toolbar title and the HTML `<title>` are currently hardcoded,
  so overriding this has no visible effect yet.
- `VITE_BASE_PATH`:
  base path of the deployment,
  for example `/anime-toplist/` for a GitHub Pages project site.
  Defaults to `/`.
- `VITE_REPOSITORY_URL`:
  repository link in the footer.
- `VITE_ANILIST_URL`:
  AniList link in the footer.
  Defaults to `https://anilist.co`.
- `VITE_ANIMETHEMES_URL`:
  AnimeThemes GraphQL endpoint.
  Defaults to `https://graphql.animethemes.moe/` in production
  and to the dev proxy path `/animethemes-graphql` during development.
- `VITE_ANILIST_CLIENT_ID`:
  AniList OAuth client id.
  When empty,
  the AniList connect action is not offered and the app runs unauthenticated.
- `VITE_DEFAULT_TEMPLATE_ID`:
  template id to open when there is no hash and no last opened template.
- `VITE_EXPORT_SITE_URL`:
  URL rendered in the watermark of exported images.

For local development,
put the variables in `.env`,
for example the AniList client id registered against `http://localhost:5173/`.

## Development Proxy

The dev server proxies `/animethemes-graphql` to `https://graphql.animethemes.moe/`,
so song lookups work locally without CORS trouble.
Production builds talk to the AnimeThemes endpoint directly.

## AniList App Registration

To enable the optional login:

1. Register an AniList API client.
2. Set its redirect URI to the deployed app root,
   exactly,
   including the trailing slash and any base path,
   for example `https://<user>.github.io/<repository>/`.
3. Provide the client id as `VITE_ANILIST_CLIENT_ID`.

The implicit grant returns the access token in the URL fragment.
The app parses it,
verifies the OAuth state value,
clears the fragment immediately,
and never persists the callback URL.
See [account and settings](../guide/account-and-settings.md) for the session rules.

## Commands

- `pnpm install`:
  install dependencies.
- `pnpm dev`:
  dev server with the AnimeThemes proxy.
- `pnpm lint`:
  ESLint.
- `pnpm typecheck`:
  `vue-tsc`.
- `pnpm test`:
  Vitest.
- `pnpm build`:
  production build into `dist/`.

## Deployment

The app targets static hosting.
The GitHub Pages workflow in `.github/workflows/deploy.yml` runs typecheck,
tests,
and build on pushes to `main`,
then publishes `dist/`.
It derives `VITE_BASE_PATH`,
`VITE_REPOSITORY_URL`,
and `VITE_EXPORT_SITE_URL` from the repository,
and takes `VITE_ANILIST_CLIENT_ID` from a repository variable.

For a manual deployment,
set `VITE_BASE_PATH` to the subpath,
run `pnpm build`,
and publish `dist/`.
