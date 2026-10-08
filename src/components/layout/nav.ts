import { ArrowLeftRight, LayoutGrid, PiggyBank, type LucideIcon } from 'lucide-react'

export const NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid },
  { to: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { to: '/ahorro', label: 'Ahorro', icon: PiggyBank },
]
