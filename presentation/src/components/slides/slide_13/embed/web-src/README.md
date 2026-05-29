# Special Olympics Belgium — Vote & Donate (demo)

Mobile-first React app for viewing events, donating (demo), and voting for athletes. Data is loaded from CSV files; votes and donation credits persist in `localStorage`.

## Features

- **Home**: current event + upcoming events
- **Fan Wall** (single page): athletes listed by default, donate panel, vote after donating
  - Promo banner + popup when voting without credits
  - Search and filters (sport, event, region)
- **Languages**: English, French, Dutch (header switcher, persisted)

## Run locally

```bash
cd web
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Data (CSV)

Edit files in `public/data/`:

| File | Purpose |
|------|---------|
| `events.csv` | Events with `status`: `current`, `upcoming`, or `past` |
| `players.csv` | Athletes linked by `event_id` |

Localized columns use suffixes `_en`, `_fr`, `_nl` (e.g. `title_en`, `title_fr`, `title_nl`).

## Build

```bash
npm run build
npm run preview
```

## Stack

- React 19 + TypeScript + Vite
- React Router
- No backend — CSV + `localStorage` only
