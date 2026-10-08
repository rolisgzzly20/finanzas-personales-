import { Trash2 } from 'lucide-react'
import { IconChip } from '../ui/IconChip'
import { getCategoryIcon } from '../../lib/icons'
import { formatCurrency, formatDate } from '../../lib/format'
import { COLORS, INCOME_ICON, TRANSFER_ICON, TYPE_COLORS, TYPE_LABELS } from '../../lib/visuals'
import type { TransactionType } from '../../types/database.types'

interface TransactionRowProps {
  transaction: {
    id: string
    type: TransactionType
    amount: number | string
    date: string
    note: string | null
  }
  category?: { name: string; color: string; icon: string | null }
  accountName: string
  transferAccountName?: string
  onDelete?: () => void
}

export function TransactionRow({ transaction: t, category, accountName, transferAccountName, onDelete }: TransactionRowProps) {
  const title =
    t.type === 'transfer'
      ? `${accountName} → ${transferAccountName ?? '?'}`
      : (category?.name ?? (t.type === 'income' ? 'Ingreso' : 'Sin categoría'))

  const icon =
    t.type === 'transfer' ? TRANSFER_ICON : category ? getCategoryIcon(category.icon) : INCOME_ICON
  const iconColor =
    t.type === 'transfer' ? COLORS.info : (category?.color ?? (t.type === 'income' ? COLORS.positive : COLORS.muted))

  const sign = t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''
  const amountColor = t.type === 'expense' ? 'text-white' : t.type === 'income' ? 'text-positive' : 'text-gray-300'
  const typeColor = TYPE_COLORS[t.type]

  return (
    <div className="flex items-center gap-3 py-3">
      <IconChip icon={icon} color={iconColor} />

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[15px] text-white">{title}</span>
        <span className="truncate text-xs text-gray-500">
          {formatDate(t.date)}
          {t.type !== 'transfer' ? ` · ${accountName}` : ''}
          {t.note ? ` · ${t.note}` : ''}
        </span>
      </div>

      <span
        className="hidden rounded-full px-2.5 py-1 text-xs sm:inline"
        style={{ backgroundColor: `${typeColor}1f`, color: typeColor }}
      >
        {TYPE_LABELS[t.type]}
      </span>

      <span className={`w-24 shrink-0 text-right text-[15px] font-medium ${amountColor}`}>
        {sign}
        {formatCurrency(Number(t.amount))}
      </span>

      {onDelete && (
        <button onClick={onDelete} aria-label="Borrar movimiento" className="-mr-1 p-1 text-gray-600 hover:text-negative">
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}
