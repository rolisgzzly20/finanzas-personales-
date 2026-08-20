import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

/**
 * Subscribes to changes on the user's transactions (e.g. inserted by the
 * Shortcut via the add-transaction Edge Function) and invalidates the
 * queries that depend on them, so the app updates itself without a reload.
 */
export function useRealtimeTransactions(userId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`transactions-changes-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['transactions-range'] })
          void queryClient.invalidateQueries({ queryKey: ['transactions'] })
          void queryClient.invalidateQueries({ queryKey: ['account-balances'] })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}
