# Presentation (web app)

React + Vite + Three.js deck. Each slide is its own mini-app.

## Setup

1. Set up Supabase first — see [`../supabase/README.md`](../supabase/README.md).
2. Create `.env.local` in this folder:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

## Run

```pwsh
npm install
npm run dev
```

Open http://localhost:5173

## Controls

- **← / →** — change slide
- **Spacebar** — in-slide animations (try every slide; not all support it)
