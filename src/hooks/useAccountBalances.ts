import { useQuery } from '@tanstack/react-query'
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
