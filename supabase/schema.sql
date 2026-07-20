-- MyNotion cloud storage: one row of app state per user.
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query → Run).

create table if not exists public.app_state (
  user_id text primary key,          -- Clerk user id (the JWT "sub" claim)
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- Each user can only see and touch their own row.
create policy "select own state" on public.app_state
  for select to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

create policy "insert own state" on public.app_state
  for insert to authenticated
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "update own state" on public.app_state
  for update to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "delete own state" on public.app_state
  for delete to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);
