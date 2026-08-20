import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MockCategorySpending } from '../../lib/mockData'
import { formatCurrency } from '../../lib/format'

interface CategorySpendingChartProps {
  data: MockCategorySpending[]
}

export function CategorySpendingChart({ data }: CategorySpendingChartProps) {
  const sorted = [...data].sort((a, b) => b.amount - a.amount)

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-4 text-sm font-medium text-gray-300">Gastos por categoría</h2>
      <ResponsiveContainer width="100%" height={sorted.length * 40}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
          barCategoryGap={10}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={{
              background: '#1c1c25',
              border: '1px solid #26262f',
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: '#f3f4f6' }}
            formatter={(value) => [formatCurrency(Number(value)), 'Gasto']}
          />
          <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={18}>
            {sorted.map((entry) => (
              <Cell key={entry.id} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
