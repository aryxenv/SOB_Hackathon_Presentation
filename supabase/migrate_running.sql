-- =============================================================================
-- SOB Hackathon — upgrade a LIVE Supabase project (idempotent)
-- =============================================================================
-- Safe to run while the app is in use. Run in Supabase → SQL Editor → Run.
-- Re-running is OK: uses IF NOT EXISTS / CREATE OR REPLACE / DROP IF EXISTS.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Table + columns (add anything missing on older schemas)
-- -----------------------------------------------------------------------------

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  amount integer not null check (amount > 0),
  donor_alias text,
  client_id text not null,
  point_index integer not null check (point_index >= 0 and point_index < 7000),
  x double precision not null,
  y double precision not null,
  z double precision not null,
  created_at timestamptz not null default now(),
  displayed boolean not null default false
);

alter table public.donations
  add column if not exists donor_alias text,
  add column if not exists client_id text,
  add column if not exists point_index integer,
  add column if not exists x double precision,
  add column if not exists y double precision,
  add column if not exists z double precision,
  add column if not exists created_at timestamptz default now(),
  add column if not exists displayed boolean not null default false;

comment on table public.donations is
  'One row per lit athlete on the 3D globe. Append-only.';
comment on column public.donations.displayed is
  'True after any client has played the landing animation for this row.';

-- Remove broken legacy rows (no coordinates) if any remain.
delete from public.donations
where point_index is null or x is null or y is null or z is null;

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------

create unique index if not exists donations_point_index_unique
  on public.donations (point_index);

create index if not exists donations_created_at_idx
  on public.donations (created_at asc);

create index if not exists donations_client_id_idx
  on public.donations (client_id);

-- -----------------------------------------------------------------------------
-- Row level security + grants
-- -----------------------------------------------------------------------------

alter table public.donations enable row level security;

drop policy if exists "donations_select_public" on public.donations;
create policy "donations_select_public"
  on public.donations
  for select
  to anon, authenticated
  using (true);

drop policy if exists "donations_insert_public" on public.donations;
create policy "donations_insert_public"
  on public.donations
  for insert
  to anon, authenticated
  with check (true);

revoke update, delete on public.donations from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select, insert on table public.donations to anon, authenticated;
grant update (displayed) on table public.donations to anon, authenticated;

drop policy if exists "donations_mark_displayed" on public.donations;
create policy "donations_mark_displayed"
  on public.donations
  for update
  to anon, authenticated
  using (displayed = false)
  with check (displayed = true);

-- -----------------------------------------------------------------------------
-- Backfill: rows already in the DB were shown before this feature existed.
-- -----------------------------------------------------------------------------

update public.donations set displayed = true where not displayed;

-- -----------------------------------------------------------------------------
-- Demo cap: €500 total per browser
-- -----------------------------------------------------------------------------

create or replace function public.enforce_demo_donation_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prior_total integer;
  demo_cap constant integer := 500;
begin
  select coalesce(sum(amount), 0)::integer
  into prior_total
  from public.donations
  where client_id = new.client_id;

  if prior_total + new.amount > demo_cap then
    raise exception 'demo_donation_cap_exceeded'
      using
        errcode = 'P0001',
        hint = format('Demo limit: €%s total per browser (client_id).', demo_cap);
  end if;

  return new;
end;
$$;

drop trigger if exists donations_demo_cap on public.donations;
create trigger donations_demo_cap
  before insert on public.donations
  for each row
  execute function public.enforce_demo_donation_cap();
