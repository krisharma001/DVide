-- ==============================================================================
-- DVide — Supabase Realtime & Guest Anon Schema Fix
-- Run this in the Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Ensure tables exist with flexible TEXT primary keys so guest devices can write
create table if not exists public.rooms (
  id text primary key,
  name text not null,
  created_by text,
  invite_code text unique not null,
  currency text default '₹' not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.room_members (
  id text primary key,
  room_id text references public.rooms(id) on delete cascade not null,
  user_id text not null,
  display_name text not null,
  joined_at timestamptz default timezone('utc'::text, now()) not null,
  unique(room_id, user_id)
);

create table if not exists public.expenses (
  id text primary key,
  room_id text references public.rooms(id) on delete cascade not null,
  created_by text,
  description text not null,
  category text not null default 'other',
  subtotal numeric(12,2) not null,
  tax_rate numeric(5,2) default 0 not null,
  tax_amount numeric(12,2) default 0 not null,
  tax_type text default 'added' not null,
  tax_split_method text default 'proportional' not null,
  service_charge numeric(12,2) default 0 not null,
  tip numeric(12,2) default 0 not null,
  discount numeric(12,2) default 0 not null,
  total_amount numeric(12,2) not null,
  currency text default '₹' not null,
  paid_by_user_id text not null,
  split_method text default 'equal' not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.expense_splits (
  id text primary key default ('s_' || substr(md5(random()::text), 1, 10)),
  expense_id text references public.expenses(id) on delete cascade not null,
  user_id text not null,
  amount numeric(12,2) not null,
  tax_amount numeric(12,2) default 0 not null,
  total_share numeric(12,2) not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.chat_messages (
  id text primary key,
  room_id text references public.rooms(id) on delete cascade not null,
  user_id text not null,
  message text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.settlements (
  id text primary key,
  room_id text references public.rooms(id) on delete cascade not null,
  from_user_id text not null,
  to_user_id text not null,
  amount numeric(12,2) not null,
  is_settled boolean default true not null,
  settled_at timestamptz default timezone('utc'::text, now()) not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Open RLS Policies for Anon & Authenticated Guest Usage
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.chat_messages enable row level security;
alter table public.settlements enable row level security;

-- Drop existing restrictive policies if any
drop policy if exists "Public rooms access" on public.rooms;
drop policy if exists "Public members access" on public.room_members;
drop policy if exists "Public expenses access" on public.expenses;
drop policy if exists "Public splits access" on public.expense_splits;
drop policy if exists "Public chat access" on public.chat_messages;
drop policy if exists "Public settlements access" on public.settlements;

-- Create permissive policies for peer-to-peer guest apps
create policy "Public rooms access" on public.rooms for all to anon, authenticated using (true) with check (true);
create policy "Public members access" on public.room_members for all to anon, authenticated using (true) with check (true);
create policy "Public expenses access" on public.expenses for all to anon, authenticated using (true) with check (true);
create policy "Public splits access" on public.expense_splits for all to anon, authenticated using (true) with check (true);
create policy "Public chat access" on public.chat_messages for all to anon, authenticated using (true) with check (true);
create policy "Public settlements access" on public.settlements for all to anon, authenticated using (true) with check (true);

-- 3. Enable Supabase Realtime Replication on all tables
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_members;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.expense_splits;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.settlements;
