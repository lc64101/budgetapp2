-- ============================================================
-- Subscription catalog + unified frequency-based expenses model
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Subscription catalog (read-only for users, writable by admin)
-- ────────────────────────────────────────────────────────────
create table if not exists public.subscription_catalog (
  id               uuid        primary key default gen_random_uuid(),
  provider_name    text        not null,
  plan_name        text        not null,
  region           text        not null default 'AU',
  currency         text        not null default 'AUD',
  catalog_price    numeric(10,2) not null check (catalog_price >= 0),
  billing_period   text        not null check (billing_period in ('weekly','fortnightly','monthly','annual','ongoing')),
  display_rank     integer     not null default 100,
  status           text        not null default 'active' check (status in ('active','inactive')),
  updated_at       timestamptz not null default timezone('utc', now()),
  source_metadata  jsonb,
  constraint subscription_catalog_unique unique (provider_name, plan_name, region)
);

create index if not exists idx_subscription_catalog_fts
  on public.subscription_catalog
  using gin(to_tsvector('english', provider_name || ' ' || plan_name));

create index if not exists idx_subscription_catalog_region_rank
  on public.subscription_catalog(region, display_rank asc);

alter table public.subscription_catalog enable row level security;

drop policy if exists subscription_catalog_authenticated_read on public.subscription_catalog;
create policy subscription_catalog_authenticated_read on public.subscription_catalog
  for select using (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- 2. Extend expenses table with frequency + catalog linkage
-- ────────────────────────────────────────────────────────────
alter table public.expenses
  add column if not exists frequency       text          not null default 'monthly'
    check (frequency in ('weekly','fortnightly','monthly','annual','ongoing')),
  add column if not exists vendor          text,
  add column if not exists catalog_plan_id uuid
    references public.subscription_catalog(id) on delete set null,
  add column if not exists catalog_price   numeric(10,2),
  add column if not exists user_price      numeric(10,2);

-- ────────────────────────────────────────────────────────────
-- 3. Curated subscription catalog seed — AU / AUD
-- ────────────────────────────────────────────────────────────
insert into public.subscription_catalog
  (provider_name, plan_name, region, currency, catalog_price, billing_period, display_rank)
values
  -- Netflix
  ('Netflix',            'Standard with Ads',  'AU', 'AUD',   8.99, 'monthly',  1),
  ('Netflix',            'Standard',           'AU', 'AUD',  18.99, 'monthly',  2),
  ('Netflix',            'Premium (4K)',        'AU', 'AUD',  25.99, 'monthly',  3),
  -- Spotify
  ('Spotify',            'Premium Individual', 'AU', 'AUD',  14.99, 'monthly',  4),
  ('Spotify',            'Premium Duo',        'AU', 'AUD',  19.99, 'monthly',  5),
  ('Spotify',            'Premium Family',     'AU', 'AUD',  22.99, 'monthly',  6),
  -- Disney+
  ('Disney+',            'Standard',           'AU', 'AUD',   7.99, 'monthly',  7),
  ('Disney+',            'Premium',            'AU', 'AUD',  13.99, 'monthly',  8),
  -- Apple TV+
  ('Apple TV+',          'Individual',         'AU', 'AUD',  12.99, 'monthly',  9),
  -- YouTube Premium
  ('YouTube Premium',    'Individual',         'AU', 'AUD',  16.99, 'monthly', 10),
  ('YouTube Premium',    'Family',             'AU', 'AUD',  22.99, 'monthly', 11),
  -- Amazon Prime
  ('Amazon Prime',       'Monthly',            'AU', 'AUD',   9.99, 'monthly', 12),
  ('Amazon Prime',       'Annual',             'AU', 'AUD',  79.99, 'annual',  13),
  -- Binge (AU)
  ('Binge',              'Basic',              'AU', 'AUD',  10.00, 'monthly', 14),
  ('Binge',              'Standard',           'AU', 'AUD',  18.00, 'monthly', 15),
  ('Binge',              'Maxi',               'AU', 'AUD',  22.00, 'monthly', 16),
  -- Stan (AU)
  ('Stan',               'Basic',              'AU', 'AUD',  10.00, 'monthly', 17),
  ('Stan',               'Standard',           'AU', 'AUD',  14.00, 'monthly', 18),
  ('Stan',               'Premium',            'AU', 'AUD',  19.00, 'monthly', 19),
  -- Paramount+
  ('Paramount+',         'Essential',          'AU', 'AUD',   8.99, 'monthly', 20),
  ('Paramount+',         'Premium',            'AU', 'AUD',  14.99, 'monthly', 21),
  -- Apple One
  ('Apple One',          'Individual',         'AU', 'AUD',  22.95, 'monthly', 22),
  ('Apple One',          'Family',             'AU', 'AUD',  35.95, 'monthly', 23),
  -- iCloud+
  ('iCloud+',            '50 GB',              'AU', 'AUD',   1.49, 'monthly', 24),
  ('iCloud+',            '200 GB',             'AU', 'AUD',   4.99, 'monthly', 25),
  ('iCloud+',            '2 TB',               'AU', 'AUD',  14.99, 'monthly', 26),
  -- Google One
  ('Google One',         '100 GB',             'AU', 'AUD',   2.49, 'monthly', 27),
  ('Google One',         '200 GB',             'AU', 'AUD',   3.99, 'monthly', 28),
  ('Google One',         '2 TB',               'AU', 'AUD',  12.99, 'monthly', 29),
  -- Microsoft 365
  ('Microsoft 365',      'Personal',           'AU', 'AUD', 119.99, 'annual',  30),
  ('Microsoft 365',      'Family',             'AU', 'AUD', 179.99, 'annual',  31),
  -- Adobe
  ('Adobe Creative Cloud','All Apps',          'AU', 'AUD',  89.99, 'monthly', 32),
  ('Adobe Acrobat',      'Standard',           'AU', 'AUD',  24.99, 'monthly', 33),
  -- Audible
  ('Audible',            'Plus',               'AU', 'AUD',  14.95, 'monthly', 34),
  ('Audible',            'Premium Plus',       'AU', 'AUD',  16.45, 'monthly', 35),
  -- Other
  ('Duolingo',           'Super',              'AU', 'AUD',  14.99, 'monthly', 36),
  ('Strava',             'Premium',            'AU', 'AUD',  14.99, 'monthly', 37),
  ('Xbox Game Pass',     'Ultimate',           'AU', 'AUD',  19.95, 'monthly', 38),
  ('PlayStation Plus',   'Essential',          'AU', 'AUD',  11.95, 'monthly', 39),
  ('PlayStation Plus',   'Extra',              'AU', 'AUD',  18.95, 'monthly', 40),
  ('PlayStation Plus',   'Premium',            'AU', 'AUD',  20.95, 'monthly', 41),
  ('Headspace',          'Annual',             'AU', 'AUD',  94.99, 'annual',  42),
  ('Calm',               'Annual',             'AU', 'AUD',  74.99, 'annual',  43)
on conflict (provider_name, plan_name, region) do nothing;

-- ────────────────────────────────────────────────────────────
-- 4. Seed — US / USD
-- ────────────────────────────────────────────────────────────
insert into public.subscription_catalog
  (provider_name, plan_name, region, currency, catalog_price, billing_period, display_rank)
values
  ('Netflix',            'Standard with Ads',  'US', 'USD',   7.99, 'monthly',  1),
  ('Netflix',            'Standard',           'US', 'USD',  15.49, 'monthly',  2),
  ('Netflix',            'Premium (4K)',        'US', 'USD',  22.99, 'monthly',  3),
  ('Spotify',            'Premium Individual', 'US', 'USD',  11.99, 'monthly',  4),
  ('Spotify',            'Premium Duo',        'US', 'USD',  16.99, 'monthly',  5),
  ('Spotify',            'Premium Family',     'US', 'USD',  19.99, 'monthly',  6),
  ('Disney+',            'Basic (with Ads)',   'US', 'USD',   9.99, 'monthly',  7),
  ('Disney+',            'Premium',            'US', 'USD',  15.99, 'monthly',  8),
  ('Apple TV+',          'Individual',         'US', 'USD',   9.99, 'monthly',  9),
  ('YouTube Premium',    'Individual',         'US', 'USD',  13.99, 'monthly', 10),
  ('YouTube Premium',    'Family',             'US', 'USD',  22.99, 'monthly', 11),
  ('Amazon Prime',       'Monthly',            'US', 'USD',  14.99, 'monthly', 12),
  ('Amazon Prime',       'Annual',             'US', 'USD', 139.00, 'annual',  13),
  ('Apple One',          'Individual',         'US', 'USD',  21.95, 'monthly', 14),
  ('Apple One',          'Family',             'US', 'USD',  32.95, 'monthly', 15),
  ('iCloud+',            '50 GB',              'US', 'USD',   0.99, 'monthly', 16),
  ('iCloud+',            '200 GB',             'US', 'USD',   2.99, 'monthly', 17),
  ('iCloud+',            '2 TB',               'US', 'USD',   9.99, 'monthly', 18),
  ('Google One',         '100 GB',             'US', 'USD',   1.99, 'monthly', 19),
  ('Google One',         '2 TB',               'US', 'USD',   9.99, 'monthly', 20),
  ('Microsoft 365',      'Personal',           'US', 'USD',  99.99, 'annual',  21),
  ('Microsoft 365',      'Family',             'US', 'USD', 129.99, 'annual',  22),
  ('Adobe Creative Cloud','All Apps',          'US', 'USD',  59.99, 'monthly', 23),
  ('Xbox Game Pass',     'Ultimate',           'US', 'USD',  19.99, 'monthly', 24),
  ('PlayStation Plus',   'Essential',          'US', 'USD',   9.99, 'monthly', 25),
  ('PlayStation Plus',   'Extra',              'US', 'USD',  14.99, 'monthly', 26),
  ('PlayStation Plus',   'Premium',            'US', 'USD',  17.99, 'monthly', 27),
  ('Hulu',               'With Ads',           'US', 'USD',   7.99, 'monthly', 28),
  ('Hulu',               'No Ads',             'US', 'USD',  17.99, 'monthly', 29),
  ('Max',                'With Ads',           'US', 'USD',  15.99, 'monthly', 30)
on conflict (provider_name, plan_name, region) do nothing;

-- ────────────────────────────────────────────────────────────
-- 5. Seed — UK / GBP
-- ────────────────────────────────────────────────────────────
insert into public.subscription_catalog
  (provider_name, plan_name, region, currency, catalog_price, billing_period, display_rank)
values
  ('Netflix',            'Standard with Ads',  'UK', 'GBP',   4.99, 'monthly',  1),
  ('Netflix',            'Standard',           'UK', 'GBP',  10.99, 'monthly',  2),
  ('Netflix',            'Premium (4K)',        'UK', 'GBP',  17.99, 'monthly',  3),
  ('Spotify',            'Premium Individual', 'UK', 'GBP',  11.99, 'monthly',  4),
  ('Spotify',            'Premium Family',     'UK', 'GBP',  17.99, 'monthly',  5),
  ('Disney+',            'Standard',           'UK', 'GBP',   4.99, 'monthly',  6),
  ('Disney+',            'Premium',            'UK', 'GBP',  11.99, 'monthly',  7),
  ('Apple TV+',          'Individual',         'UK', 'GBP',   8.99, 'monthly',  8),
  ('YouTube Premium',    'Individual',         'UK', 'GBP',  13.99, 'monthly',  9),
  ('Amazon Prime',       'Monthly',            'UK', 'GBP',   8.99, 'monthly', 10),
  ('Amazon Prime',       'Annual',             'UK', 'GBP',  95.00, 'annual',  11),
  ('Xbox Game Pass',     'Ultimate',           'UK', 'GBP',  14.99, 'monthly', 12),
  ('PlayStation Plus',   'Essential',          'UK', 'GBP',   6.99, 'monthly', 13)
on conflict (provider_name, plan_name, region) do nothing;
