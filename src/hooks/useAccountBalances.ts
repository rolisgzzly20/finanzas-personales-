import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export function useAccountBalances() {
  return useQuery({
    queryKey: ['account-balances'],
    queryFn: async () => {
      const { data, error } = await supabase.from('account_balances').select('*').order('name')
      if (error) throw error
      return data
    },
  })
}

export interface BalanceTarget {
  accountId: string
  /** The account's initial_balance today. */
  initialBalance: number
  /** Its computed balance today. */
  currentBalance: number
  /** The balance it should show. */
  targetBalance: number
}

/**
 * Sets accounts to their real balances by shifting initial_balance by the
 * difference, so the transaction history and monthly totals stay untouched.
 */
export function useSetAccountBalances() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (targets: BalanceTarget[]) => {
      for (const t of targets) {
        const { error } = await supabase
          .from('accounts')
          .update({ initial_balance: t.initialBalance + (t.targetBalance - t.currentBalance) })
          .eq('id', t.accountId)
        if (error) throw error
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['account-balances'] })
    },
  })
}
