import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAccountBalances } from '../../hooks/useAccountBalances'
import { useCategories } from '../../hooks/useCategories'
import { useAddTransaction } from '../../hooks/useTransactions'
import { getCategoryIcon } from '../../lib/icons'
import { errorMessage } from '../../lib/format'
import { todayLocal } from '../../lib/dateRange'
import type { TransactionType } from '../../types/database.types'

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
  { value: 'transfer', label: 'Transferencia' },
]

interface AddTransactionSheetProps {
  onClose: () => void
}

export function AddTransactionSheet({ onClose }: AddTransactionSheetProps) {
  const { user } = useAuth()
  const { data: accounts } = useAccountBalances()
  const { data: categories } = useCategories()
  const addTransaction = useAddTransaction()

  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [pickedAccountId, setAccountId] = useState<string | null>(null)
  const [transferAccountId, setTransferAccountId] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [date, setDate] = useState(todayLocal)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const amountRef = useRef<HTMLInputElement>(null)

  // Savings only moves through transfers; gastos/ingresos come from spendable accounts.
  const sourceAccounts = (accounts ?? []).filter((a) => type === 'transfer' || a.type !== 'savings')

  // Until the user picks one, default to the debit account.
  const accountId =
    (sourceAccounts.some((a) => a.account_id === pickedAccountId) ? pickedAccountId : null) ??
    (sourceAccounts.find((a) => a.type === 'debit') ?? sourceAccounts[0])?.account_id ??
    null

  useEffect(() => {
    amountRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function selectType(next: TransactionType) {
    setType(next)
    setError(null)
    if (next === 'transfer') setCategoryId(null)
    else setTransferAccountId(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const value = Number(amount.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) return setError('Escribe un monto mayor a 0.')
    if (!accountId) return setError('Elige una cuenta.')
    if (type === 'expense' && !categoryId) return setError('Elige una categoría.')
    if (type === 'transfer') {
      if (!transferAccountId) return setError('Elige la cuenta destino.')
      if (transferAccountId === accountId) return setError('La cuenta origen y destino no pueden ser la misma.')
    }
    if (!user) return setError('Tu sesión expiró. Vuelve a iniciar sesión.')

    try {
      await addTransaction.mutateAsync({
        user_id: user.id,
        type,
        amount: value,
        account_id: accountId,
        transfer_account_id: type === 'transfer' ? transferAccountId : null,
        category_id: type === 'transfer' ? null : categoryId,
        date,
        note: note.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar. Intenta de nuevo.'))
    }
  }

  const chip = (selected: boolean) =>
    `rounded-xl px-3 py-2 text-sm transition-colors ${
      selected ? 'bg-accent/15 text-accent ring-1 ring-accent/50' : 'bg-surface-hover text-gray-300 hover:text-white'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[92svh] w-full max-w-md flex-col gap-5 overflow-y-auto rounded-t-3xl border border-border bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Nuevo movimiento</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-bg p-1">
          {TYPE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => selectType(o.value)}
              className={`rounded-lg py-2 text-sm transition-colors ${
                type === o.value ? 'bg-surface-hover text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-400">Monto</span>
          <div className="flex items-center gap-1 rounded-xl border border-border bg-bg px-3 focus-within:ring-1 focus-within:ring-accent/60">
            <span className="text-2xl text-gray-500">$</span>
            <input
              ref={amountRef}
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
              className={`w-full bg-transparent py-3 text-3xl font-semibold focus:outline-none ${
                type === 'expense' ? 'text-negative' : type === 'income' ? 'text-positive' : 'text-white'
              }`}
            />
          </div>
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs text-gray-400">{type === 'transfer' ? 'Desde' : 'Cuenta'}</legend>
          <div className="flex flex-wrap gap-2">
            {sourceAccounts.map((a) => (
              <button
                key={a.account_id}
                type="button"
                onClick={() => setAccountId(a.account_id)}
                className={chip(accountId === a.account_id)}
              >
                {a.name}
              </button>
            ))}
          </div>
        </fieldset>

        {type === 'transfer' ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs text-gray-400">Hacia</legend>
            <div className="flex flex-wrap gap-2">
              {(accounts ?? [])
                .filter((a) => a.account_id !== accountId)
                .map((a) => (
                  <button
                    key={a.account_id}
                    type="button"
                    onClick={() => setTransferAccountId(a.account_id)}
                    className={chip(transferAccountId === a.account_id)}
                  >
                    {a.name}
                  </button>
                ))}
            </div>
          </fieldset>
        ) : (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs text-gray-400">
              Categoría{type === 'income' ? ' (opcional)' : ''}
            </legend>
            <div className="flex flex-wrap gap-2">
              {(categories ?? []).map((c) => {
                const Icon = getCategoryIcon(c.icon)
                const selected = categoryId === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(selected ? null : c.id)}
                    className={`flex items-center gap-1.5 ${chip(selected)}`}
                  >
                    <Icon size={14} style={{ color: selected ? undefined : c.color }} />
                    {c.name}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Fecha</span>
            <input
              type="date"
              value={date}
              max={todayLocal()}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-border bg-bg px-3 py-2.5 text-base text-gray-200 focus:outline-none focus:ring-1 focus:ring-accent/60"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Nota (opcional)</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Oxxo"
              className="rounded-xl border border-border bg-bg px-3 py-2.5 text-base text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-accent/60"
            />
          </label>
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}

        <button
          type="submit"
          disabled={addTransaction.isPending}
          className="rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {addTransaction.isPending ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
