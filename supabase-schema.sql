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

-- Seed default Money Monitor accounts for separate balances without overwriting existing rows
insert into money_monitor_accounts (name, color) values
  ('Main Pool', '#2563eb'),
  ('Anna', '#ec4899'),
  ('Stelios', '#f97316'),
  ('Alexandros', '#8b5cf6')
on conflict (name) do nothing;
