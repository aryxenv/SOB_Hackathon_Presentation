# Supabase setup

The app reads donations from Supabase so every screen shows the same shared globe.

## 1. Create a project

Go to [supabase.com](https://supabase.com), sign in, and create a **New project**. Wait until it's ready.

## 2. Run the schema

In Supabase: **SQL Editor → New query** → paste and run [`schema.sql`](./schema.sql).

> Upgrading an existing project instead? Run [`migrate_running.sql`](./migrate_running.sql) (idempotent, keeps your data).

## 3. Copy your keys

In Supabase: **Project Settings → API**, then add them to `presentation/.env.local`:

```env
VITE_SUPABASE_URL=<Project URL>
VITE_SUPABASE_ANON_KEY=<anon public key>
```

## Reset test data

Before a live demo, run [`reset.sql`](./reset.sql) to empty the table.
