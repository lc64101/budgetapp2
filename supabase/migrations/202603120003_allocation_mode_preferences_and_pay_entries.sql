create table if not exists public.budget_allocation_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  active_mode text not null default 'slider' check (active_mode in ('slider', 'percent', 'value')),
  mode_payload jsonb not null default '{"slider":{"spendingPct":50,"savingPct":30,"investingPct":20},"percent":{"spendingPct":50,"savingPct":30,"investingPct":20},"value":{"spendingAmount":0,"savingAmount":0,"investingAmount":0}}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pay_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pay_cycle text not null check (pay_cycle in ('weekly', 'fortnightly', 'monthly')),
  payment_date date not null,
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists pay_entries_user_cycle_date_idx
on public.pay_entries (user_id, pay_cycle, payment_date desc);

alter table public.budget_allocation_preferences enable row level security;
alter table public.pay_entries enable row level security;

drop trigger if exists budget_allocation_preferences_touch_updated_at on public.budget_allocation_preferences;
create trigger budget_allocation_preferences_touch_updated_at
before update on public.budget_allocation_preferences
for each row execute procedure public.touch_updated_at();

drop policy if exists budget_allocation_preferences_owner_all on public.budget_allocation_preferences;
create policy budget_allocation_preferences_owner_all on public.budget_allocation_preferences
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists pay_entries_owner_all on public.pay_entries;
create policy pay_entries_owner_all on public.pay_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
