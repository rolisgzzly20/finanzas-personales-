-- Personal Finance App — initial schema
-- Tables: profiles, accounts, categories, transactions
-- All tables have Row Level Security enabled with owner-only policies.

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- accounts
-- ============================================================
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('debit', 'credit', 'cash')),
  initial_balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index accounts_user_id_idx on public.accounts (user_id);

alter table public.accounts enable row level security;

create policy "Accounts are viewable by owner"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "Accounts are insertable by owner"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "Accounts are updatable by owner"
  on public.accounts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Accounts are deletable by owner"
  on public.accounts for delete
  using (auth.uid() = user_id);

-- ============================================================
-- categories
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#a3a3a3',
  icon text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index categories_user_id_idx on public.categories (user_id);

alter table public.categories enable row level security;

create policy "Categories are viewable by owner"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Categories are insertable by owner"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Categories are updatable by owner"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Categories are deletable by owner"
  on public.categories for delete
  using (auth.uid() = user_id);

-- Seed a default category set for a user (called after signup from the client,
-- or manually per-user). Kept as a function so the client controls the timing.
create function public.seed_default_categories(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, color, icon)
  values
    (target_user_id, 'Alimentos', '#f59e0b', 'utensils'),
    (target_user_id, 'Gas', '#ef4444', 'fuel'),
    (target_user_id, 'Salidas', '#a855f7', 'party-popper'),
    (target_user_id, 'Gustos', '#ec4899', 'sparkles'),
    (target_user_id, 'Esenciales', '#22c55e', 'shopping-cart'),
    (target_user_id, 'Transporte', '#3b82f6', 'car'),
    (target_user_id, 'Salud', '#14b8a6', 'heart-pulse'),
    (target_user_id, 'Hogar', '#f97316', 'home'),
    (target_user_id, 'Entretenimiento', '#8b5cf6', 'clapperboard'),
    (target_user_id, 'Otros', '#6b7280', 'more-horizontal')
  on conflict (user_id, name) do nothing;
end;
$$;

-- ============================================================
-- transactions
-- ============================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index transactions_user_id_idx on public.transactions (user_id);
create index transactions_account_id_idx on public.transactions (account_id);
create index transactions_category_id_idx on public.transactions (category_id);
create index transactions_date_idx on public.transactions (date);
create index transactions_user_date_idx on public.transactions (user_id, date);

alter table public.transactions enable row level security;

create policy "Transactions are viewable by owner"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Transactions are insertable by owner"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Transactions are updatable by owner"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Transactions are deletable by owner"
  on public.transactions for delete
  using (auth.uid() = user_id);
