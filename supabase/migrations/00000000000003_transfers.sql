-- Adds transfer support to transactions, hardens RLS so a row can only
-- reference accounts/categories the same user owns, updates the balance
-- view to handle both legs of a transfer, and enables Realtime so inserts
-- from outside the app (e.g. the Shortcut -> Edge Function path) show up
-- live in the client.

-- ============================================================
-- transfer_account_id: destination account, only set for type = 'transfer'
-- ============================================================
alter table public.transactions
  drop constraint transactions_type_check,
  add constraint transactions_type_check check (type in ('income', 'expense', 'transfer'));

alter table public.transactions
  add column transfer_account_id uuid references public.accounts (id) on delete cascade;

alter table public.transactions
  add constraint transactions_transfer_account_check check (
    (type = 'transfer' and transfer_account_id is not null and transfer_account_id <> account_id)
    or (type <> 'transfer' and transfer_account_id is null)
  );

create index transactions_transfer_account_id_idx on public.transactions (transfer_account_id);

-- ============================================================
-- Harden insert/update policies: account_id, transfer_account_id, and
-- category_id must belong to the same user_id as the row. This mostly
-- matters for future direct client inserts — the Edge Function used by
-- the Shortcut runs as service_role and bypasses RLS, so it re-validates
-- ownership itself before inserting.
-- ============================================================
drop policy "Transactions are insertable by owner" on public.transactions;
drop policy "Transactions are updatable by owner" on public.transactions;

create policy "Transactions are insertable by owner"
  on public.transactions for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
    and (transfer_account_id is null or exists (
      select 1 from public.accounts a where a.id = transfer_account_id and a.user_id = auth.uid()
    ))
    and (category_id is null or exists (
      select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid()
    ))
  );

create policy "Transactions are updatable by owner"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
    and (transfer_account_id is null or exists (
      select 1 from public.accounts a where a.id = transfer_account_id and a.user_id = auth.uid()
    ))
    and (category_id is null or exists (
      select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid()
    ))
  );

-- ============================================================
-- account_balances: rebuilt to account for both legs of a transfer
-- (subtract from the source account, add to the destination account).
-- ============================================================
drop view public.account_balances;

create view public.account_balances as
with legs as (
  select account_id, user_id,
    case
      when type = 'income' then amount
      when type = 'expense' then -amount
      when type = 'transfer' then -amount
    end as delta
  from public.transactions
  union all
  select transfer_account_id as account_id, user_id, amount as delta
  from public.transactions
  where type = 'transfer'
)
select
  a.id as account_id,
  a.user_id,
  a.name,
  a.type,
  a.initial_balance,
  a.initial_balance + coalesce(sum(l.delta), 0) as balance
from public.accounts a
left join legs l on l.account_id = a.id
group by a.id;

alter view public.account_balances set (security_invoker = on);

-- ============================================================
-- Realtime: let clients subscribe to postgres_changes on transactions so
-- the app updates itself when a row is inserted from outside the app.
-- REPLICA IDENTITY FULL is required for UPDATE/DELETE events — without it,
-- Postgres only includes primary-key columns in the old row, which isn't
-- enough for Realtime to evaluate a `user_id=eq.<id>` filter on those
-- events (INSERT is unaffected since it filters on the new row instead).
-- ============================================================
alter table public.transactions replica identity full;
alter publication supabase_realtime add table public.transactions;
