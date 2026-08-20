import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMonthLabel } from '../../lib/format'

interface DashboardHeaderProps {
  year: number
  month: number
  transactionCount: number
  onPrevMonth: () => void
  onNextMonth: () => void
}

export function DashboardHeader({
  year,
  month,
  transactionCount,
  onPrevMonth,
  onNextMonth,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-white">Finanzas</h1>
        <p className="text-xs text-gray-500">{transactionCount} transacciones sincronizadas</p>
      </div>

      <div className="flex items-center gap-1 rounded-xl border border-border bg-surface px-2 py-1.5">
        <button
          onClick={onPrevMonth}
          aria-label="Mes anterior"
          className="rounded-lg p-1 text-gray-400 hover:bg-surface-hover hover:text-white"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[110px] text-center text-sm text-gray-200">
          {formatMonthLabel(year, month)}
        </span>
        <button
          onClick={onNextMonth}
          aria-label="Mes siguiente"
          className="rounded-lg p-1 text-gray-400 hover:bg-surface-hover hover:text-white"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
