# Special Olympics Belgium × Thomas More — Hackathon 2026

> [!NOTE]
> This presentation is built for a big screen and does **not** render well on phones. On mobile, try the live donation app instead: [**https://karoliskalinauskas1.github.io/SOB_Hackathon/**](https://karoliskalinauskas1.github.io/SOB_Hackathon/)

🥇 **First place** — final hackathon of the Data Science, Protection & Security course.

Instead of a PowerPoint, this is a **web-based presentation**: every slide is its own little mini-app, fully built on web technology (React + Vite + Three.js).

## Getting started

This is a custom **web-based presentation**, these are the basic controls:

- **← / →** — previous / next slide
- **Spacebar** — trigger in-slide animations

> [!TIP]
> Press **spacebar** on every slide — some have hidden animations you might not expect. Not all slides support it.

### Online

https://aryxenv.github.io/SOB_Hackathon_Presentation/

### Run locally

1. **Set up Supabase** — follow [`supabase/README.md`](./supabase/README.md) to create a project and run the schema.
2. **Add your keys** — in `presentation/`, create a `.env.local` file:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

3. **Install & run:**

   ```pwsh
   cd presentation
   npm install
   npm run dev
   ```

   Open http://localhost:5173

## Team

Built together by:

- Karolis Kalinauskas
- Daryna Denysenko
- Lanre Adetola
- Aryan Shah

Special thanks to **Collin Van Der Vorst** for the amazing feedback which brought this to the level where it is at today.
