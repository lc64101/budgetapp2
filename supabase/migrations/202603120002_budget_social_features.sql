alter table public.budget_periods
add column if not exists cycle text not null default 'monthly' check (cycle in ('weekly', 'fortnightly', 'monthly'));

create table if not exists public.budget_allocations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  spending_pct numeric(5,2) not null default 50 check (spending_pct >= 0 and spending_pct <= 100),
  saving_pct numeric(5,2) not null default 30 check (saving_pct >= 0 and saving_pct <= 100),
  investing_pct numeric(5,2) not null default 20 check (investing_pct >= 0 and investing_pct <= 100),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.budget_allocations enable row level security;

drop trigger if exists budget_allocations_touch_updated_at on public.budget_allocations;
create trigger budget_allocations_touch_updated_at
before update on public.budget_allocations
for each row execute procedure public.touch_updated_at();

drop policy if exists budget_allocations_owner_all on public.budget_allocations;
create policy budget_allocations_owner_all on public.budget_allocations
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Allow friend discovery and leaderboard usernames for authenticated users.
drop policy if exists profiles_authenticated_read on public.profiles;
create policy profiles_authenticated_read on public.profiles
for select
using (auth.role() = 'authenticated');
