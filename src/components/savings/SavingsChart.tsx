import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '../../lib/format'
import type { SavingsPoint } from '../../hooks/useSavings'

const LINE_COLOR = '#f2593a'

const RANGES = [
  { value: 1, label: '1M' },
  { value: 3, label: '3M' },
  { value: 6, label: '6M' },
  { value: 12, label: '1A' },
  { value: 0, label: 'Todo' },
] as const

type RangeMonths = (typeof RANGES)[number]['value']

function toTime(date: string) {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

function startOfToday() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

const shortDate = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })
const longDate = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
const compactCurrency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  notation: 'compact',
  maximumFractionDigits: 1,
})

interface SavingsChartProps {
  history: SavingsPoint[]
}

export function SavingsChart({ history }: SavingsChartProps) {
  const [range, setRange] = useState<RangeMonths>(0)

  const data = useMemo(() => {
    const today = startOfToday()
    const points = history.map((p) => ({ t: toTime(p.date), balance: p.balance }))
    const first = points[0]
    const last = points.at(-1)
    if (!first || !last) return []

    // Carry the balance up to today so the line reaches the right edge.
    if (last.t < today) points.push({ t: today, balance: last.balance })

    if (range === 0) return points

    const from = new Date(today)
    from.setMonth(from.getMonth() - range)
    const fromT = from.getTime()
    if (first.t >= fromT) return points

    // Balance as of the range start = last point on or before it.
    const startBalance = points.filter((p) => p.t <= fromT).at(-1)?.balance ?? first.balance
    return [{ t: fromT, balance: startBalance }, ...points.filter((p) => p.t > fromT)]
  }, [history, range])

  return (
    <div className="h-full rounded-2xl bg-surface p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-medium text-white sm:text-lg">Cómo va tu ahorro</h2>
        <div className="flex gap-0.5 rounded-lg bg-bg p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                range === r.value ? 'bg-surface-hover text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {data.length < 2 ? (
        <p className="py-10 text-center text-sm text-gray-500">
          La gráfica aparece en cuanto haya movimientos en tu ahorro.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={LINE_COLOR} stopOpacity={0.25} />
                <stop offset="100%" stopColor={LINE_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#242427" strokeDasharray="3 4" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(t: number) => shortDate.format(t)}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={32}
            />
            <YAxis
              orientation="right"
              width={56}
              tickFormatter={(v: number) => compactCurrency.format(v)}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickCount={4}
              domain={['auto', 'auto']}
            />
            <Tooltip
              cursor={{ stroke: '#4b5563', strokeWidth: 1 }}
              contentStyle={{
                background: '#212124',
                border: '1px solid #242427',
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#f3f4f6' }}
              labelFormatter={(t) => longDate.format(Number(t))}
              formatter={(value) => [formatCurrency(Number(value)), 'Ahorro']}
            />
            <Area
              type="stepAfter"
              dataKey="balance"
              stroke={LINE_COLOR}
              strokeWidth={2}
              fill="url(#savingsFill)"
              activeDot={{ r: 4, stroke: '#19191b', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
