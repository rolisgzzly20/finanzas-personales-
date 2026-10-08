import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { LogOut, Plus, Wallet } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useAuth } from '../../context/AuthContext'
import { useRealtimeTransactions } from '../../hooks/useRealtimeTransactions'
import { AddTransactionSheet } from '../transactions/AddTransactionSheet'

export function ProtectedLayout() {
  const { user, signOut } = useAuth()
  useRealtimeTransactions(user?.id)
  const [adding, setAdding] = useState(false)
  const closeSheet = useCallback(() => setAdding(false), [])

  return (
    <div className="flex min-h-svh bg-bg text-white">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-36 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
        <div className="mb-5 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-white">
              <Wallet size={15} />
            </span>
            <span className="font-semibold">Finanzas</span>
          </div>
          <button
            onClick={() => void signOut()}
            aria-label="Cerrar sesión"
            className="rounded-lg p-2 text-gray-500 hover:text-white"
          >
            <LogOut size={18} />
          </button>
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <Outlet />
        </div>
      </main>

      <button
        onClick={() => setAdding(true)}
        aria-label="Agregar movimiento"
        className="fixed right-5 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-40 flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 transition-transform active:scale-95 lg:right-8 lg:bottom-8"
      >
        <Plus size={26} />
      </button>

      <BottomNav />

      {adding && <AddTransactionSheet onClose={closeSheet} />}
    </div>
  )
}
