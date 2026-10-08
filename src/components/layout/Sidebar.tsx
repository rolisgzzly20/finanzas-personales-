import { NavLink } from 'react-router-dom'
import { LogOut, Wallet } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { NAV_ITEMS } from './nav'

export function Sidebar() {
  const { signOut } = useAuth()

  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col bg-panel px-4 py-8 lg:flex">
      <div className="mb-10 flex items-center gap-2.5 px-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-white">
          <Wallet size={17} />
        </span>
        <span className="text-lg font-semibold text-white">Finanzas</span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors ${
                isActive ? 'bg-surface-hover text-accent' : 'text-gray-300 hover:bg-surface hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => void signOut()}
        className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-gray-400 transition-colors hover:bg-surface hover:text-white"
      >
        <LogOut size={18} />
        Cerrar sesión
      </button>
    </aside>
  )
}
