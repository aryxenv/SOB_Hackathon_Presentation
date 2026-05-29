-- Raise total demo cap from €300 → €500 per client_id (browser).
-- Per-donation €300 limit is enforced in the web app only.
-- Run in Supabase → SQL Editor if you already deployed the old trigger.

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
