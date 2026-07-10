-- Run this in your Supabase project: Dashboard → SQL Editor → New query → paste → Run

create table if not exists accounts (
  id         bigint primary key generated always as identity,
  name       text not null unique,
  color      text not null default '#2563eb',
  created_at timestamptz default now()
);

create table if not exists categories (
  id         bigint primary key generated always as identity,
  name       text not null unique,
  type       text not null check (type in ('income', 'expense')),
  color      text not null default '#6366f1',
  created_at timestamptz default now()
);

create table if not exists transactions (
  id          bigint primary key generated always as identity,
  amount      numeric not null check (amount > 0),
  type        text not null check (type in ('income', 'expense')),
  category_id bigint references categories(id) on delete set null,
  account_id  bigint references accounts(id) on delete restrict,
  description text,
  date        date not null,
  created_at  timestamptz default now()
);

-- Add account support to an existing Money Monitor database without touching any unrelated Supabase tables
alter table transactions add column if not exists account_id bigint references accounts(id) on delete restrict;

-- Allow public access (personal app, no login required)
alter table accounts    disable row level security;
alter table categories  disable row level security;
alter table transactions disable row level security;

-- Seed default categories
insert into categories (name, type, color) values
  ('Salary',        'income',  '#22c55e'),
  ('Freelance',     'income',  '#16a34a'),
  ('Gift',          'income',  '#4ade80'),
  ('Investment',    'income',  '#86efac'),
  ('Other Income',  'income',  '#bbf7d0'),
  ('Rent',         'expense', '#dc2626'),
  ('Pocket Money', 'expense', '#f97316'),
  ('Utilities',    'expense', '#ea580c')
on conflict (name) do nothing;


-- Seed default accounts for separate balances
insert into accounts (name, color) values
  ('Main Pool', '#2563eb'),
  ('Anna', '#ec4899'),
  ('Stelios', '#f97316'),
  ('Alexandros', '#8b5cf6')
on conflict (name) do nothing;
