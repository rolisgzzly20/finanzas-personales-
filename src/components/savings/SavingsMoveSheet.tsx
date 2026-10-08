import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAccountBalances } from '../../hooks/useAccountBalances'
import { useAddTransaction } from '../../hooks/useTransactions'
import { errorMessage, formatCurrency } from '../../lib/format'
import { todayLocal } from '../../lib/dateRange'

export type SavingsMoveMode = 'deposit' | 'withdraw' | 'adjust'

const TITLES: Record<SavingsMoveMode, string> = {
  deposit: 'Depositar al ahorro',
  withdraw: 'Retirar del ahorro',
  adjust: 'Ajustar saldo',
}

interface SavingsMoveSheetProps {
  mode: SavingsMoveMode
  savingsAccountId: string
  currentBalance: number
  onClose: () => void
}

export function SavingsMoveSheet({ mode, savingsAccountId, currentBalance, onClose }: SavingsMoveSheetProps) {
  const { user } = useAuth()
  const { data: accounts } = useAccountBalances()
  const addTransaction = useAddTransaction()

  const spendable = (accounts ?? []).filter((a) => a.type !== 'savings')
  const [pickedAccountId, setAccountId] = useState<string | null>(null)
  const accountId =
    pickedAccountId ?? (spendable.find((a) => a.type === 'debit') ?? spendable[0])?.account_id ?? null

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayLocal)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const amountRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    amountRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const value = Number(amount.replace(',', '.'))
  const adjustDiff = mode === 'adjust' && amount !== '' && Number.isFinite(value) ? value - currentBalance : 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!user) return setError('Tu sesión expiró. Vuelve a iniciar sesión.')

    if (mode === 'adjust') {
      if (amount === '' || !Number.isFinite(value) || value < 0) return setError('Escribe el saldo actual de tu ahorro.')
      if (adjustDiff === 0) return onClose()
    } else {
      if (!Number.isFinite(value) || value <= 0) return setError('Escribe un monto mayor a 0.')
      if (!accountId) return setError('Elige una cuenta.')
      if (mode === 'withdraw' && value > currentBalance)
        return setError(`Solo tienes ${formatCurrency(currentBalance)} en tu ahorro.`)
    }

    const base = { user_id: user.id, category_id: null, date, note: note.trim() || null }
    const tx =
      mode === 'deposit'
        ? { ...base, type: 'transfer' as const, amount: value, account_id: accountId!, transfer_account_id: savingsAccountId }
        : mode === 'withdraw'
          ? { ...base, type: 'transfer' as const, amount: value, account_id: savingsAccountId, transfer_account_id: accountId! }
          : {
              ...base,
              type: adjustDiff > 0 ? ('income' as const) : ('expense' as const),
              amount: Math.abs(adjustDiff),
              account_id: savingsAccountId,
              transfer_account_id: null,
              note: note.trim() || 'Ajuste de saldo',
            }

    try {
      await addTransaction.mutateAsync(tx)
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
          <h2 className="text-base font-semibold text-white">{TITLES[mode]}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-400">
            {mode === 'adjust' ? `¿Cuánto tienes ahorrado hoy? (ahora: ${formatCurrency(currentBalance)})` : 'Monto'}
          </span>
          <div className="flex items-center gap-1 rounded-xl border border-border bg-bg px-3 focus-within:ring-1 focus-within:ring-accent/60">
            <span className="text-2xl text-gray-500">$</span>
            <input
              ref={amountRef}
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
              className="w-full bg-transparent py-3 text-3xl font-semibold text-white focus:outline-none"
            />
          </div>
          {mode === 'adjust' && adjustDiff !== 0 && (
            <span className={`text-xs ${adjustDiff > 0 ? 'text-positive' : 'text-negative'}`}>
              {adjustDiff > 0 ? '+' : '-'}
              {formatCurrency(Math.abs(adjustDiff))} respecto a lo registrado
            </span>
          )}
        </label>

        {mode !== 'adjust' && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs text-gray-400">{mode === 'deposit' ? 'Desde' : 'Hacia'}</legend>
            <div className="flex flex-wrap gap-2">
              {spendable.map((a) => (
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
              placeholder={mode === 'adjust' ? 'Ej. Rendimientos' : 'Ej. Quincena'}
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
