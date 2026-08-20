import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

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
