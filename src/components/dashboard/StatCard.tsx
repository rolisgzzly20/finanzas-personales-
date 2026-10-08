import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { IconChip } from '../ui/IconChip'
import { formatPercent } from '../../lib/format'

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  color: string
  valueClassName?: string
  /** % change vs the previous month. */
  changePct?: number
  /** Whether an increase in this metric is good for the user. */
  increaseIsGood?: boolean
  /** Shown in the footer when there's no change percentage. */
  caption?: ReactNode
}

export function StatCard({
  label,
  value,
  icon,
  color,
  valueClassName = 'text-white',
  changePct,
  increaseIsGood = true,
  caption,
}: StatCardProps) {
  const isIncrease = (changePct ?? 0) >= 0
  const good = isIncrease === increaseIsGood

  return (
    <div className="flex h-full flex-col rounded-2xl bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-300 sm:text-[15px]">{label}</p>
        <IconChip icon={icon} color={color} size="sm" />
      </div>
      <p className={`mt-2 text-2xl font-medium tracking-tight sm:text-[28px] ${valueClassName}`}>{value}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs">
        {changePct !== undefined ? (
          <>
            <span className={`flex items-center gap-0.5 ${good ? 'text-positive' : 'text-negative'}`}>
              {isIncrease ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {formatPercent(Math.abs(changePct)).replace('+', '')}
            </span>
            <span className="text-gray-500">vs. mes anterior</span>
          </>
        ) : (
          <span className="text-gray-500">{caption}</span>
        )}
      </div>
    </div>
  )
}
