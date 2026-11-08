# SpotHop Web

SpotHop is a social network for finding, sharing and discussing skate spots. This repository is the
web app (an installable PWA).

## Stack

- **UI:** React 19, Vite, MUI, TypeScript
- **Routing / data:** TanStack Router (file-based) and TanStack Query (persisted to IndexedDB), Jotai for client state
- **Backend:** Supabase (Postgres + RLS, Auth, Storage, Realtime, Edge Functions)
- **Maps:** Leaflet with CARTO tiles; Google Places Autocomplete, loaded lazily on first search
- **Media:** client-side image optimization (WebP + thumbnails) and WebCodecs video trimming (hardware H.264, via mediabunny)
- **Analytics:** PostHog
- **Hosting:** Vercel

## Getting started

```sh
pnpm install
cp .env.example .env      # then fill in the values
pnpm dev                  # http://localhost:5000
```

### Environment variables

See [.env.example](.env.example) for the full list.

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Supabase project URL and publishable key |
| `VITE_GOOGLE_MAPS_API_KEY` | Places Autocomplete and Geocoding (restrict by referrer) |
| `VITE_CARTO_API_KEY` | CARTO basemap tiles (restrict by domain) |
| `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST` | Analytics |

Everything prefixed `VITE_` ships to the browser, so only use public keys. Edge function secrets
(`SIGHTENGINE_USER`, `SIGHTENGINE_SECRET`) are set with `supabase secrets set`, not in `.env`.
Production values live in the Vercel project's environment variables; Vite reads them at build
time, so redeploy after changing one.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server on port 5000 |
| `pnpm build` | Type-check (`tsc -b`) and production build |
| `pnpm test` | Vitest in watch mode (`pnpm exec vitest run` for a single run) |
| `pnpm coverage` | Tests with coverage |
| `pnpm lint` | ESLint |

## Project layout

See [project-structure.md](project-structure.md) for the directory map, [DOCS/](DOCS/) for features
and roadmap, [sprints/](sprints/) for sprint history, and [TESTING/](TESTING/) for manual test cases.

## Database

Schema changes live in `supabase/migrations/`. Row Level Security is the real access control, since
the browser talks to Postgres directly; every new table needs policies. After changing the schema,
check Supabase's security and performance advisors.

## Deployment

Pushes to `main` deploy to Vercel. Supabase Auth must allow the deployed origin under
Authentication -> URL Configuration (Site URL and Redirect URLs), or password-reset and signup
emails will redirect to the wrong place.
