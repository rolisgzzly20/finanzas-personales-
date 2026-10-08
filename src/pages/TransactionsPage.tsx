import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTransactions, useDeleteTransaction } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useAccountBalances } from '../hooks/useAccountBalances'
import { Card } from '../components/ui/Card'
import { TransactionRow } from '../components/transactions/TransactionRow'
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
  // The dashboard's flow chart links here with ?categoria=<id>.
  const [searchParams] = useSearchParams()
  const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get('categoria') ?? 'all')
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

  const selectClass =
    'rounded-xl bg-surface px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-accent/60'

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Movimientos</h1>
        <p className="text-sm text-gray-500">{filtered.length} {filtered.length === 1 ? 'movimiento' : 'movimientos'}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => selectType(f.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              typeFilter === f.value
                ? 'bg-accent/15 text-accent'
                : 'bg-surface text-gray-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {typeFilter !== 'transfer' && (
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectClass}>
            <option value="all">Todas las categorías</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className={selectClass}>
          <option value="all">Todas las cuentas</option>
          {(accounts ?? []).map((a) => (
            <option key={a.account_id} value={a.account_id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">No hay movimientos con estos filtros.</p>
        ) : (
          <div className="-my-3 divide-y divide-border">
            {filtered.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                category={t.category_id ? categoryById.get(t.category_id) : undefined}
                accountName={accountById.get(t.account_id)?.name ?? '?'}
                transferAccountName={t.transfer_account_id ? accountById.get(t.transfer_account_id)?.name : undefined}
                onDelete={() => {
                  if (confirm('¿Borrar este movimiento?')) deleteTransaction.mutate(t.id)
                }}
              />
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
