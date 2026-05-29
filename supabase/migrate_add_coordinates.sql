-- Run this if you already created `donations` without x,y,z (older schema).
-- Supabase: SQL Editor → New query → paste → Run
-- Then truncate or delete old rows that have no coordinates.

alter table public.donations
  add column if not exists point_index integer,
  add column if not exists x double precision,
  add column if not exists y double precision,
  add column if not exists z double precision;

-- Remove rows from the old schema (one row per payment, no coordinates).
delete from public.donations
where point_index is null or x is null or y is null or z is null;

alter table public.donations
  alter column point_index set not null,
  alter column x set not null,
  alter column y set not null,
  alter column z set not null;

create unique index if not exists donations_point_index_unique
  on public.donations (point_index);
