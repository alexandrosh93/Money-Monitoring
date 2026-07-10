-- Run this in your Supabase project: Dashboard → SQL Editor → New query → paste → Run
-- This app uses money_monitor_* table names so it does not touch Anna's or any other project's tables.

create table if not exists money_monitor_accounts (
  id         bigint primary key generated always as identity,
  name       text not null unique,
  color      text not null default '#2563eb',
  group_name text,
  kind       text check (kind in ('cash', 'bank')),
  created_at timestamptz default now()
);

-- Add group_name/kind to accounts created before this feature existed
alter table money_monitor_accounts add column if not exists group_name text;
alter table money_monitor_accounts add column if not exists kind text check (kind in ('cash', 'bank'));

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
  description text,
  date        date not null,
  created_at  timestamptz default now()
);

-- Allow public access for the Money Monitor app only (personal app, no login required)
alter table money_monitor_accounts     disable row level security;
alter table money_monitor_categories   disable row level security;
alter table money_monitor_transactions disable row level security;

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

-- Rename any previously seeded single-account rows into their Cash sub-account
-- (safe to run repeatedly: no-op if 'Anna'/'Stelios'/'Alexandros' don't exist)
update money_monitor_accounts set name = 'Anna - Cash' where name = 'Anna';
update money_monitor_accounts set name = 'Stelios - Cash' where name = 'Stelios';
update money_monitor_accounts set name = 'Alexandros - Cash' where name = 'Alexandros';

-- Seed default Money Monitor accounts for separate balances without overwriting existing rows
-- Anna, Stelios and Alexandros each get a Cash and a Bank sub-account with independent balances,
-- grouped under group_name so the app can show a combined total per person plus the breakdown
insert into money_monitor_accounts (name, color, group_name, kind) values
  ('Main Pool', '#2563eb', null, null),
  ('Anna - Cash', '#ec4899', 'Anna', 'cash'),
  ('Anna - Bank', '#f472b6', 'Anna', 'bank'),
  ('Stelios - Cash', '#f97316', 'Stelios', 'cash'),
  ('Stelios - Bank', '#fb923c', 'Stelios', 'bank'),
  ('Alexandros - Cash', '#8b5cf6', 'Alexandros', 'cash'),
  ('Alexandros - Bank', '#a78bfa', 'Alexandros', 'bank')
on conflict (name) do nothing;

-- Backfill group_name/kind for accounts inserted before this feature existed
update money_monitor_accounts set group_name = 'Anna', kind = 'cash' where name = 'Anna - Cash' and group_name is null;
update money_monitor_accounts set group_name = 'Anna', kind = 'bank' where name = 'Anna - Bank' and group_name is null;
update money_monitor_accounts set group_name = 'Stelios', kind = 'cash' where name = 'Stelios - Cash' and group_name is null;
update money_monitor_accounts set group_name = 'Stelios', kind = 'bank' where name = 'Stelios - Bank' and group_name is null;
update money_monitor_accounts set group_name = 'Alexandros', kind = 'cash' where name = 'Alexandros - Cash' and group_name is null;
update money_monitor_accounts set group_name = 'Alexandros', kind = 'bank' where name = 'Alexandros - Bank' and group_name is null;
