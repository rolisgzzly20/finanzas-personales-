import { useState } from 'react'
import { Card } from '../ui/Card'
import { formatCurrency } from '../../lib/format'

const ROWS = 10
const NICE_STEPS = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000]

const compact = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const dayLabel = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })

interface DailySpendingChartProps {
  year: number
  month: number
  daily: number[]
}

/**
 * Dot-matrix column chart: one column per day, each dot worth `step` pesos.
 * Hover (or tap) a column to see that day's total.
 */
export function DailySpendingChart({ year, month, daily }: DailySpendingChartProps) {
  const max = Math.max(0, ...daily)
  const step = NICE_STEPS.find((s) => s * ROWS >= max) ?? Math.ceil(max / ROWS)
  const dotsFor = (amount: number) => (amount > 0 ? Math.min(ROWS, Math.max(1, Math.round(amount / step))) : 0)

  // Default to today if there was spending today, else the biggest day.
  const now = new Date()
  const today = now.getFullYear() === year && now.getMonth() === month ? now.getDate() - 1 : -1
  const defaultDay = today >= 0 && (daily[today] ?? 0) > 0 ? today : daily.indexOf(max)
  const [active, setActive] = useState<number | null>(null)
  const activeDay = active ?? defaultDay

  const n = daily.length
  const activeAmount = daily[activeDay] ?? 0
  const activeDots = Math.max(1, dotsFor(activeAmount))
  const xLabels = new Set([0, 4, 9, 14, 19, 24, n - 1])

  // Keep the tooltip inside the chart near the edges.
  const tooltipShift = activeDay < 4 ? '0%' : activeDay > n - 5 ? '-100%' : '-50%'

  return (
    <Card
      title="Gasto diario"
      action={<span className="text-sm text-gray-400">Cada punto ≈ {formatCurrency(step)}</span>}
      className="h-full"
    >
      {max === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">Aún no hay gastos este mes.</p>
      ) : (
        <div className="flex gap-2 sm:gap-3">
          <div className="flex flex-col justify-between pb-6 text-right text-[11px] text-gray-500 sm:text-xs">
            <span>{compact.format(step * ROWS)}</span>
            <span>{compact.format((step * ROWS) / 2)}</span>
            <span>$0</span>
          </div>

          <div className="relative min-w-0 flex-1">
            <div className="relative pt-12" onPointerLeave={() => setActive(null)}>
              <div
                className="pointer-events-none absolute z-10 rounded-lg border border-border bg-surface-hover px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg"
                style={{
                  left: `${((activeDay + 0.5) / n) * 100}%`,
                  bottom: `calc(${(activeDots / ROWS) * 100}% - ${(activeDots / ROWS) * 3}rem + 0.5rem)`,
                  transform: `translateX(${tooltipShift})`,
                }}
              >
                <p className="text-gray-400">{dayLabel.format(new Date(year, month, activeDay + 1))}</p>
                <p className="font-medium text-white">{formatCurrency(activeAmount)}</p>
              </div>

              <div className="grid gap-[2px] sm:gap-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
                {daily.map((amount, i) => {
                  const dots = dotsFor(amount)
                  const isActive = i === activeDay
                  return (
                    <button
                      key={i}
                      type="button"
                      onPointerEnter={() => setActive(i)}
                      onClick={() => setActive(i)}
                      aria-label={`${i + 1}: ${formatCurrency(amount)}`}
                      className="flex flex-col-reverse items-center gap-[2px] sm:gap-1"
                    >
                      {Array.from({ length: ROWS }, (_, r) => {
                        const filled = r < dots || (r === 0 && dots === 0)
                        return (
                          <span
                            key={r}
                            className="aspect-square w-full max-w-3 rounded-full transition-colors"
                            style={{
                              backgroundColor: !filled
                                ? 'transparent'
                                : isActive && dots > 0
                                  ? 'var(--color-accent)'
                                  : dots === 0
                                    ? '#2a2a2e'
                                    : '#45454c',
                            }}
                          />
                        )
                      })}
                    </button>
                  )
                })}
              </div>
            </div>

            <div
              className="mt-2 grid h-4 text-[11px] text-gray-500 sm:text-xs"
              style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
            >
              {daily.map((_, i) => (
                <span key={i} className={`text-center ${i === activeDay ? 'text-accent' : ''}`}>
                  {xLabels.has(i) ? i + 1 : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
