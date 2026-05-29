# Slide 13 phone embed

This folder vendors the SOB donation **web app** (both its source and a built
snapshot) so slide 13 can display it inside the phone bezel from a same-origin
URL. Everything lives inside this folder — nothing in the presentation reaches
into the top-level `web/` folder at build time or runtime.

## Layout

```
embed/
  web-src/         # vendored SOURCE snapshot of the web app (committed)
  web-dist/        # built output of web-src, served at /phone-app/ (committed)
  build.ps1        # rebuilds web-dist from web-src (in-repo, reproducible)
  vitePlugin.ts    # Vite plugin: serves web-dist at /phone-app/ in dev and build
  README.md        # this file
```

`PhonePreview.tsx` (in the sibling `components/` folder) loads the embed via
`<iframe src="/phone-app/" />`. Because that URL is served by the presentation's
own Vite server, the iframe is same-origin, which lets the component inject a
small stylesheet into the iframe to hide scrollbars and trim the header for the
phone bezel.

The big globe on the slide and the phone both talk to the same Supabase
`donations` table, so a donation made in the phone live-syncs onto the big globe
(see `../lib/donationFeed.ts`).

## Refreshing the embed (in-repo, no `web/` access)

The snapshot does not auto-update. When `web-src` changes (or you update it from
the canonical `web/` app) and you want those changes in slide 13, rebuild from
this folder:

```powershell
cd presentation/src/components/slides/slide_13/embed
./build.ps1
```

`build.ps1` installs `web-src` deps if needed, builds it, and replaces
`web-dist`. It picks up Supabase credentials automatically from the
presentation's `.env.local` (or `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
env vars, or `-SupabaseUrl` / `-AnonKey` parameters). Anyone who clones the repo
can run it — no external/temp directory and no dependency on the top-level
`web/` folder.

## Keeping the deck's tooling clean

`web-src` is its own self-contained app with its own `package.json`/`tsconfig`.
It is excluded from the presentation's TypeScript build and ESLint
(`tsconfig.app.json` `exclude` + `eslint.config.js` `globalIgnores`) so the deck
never tries to type-check or lint the embedded app. Vite only bundles it through
the static `web-dist` snapshot, never the source.
