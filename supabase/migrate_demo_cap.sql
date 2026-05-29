-- Run if you already applied schema.sql without the demo cap trigger,
-- or run migrate_update_donation_caps.sql to raise an existing cap to €500.

create or replace function public.enforce_demo_donation_cap()
returns trigger
language plpgsql
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
      using hint = format('Demo limit: €%s total per browser (client_id).', demo_cap);
  end if;

  return new;
end;
$$;

drop trigger if exists donations_demo_cap on public.donations;
create trigger donations_demo_cap
  before insert on public.donations
  for each row
  execute function public.enforce_demo_donation_cap();
