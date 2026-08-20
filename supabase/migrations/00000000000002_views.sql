-- Computed view for current account balances.
-- Views inherit RLS from their underlying tables only when queried through
-- PostgREST as the authenticated user, so this is safe to expose directly.
create view public.account_balances as
select
  a.id as account_id,
  a.user_id,
  a.name,
  a.type,
  a.initial_balance
    + coalesce(sum(case when t.type = 'income' then t.amount else -t.amount end), 0)
    as balance
from public.accounts a
left join public.transactions t on t.account_id = a.id
group by a.id;

alter view public.account_balances set (security_invoker = on);
