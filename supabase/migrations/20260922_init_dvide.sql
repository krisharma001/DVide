-- ==============================================================================
-- DVide — Production Supabase PostgreSQL Schema & Row Level Security (RLS)
-- ==============================================================================

-- 1. Profiles Table (syncs with auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  avatar_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Rooms Table
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  invite_code text unique not null,
  currency text default '₹' not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Room Members Table
create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  display_name text not null,
  joined_at timestamptz default timezone('utc'::text, now()) not null,
  unique(room_id, user_id)
);

-- 4. Expenses Table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null,
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
  paid_by_user_id uuid references public.profiles(id) on delete restrict not null,
  split_method text default 'equal' not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. Expense Splits Table
create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references public.expenses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12,2) not null,
  tax_amount numeric(12,2) default 0 not null,
  total_share numeric(12,2) not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 6. Chat Messages Table
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 7. Settlements Table
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  to_user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12,2) not null,
  is_settled boolean default true not null,
  settled_at timestamptz default timezone('utc'::text, now()) not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- Indexes for High Performance Querying
-- ==============================================================================
create index if not exists idx_room_members_room on public.room_members(room_id);
create index if not exists idx_room_members_user on public.room_members(user_id);
create index if not exists idx_expenses_room on public.expenses(room_id);
create index if not exists idx_expense_splits_expense on public.expense_splits(expense_id);
create index if not exists idx_chat_messages_room on public.chat_messages(room_id, created_at desc);

-- ==============================================================================
-- Membership Security Helper Function
-- ==============================================================================
create or replace function public.is_member_of(_room_id uuid, _user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.room_members
    where room_id = _room_id and user_id = _user_id
  );
$$;

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.chat_messages enable row level security;
alter table public.settlements enable row level security;

-- Profiles: Anyone authenticated can view profiles, users update only their own
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Rooms: Viewable if you are a member or look up by invite code
create policy "Members can view room"
  on public.rooms for select
  to authenticated
  using (public.is_member_of(id, auth.uid()));

create policy "Any authenticated user can create rooms"
  on public.rooms for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Room Members: Viewable by co-members
create policy "Members can view room members"
  on public.room_members for select
  to authenticated
  using (public.is_member_of(room_id, auth.uid()));

create policy "Users can join rooms"
  on public.room_members for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Expenses: Accessible by room members
create policy "Room members can read expenses"
  on public.expenses for select
  to authenticated
  using (public.is_member_of(room_id, auth.uid()));

create policy "Room members can insert expenses"
  on public.expenses for insert
  to authenticated
  with check (public.is_member_of(room_id, auth.uid()));

create policy "Room members can update expenses"
  on public.expenses for update
  to authenticated
  using (public.is_member_of(room_id, auth.uid()));

create policy "Room members can delete expenses"
  on public.expenses for delete
  to authenticated
  using (public.is_member_of(room_id, auth.uid()));

-- Expense Splits
create policy "Room members can read splits"
  on public.expense_splits for select
  to authenticated
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_member_of(e.room_id, auth.uid())
    )
  );

create policy "Room members can insert splits"
  on public.expense_splits for insert
  to authenticated
  with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_member_of(e.room_id, auth.uid())
    )
  );

-- Chat Messages
create policy "Room members can view messages"
  on public.chat_messages for select
  to authenticated
  using (public.is_member_of(room_id, auth.uid()));

create policy "Room members can send messages"
  on public.chat_messages for insert
  to authenticated
  with check (public.is_member_of(room_id, auth.uid()) and auth.uid() = user_id);

-- Settlements
create policy "Room members can view settlements"
  on public.settlements for select
  to authenticated
  using (public.is_member_of(room_id, auth.uid()));

create policy "Room members can record settlements"
  on public.settlements for insert
  to authenticated
  with check (public.is_member_of(room_id, auth.uid()));

-- ==============================================================================
-- Realtime Replication Publication
-- ==============================================================================
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.settlements;
alter publication supabase_realtime add table public.room_members;
