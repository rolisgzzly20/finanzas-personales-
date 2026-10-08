-- Adds a 'savings' account type. The app treats a savings account as money
-- set aside: it is excluded from "Total disponible" and from monthly
-- income/spending, and money moves in and out of it through transfers.
-- Income/expense rows on a savings account are balance adjustments.

alter table public.accounts
  drop constraint accounts_type_check,
  add constraint accounts_type_check check (type in ('debit', 'credit', 'cash', 'savings'));
