import { Outlet } from 'react-router-dom'
import { NavTabs } from './NavTabs'
import { useAuth } from '../../context/AuthContext'
import { useRealtimeTransactions } from '../../hooks/useRealtimeTransactions'

export function ProtectedLayout() {
  const { user } = useAuth()
  useRealtimeTransactions(user?.id)

  return (
    <div className="min-h-svh bg-bg p-4 pb-10 text-white sm:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <NavTabs />
        <Outlet />
      </div>
    </div>
  )
}
