-- Clears all donations (useful during testing / before a live event).
-- Supabase: SQL Editor → New query → paste → Run

truncate table public.donations;
