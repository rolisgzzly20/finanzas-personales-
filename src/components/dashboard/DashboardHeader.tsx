import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMonthLabel } from '../../lib/format'

interface DashboardHeaderProps {
  year: number
  month: number
  transactionCount: number
  onPrevMonth: () => void
  onNextMonth: () => void
}

export function DashboardHeader({ year, month, transactionCount, onPrevMonth, onNextMonth }: DashboardHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Dashboard</h1>
        <p className="text-sm text-gray-500">{transactionCount} {transactionCount === 1 ? 'movimiento' : 'movimientos'} este mes</p>
      </div>

      <div className="flex items-center gap-1 rounded-xl bg-surface p-1">
        <button
          onClick={onPrevMonth}
          aria-label="Mes anterior"
          className="rounded-lg p-1.5 text-gray-400 hover:bg-surface-hover hover:text-white"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[120px] text-center text-sm text-gray-200">{formatMonthLabel(year, month)}</span>
        <button
          onClick={onNextMonth}
          aria-label="Mes siguiente"
          className="rounded-lg p-1.5 text-gray-400 hover:bg-surface-hover hover:text-white"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
