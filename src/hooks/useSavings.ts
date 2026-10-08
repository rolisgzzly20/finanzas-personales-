import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAccountBalances } from './useAccountBalances'
import { toISODate } from '../lib/dateRange'
import { useTransactions } from './useTransactions'

export interface SavingsMovement {
  id: string
  date: string
  created_at: string
  /** Signed change to the savings balance. */
  delta: number
  kind: 'deposit' | 'withdrawal' | 'adjustment'
  /** The other account in a transfer. */
  otherAccountId: string | null
  note: string | null
}

export interface SavingsPoint {
  date: string
  balance: number
}

/**
 * The user's savings account (type 'savings'), its movements, and the balance
 * history used by the chart. Transfers in/out are deposits/withdrawals;
 * income/expense rows on the account are balance adjustments.
 */
export function useSavings() {
  const balancesQuery = useAccountBalances()
  const transactionsQuery = useTransactions()
  const account = balancesQuery.data?.find((a) => a.type === 'savings')

  // account_balances doesn't expose created_at, which marks where the history starts.
  const createdQuery = useQuery({
    queryKey: ['account-created', account?.account_id],
    enabled: !!account,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('created_at')
        .eq('id', account!.account_id)
        .single()
      if (error) throw error
      return data.created_at.slice(0, 10)
    },
  })

  const derived = useMemo(() => {
    if (!account || !transactionsQuery.data) return undefined
    const id = account.account_id

    const movements: SavingsMovement[] = []
    for (const t of transactionsQuery.data) {
      const amount = Number(t.amount)
      const base = { id: t.id, date: t.date, created_at: t.created_at, note: t.note }
      if (t.type === 'transfer' && t.transfer_account_id === id) {
        movements.push({ ...base, delta: amount, kind: 'deposit', otherAccountId: t.account_id })
      } else if (t.type === 'transfer' && t.account_id === id) {
        movements.push({ ...base, delta: -amount, kind: 'withdrawal', otherAccountId: t.transfer_account_id })
      } else if (t.account_id === id) {
        const delta = t.type === 'income' ? amount : -amount
        movements.push({ ...base, delta, kind: 'adjustment', otherAccountId: null })
      }
    }
    // useTransactions returns newest first; history is built oldest first.
    const chronological = [...movements].reverse()

    const startDate = [createdQuery.data, chronological[0]?.date]
      .filter((d): d is string => !!d)
      .sort()[0]

    const history: SavingsPoint[] = []
    let running = Number(account.initial_balance)
    if (startDate) history.push({ date: startDate, balance: running })
    for (const m of chronological) {
      running += m.delta
      const last = history[history.length - 1]
      if (last && last.date === m.date) last.balance = running
      else history.push({ date: m.date, balance: running })
    }

    // Change over the last 30 days.
    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)
    const monthAgoStr = toISODate(monthAgo)
    const balanceMonthAgo =
      history.filter((p) => p.date <= monthAgoStr).at(-1)?.balance ?? history[0]?.balance ?? running
    const change30d = running - balanceMonthAgo

    return { movements, history, change30d }
  }, [account, transactionsQuery.data, createdQuery.data])

  return {
    account,
    movements: derived?.movements ?? [],
    history: derived?.history ?? [],
    change30d: derived?.change30d ?? 0,
    isLoading: balancesQuery.isLoading || transactionsQuery.isLoading || (!!account && createdQuery.isLoading),
  }
}

export function useCreateSavingsAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, initialBalance }: { userId: string; initialBalance: number }) => {
      const { error } = await supabase
        .from('accounts')
        .insert({ user_id: userId, name: 'Ahorro', type: 'savings', initial_balance: initialBalance })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['account-balances'] })
    },
  })
}
