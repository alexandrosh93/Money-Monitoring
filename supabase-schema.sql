-- Run this in your Supabase project: Dashboard → SQL Editor → New query → paste → Run

create table categories (
  id         bigint primary key generated always as identity,
  name       text not null unique,
  type       text not null check (type in ('income', 'expense')),
  color      text not null default '#6366f1',
  created_at timestamptz default now()
);

create table transactions (
  id          bigint primary key generated always as identity,
  amount      numeric not null check (amount > 0),
  type        text not null check (type in ('income', 'expense')),
  category_id bigint references categories(id) on delete set null,
  description text,
  date        date not null,
  created_at  timestamptz default now()
);

-- Allow public access (personal app, no login required)
alter table categories  disable row level security;
alter table transactions disable row level security;

-- Seed default categories
insert into categories (name, type, color) values
  ('Salary',        'income',  '#22c55e'),
  ('Freelance',     'income',  '#16a34a'),
  ('Gift',          'income',  '#4ade80'),
  ('Investment',    'income',  '#86efac'),
  ('Other Income',  'income',  '#bbf7d0'),
  ('Food & Dining', 'expense', '#ef4444'),
  ('Transport',     'expense', '#f97316'),
  ('Entertainment', 'expense', '#a855f7'),
  ('Rent',          'expense', '#dc2626'),
  ('Utilities',     'expense', '#ea580c'),
  ('Healthcare',    'expense', '#ec4899'),
  ('Shopping',      'expense', '#8b5cf6'),
  ('Education',     'expense', '#06b6d4'),
  ('Other Expense', 'expense', '#94a3b8');
