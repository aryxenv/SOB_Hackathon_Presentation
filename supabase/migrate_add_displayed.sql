-- Track whether a lit athlete was already shown with meteor/wave animation.
-- Run in Supabase → SQL Editor after schema.sql.

alter table public.donations
  add column if not exists displayed boolean not null default false;

comment on column public.donations.displayed is
  'True after any client has played the landing animation for this row.';

-- Rows already in the DB should not replay meteors on refresh.
update public.donations set displayed = true where not displayed;

grant update (displayed) on table public.donations to anon, authenticated;

drop policy if exists "donations_mark_displayed" on public.donations;
create policy "donations_mark_displayed"
  on public.donations
  for update
  to anon, authenticated
  using (displayed = false)
  with check (displayed = true);
