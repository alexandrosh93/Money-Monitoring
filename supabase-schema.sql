-- Run this in your Supabase project: Dashboard → SQL Editor → New query → paste → Run
-- This app uses money_monitor_* table names so it does not touch Anna's or any other project's tables.

create table if not exists money_monitor_accounts (
  id         bigint primary key generated always as identity,
  name       text not null unique,
  color      text not null default '#2563eb',
  created_at timestamptz default now()
);

create table if not exists money_monitor_categories (
  id         bigint primary key generated always as identity,
  name       text not null unique,
  type       text not null check (type in ('income', 'expense')),
  color      text not null default '#6366f1',
  created_at timestamptz default now()
);

create table if not exists money_monitor_transactions (
  id          bigint primary key generated always as identity,
  amount      numeric not null check (amount > 0),
  type        text not null check (type in ('income', 'expense')),
  category_id bigint references money_monitor_categories(id) on delete set null,
  account_id  bigint references money_monitor_accounts(id) on delete restrict,
  legacy_transaction_id bigint unique,
  description text,
  date        date not null,
  created_at  timestamptz default now()
);

-- Allow public access for the Money Monitor app only (personal app, no login required)
alter table money_monitor_accounts     disable row level security;
alter table money_monitor_categories   disable row level security;
alter table money_monitor_transactions disable row level security;

alter table money_monitor_transactions add column if not exists legacy_transaction_id bigint unique;

-- Optional one-time migration from the original Money Monitor tables.
-- This copies old movements into Main Pool, but never deletes or changes the old tables.
do $$
declare
  main_pool_id bigint;
begin
  select id into main_pool_id from money_monitor_accounts where name = 'Main Pool' limit 1;

  if main_pool_id is null then
    insert into money_monitor_accounts (name, color) values ('Main Pool', '#2563eb') returning id into main_pool_id;
  end if;

  if to_regclass('public.categories') is not null then
    execute $migrate_categories$
      insert into money_monitor_categories (name, type, color)
      select name, type, color from public.categories
      on conflict (name) do nothing
    $migrate_categories$;
  end if;

  if to_regclass('public.transactions') is not null then
    execute $migrate_transactions$
      insert into money_monitor_transactions (amount, type, category_id, account_id, legacy_transaction_id, description, date, created_at)
      select
        t.amount,
        t.type,
        mmc.id,
        $1,
        t.id,
        t.description,
        t.date,
        t.created_at
      from public.transactions t
      left join public.categories c on c.id = t.category_id
      left join money_monitor_categories mmc on mmc.name = c.name
      where not exists (
        select 1 from money_monitor_transactions existing where existing.legacy_transaction_id = t.id
      )
    $migrate_transactions$ using main_pool_id;
  end if;
end $$;

-- Seed default Money Monitor categories without overwriting existing rows
insert into money_monitor_categories (name, type, color) values
  ('Salary',        'income',  '#22c55e'),
  ('Freelance',     'income',  '#16a34a'),
  ('Gift',          'income',  '#4ade80'),
  ('Investment',    'income',  '#86efac'),
  ('Other Income',  'income',  '#bbf7d0'),
  ('Rent',         'expense', '#dc2626'),
  ('Pocket Money', 'expense', '#f97316'),
  ('Utilities',    'expense', '#ea580c')
on conflict (name) do nothing;

-- Seed default Money Monitor accounts for separate balances without overwriting existing rows
insert into money_monitor_accounts (name, color) values
  ('Main Pool', '#2563eb'),
  ('Anna', '#ec4899'),
  ('Stelios', '#f97316'),
  ('Alexandros', '#8b5cf6')
on conflict (name) do nothing;
