import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Dashboard' },
  { to: '/movimientos', label: 'Movimientos' },
]

export function NavTabs() {
  return (
    <nav className="flex gap-1 rounded-xl border border-border bg-surface p-1">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex-1 rounded-lg px-3 py-1.5 text-center text-sm transition-colors ${
              isActive ? 'bg-surface-hover text-white' : 'text-gray-400 hover:text-white'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
