import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { formatPercent } from '../../lib/format'

interface SummaryCardProps {
  label: string
  value: string
  icon: LucideIcon
  valueClassName?: string
  changePct?: number
  /** Whether an increase in this metric is a good or bad thing for the user. */
  increaseIsGood?: boolean
}

export function SummaryCard({
  label,
  value,
  icon: Icon,
  valueClassName = 'text-white',
  changePct,
  increaseIsGood = true,
}: SummaryCardProps) {
  const isIncrease = (changePct ?? 0) >= 0
  const isPositiveChange = isIncrease === increaseIsGood

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-400">{label}</p>
        <Icon size={16} className="text-gray-500" />
      </div>
      <p className={`mt-2 text-2xl font-semibold ${valueClassName}`}>{value}</p>
      {changePct !== undefined && (
        <div
          className={`mt-1 flex items-center gap-0.5 text-xs ${
            isPositiveChange ? 'text-positive' : 'text-negative'
          }`}
        >
          {isIncrease ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{formatPercent(changePct ?? 0)} vs mes anterior</span>
        </div>
      )}
    </div>
  )
}
