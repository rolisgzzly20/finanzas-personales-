import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useTransactions, useDeleteTransaction } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useAccountBalances } from '../hooks/useAccountBalances'
import { formatCurrency, formatDate } from '../lib/format'
import type { TransactionType } from '../types/database.types'

type TypeFilter = 'all' | TransactionType

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Gastos' },
  { value: 'transfer', label: 'Transferencias' },
]

export function TransactionsPage() {
  const { data: transactions, isLoading: transactionsLoading } = useTransactions()
  const { data: categories } = useCategories()
  const { data: accounts } = useAccountBalances()
  const deleteTransaction = useDeleteTransaction()

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [accountFilter, setAccountFilter] = useState<string>('all')

  const categoryById = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories])
  const accountById = useMemo(() => new Map((accounts ?? []).map((a) => [a.account_id, a])), [accounts])

  const filtered = useMemo(() => {
    if (!transactions) return []
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (categoryFilter !== 'all' && t.category_id !== categoryFilter) return false
      if (accountFilter !== 'all' && t.account_id !== accountFilter && t.transfer_account_id !== accountFilter)
        return false
      return true
    })
  }, [transactions, typeFilter, categoryFilter, accountFilter])

  function selectType(type: TypeFilter) {
    setTypeFilter(type)
    if (type === 'transfer') setCategoryFilter('all')
  }

  if (transactionsLoading) {
    return <p className="text-sm text-gray-400">Cargando…</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-white">Movimientos</h1>

      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => selectType(f.value)}
            className={`rounded-xl px-3 py-1.5 text-sm transition-colors ${
              typeFilter === f.value
                ? 'bg-white text-black'
                : 'border border-border bg-surface text-gray-300 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {typeFilter !== 'transfer' && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-500"
          >
            <option value="all">Todas las categorías</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-500"
        >
          <option value="all">Todas las cuentas</option>
          {(accounts ?? []).map((a) => (
            <option key={a.account_id} value={a.account_id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
        {filtered.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">No hay movimientos con estos filtros.</p>
        )}
        {filtered.map((t) => {
          const category = t.category_id ? categoryById.get(t.category_id) : undefined
          const account = accountById.get(t.account_id)
          const transferAccount = t.transfer_account_id ? accountById.get(t.transfer_account_id) : undefined

          const amountColor =
            t.type === 'expense' ? 'text-negative' : t.type === 'income' ? 'text-positive' : 'text-white'
          const sign = t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''

          return (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex flex-col">
                <span className="text-sm text-white">
                  {t.type === 'transfer'
                    ? `${account?.name ?? '?'} → ${transferAccount?.name ?? '?'}`
                    : (category?.name ?? 'Sin categoría')}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(t.date)} · {account?.name ?? '?'}
                  {t.note ? ` · ${t.note}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${amountColor}`}>
                  {sign}
                  {formatCurrency(Number(t.amount))}
                </span>
                <button
                  onClick={() => {
                    if (confirm('¿Borrar este movimiento?')) {
                      deleteTransaction.mutate(t.id)
                    }
                  }}
                  aria-label="Borrar movimiento"
                  className="text-gray-600 hover:text-negative"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
