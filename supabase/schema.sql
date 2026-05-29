-- =============================================================================
-- SOB Hackathon — donation globe (Supabase)
-- =============================================================================
-- Run once in Supabase → SQL Editor → New query → paste → Run
--
-- • One row = one lit athlete (€25 = 1 row; €50 = 2 rows, etc.)
-- • point_index + x,y,z stored so every screen shows the same globe (no overlap)
-- • client_id = random id in the browser (no registration); black vs red meteors
-- • RLS: open read + open insert (demo)
-- • €500 max total per client_id (enforced by trigger, not RLS)
-- • €300 max per single donation enforced in the web app
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Table
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

comment on table public.donations is
  'One row per lit athlete on the 3D globe. Append-only.';
comment on column public.donations.amount is
  'Euros for this athlete row (usually 25). Summed per client_id for the demo cap.';
comment on column public.donations.donor_alias is
  'Display name from the donate form (optional).';
comment on column public.donations.client_id is
  'Browser id from localStorage. Same id → black meteors on that device.';
comment on column public.donations.point_index is
  'Index into the fixed 7000-point mesh. Unique — two donations cannot share a spot.';
comment on column public.donations.x is 'Sphere position X at lighting time.';
comment on column public.donations.y is 'Sphere position Y at lighting time.';
comment on column public.donations.z is 'Sphere position Z at lighting time.';
comment on column public.donations.displayed is
  'True after any client has played the landing animation for this row.';

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------

-- No two lit athletes on the same physical point.
create unique index if not exists donations_point_index_unique
  on public.donations (point_index);

-- Feed polling / ordering.
create index if not exists donations_created_at_idx
  on public.donations (created_at asc);

-- Demo cap: sum(amount) per browser.
create index if not exists donations_client_id_idx
  on public.donations (client_id);

-- -----------------------------------------------------------------------------
-- Row level security (open for demo)
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

-- Append-only except marking animations as displayed.
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
-- Demo cap: €500 total per browser (client_id)
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

-- -----------------------------------------------------------------------------
-- Upgrading a database that is already running?
-- -----------------------------------------------------------------------------
-- Run migrate_running.sql in the SQL Editor (safe to re-run).
