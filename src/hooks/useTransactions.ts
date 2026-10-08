import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { TransactionType } from '../types/database.types'

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, account_id, transfer_account_id, category_id, amount, type, date, note, created_at')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export interface NewTransaction {
  user_id: string
  type: TransactionType
  amount: number
  account_id: string
  transfer_account_id: string | null
  category_id: string | null
  date: string
  note: string | null
}

export function useAddTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tx: NewTransaction) => {
      const { error } = await supabase.from('transactions').insert(tx)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['transactions-range'] })
      void queryClient.invalidateQueries({ queryKey: ['account-balances'] })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['transactions-range'] })
      void queryClient.invalidateQueries({ queryKey: ['account-balances'] })
    },
  })
}
