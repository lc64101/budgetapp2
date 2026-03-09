create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  dark_mode boolean not null default false,
  pay_frequency text not null default 'monthly' check (pay_frequency in ('weekly', 'fortnightly', 'monthly')),
  updated_at timestamptz not null default timezone('utc', now()),
  version integer not null default 1,
  last_modified_by_session text not null default 'system'
);

create table if not exists public.budget_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  income numeric(12,2) not null check (income >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  version integer not null default 1,
  last_modified_by_session text not null default 'system'
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  budget_period_id uuid references public.budget_periods(id) on delete cascade,
  category text not null,
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  spent_at date not null default current_date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  version integer not null default 1,
  last_modified_by_session text not null default 'system'
);

create table if not exists public.historical_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recorded_on date not null,
  savings_rate numeric(5,2) not null,
  spending_score numeric(6,2) not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sharing_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  share_data boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (from_user_id, to_user_id),
  check (from_user_id <> to_user_id)
);

create table if not exists public.friends (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

create index if not exists idx_budget_periods_user_id on public.budget_periods(user_id);
create index if not exists idx_expenses_user_id on public.expenses(user_id);
create index if not exists idx_expenses_budget_period_id on public.expenses(budget_period_id);
create index if not exists idx_friend_requests_to_user_id on public.friend_requests(to_user_id);
create index if not exists idx_friends_user_id on public.friends(user_id);
create index if not exists idx_historical_metrics_user_day on public.historical_metrics(user_id, recorded_on desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.bump_version()
returns trigger
language plpgsql
as $$
begin
  new.version = old.version + 1;
  return new;
end;
$$;

drop trigger if exists app_settings_touch_updated_at on public.app_settings;
create trigger app_settings_touch_updated_at
before update on public.app_settings
for each row execute procedure public.touch_updated_at();

drop trigger if exists budget_periods_touch_updated_at on public.budget_periods;
create trigger budget_periods_touch_updated_at
before update on public.budget_periods
for each row execute procedure public.touch_updated_at();

drop trigger if exists expenses_touch_updated_at on public.expenses;
create trigger expenses_touch_updated_at
before update on public.expenses
for each row execute procedure public.touch_updated_at();

drop trigger if exists app_settings_bump_version on public.app_settings;
create trigger app_settings_bump_version
before update on public.app_settings
for each row execute procedure public.bump_version();

drop trigger if exists budget_periods_bump_version on public.budget_periods;
create trigger budget_periods_bump_version
before update on public.budget_periods
for each row execute procedure public.bump_version();

drop trigger if exists expenses_bump_version on public.expenses;
create trigger expenses_bump_version
before update on public.expenses
for each row execute procedure public.bump_version();

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.budget_periods enable row level security;
alter table public.expenses enable row level security;
alter table public.historical_metrics enable row level security;
alter table public.sharing_preferences enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friends enable row level security;

create policy if not exists profiles_self_read on public.profiles for select using (auth.uid() = id);
create policy if not exists profiles_self_update on public.profiles for update using (auth.uid() = id);
create policy if not exists profiles_self_insert on public.profiles for insert with check (auth.uid() = id);

create policy if not exists app_settings_owner_all on public.app_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists budget_periods_owner_all on public.budget_periods for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists expenses_owner_all on public.expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists sharing_prefs_owner_all on public.sharing_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists historical_metrics_owner_or_shared on public.historical_metrics
for select
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.sharing_preferences sp
    where sp.user_id = historical_metrics.user_id
      and sp.share_data = true
  )
);

create policy if not exists friend_requests_recipient_or_sender_read on public.friend_requests
for select
using (auth.uid() = to_user_id or auth.uid() = from_user_id);

create policy if not exists friend_requests_sender_insert on public.friend_requests
for insert
with check (auth.uid() = from_user_id);

create policy if not exists friend_requests_recipient_delete on public.friend_requests
for delete
using (auth.uid() = to_user_id or auth.uid() = from_user_id);

create policy if not exists friends_owner_read on public.friends for select using (auth.uid() = user_id);
create policy if not exists friends_owner_insert on public.friends for insert with check (auth.uid() = user_id);
create policy if not exists friends_owner_delete on public.friends for delete using (auth.uid() = user_id);

create or replace function public.rpc_update_app_settings(
  p_dark_mode boolean,
  p_pay_frequency text,
  p_expected_version integer,
  p_session_id text
)
returns public.app_settings
language plpgsql
security invoker
as $$
declare
  v_uid uuid := auth.uid();
  v_record public.app_settings;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_pay_frequency not in ('weekly', 'fortnightly', 'monthly') then
    raise exception 'Invalid pay_frequency value';
  end if;

  update public.app_settings
  set
    dark_mode = p_dark_mode,
    pay_frequency = p_pay_frequency,
    last_modified_by_session = coalesce(nullif(p_session_id, ''), 'unknown')
  where user_id = v_uid and version = p_expected_version
  returning * into v_record;

  if not found then
    raise exception 'Version conflict';
  end if;

  return v_record;
end;
$$;

create or replace function public.rpc_accept_friend_request(p_request_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_from uuid;
  v_to uuid;
begin
  select from_user_id, to_user_id
    into v_from, v_to
  from public.friend_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Friend request not found';
  end if;

  if auth.uid() <> v_to then
    raise exception 'Not authorized';
  end if;

  insert into public.friends(user_id, friend_id)
  values (v_to, v_from), (v_from, v_to)
  on conflict do nothing;

  delete from public.friend_requests where id = p_request_id;
end;
$$;
