import { useAuth } from '../context/AuthContext'

export function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-svh bg-bg p-4 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Finanzas</h1>
        <button
          onClick={() => void signOut()}
          className="rounded-xl border border-border px-3 py-1.5 text-sm text-gray-300 hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>
      <p className="mt-4 text-sm text-gray-400">Sesión iniciada como {user?.email}</p>
      <p className="mt-1 text-sm text-gray-500">El dashboard va aquí (siguiente paso).</p>
    </div>
  )
}
