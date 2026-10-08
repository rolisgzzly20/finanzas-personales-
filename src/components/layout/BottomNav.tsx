import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './nav'

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-gray-500'
              }`
            }
          >
            <Icon size={21} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
