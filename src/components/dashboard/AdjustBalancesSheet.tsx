import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { useAccountBalances, useSetAccountBalances } from '../../hooks/useAccountBalances'
import { IconChip } from '../ui/IconChip'
import { errorMessage, formatCurrency } from '../../lib/format'
import { ACCOUNT_VISUALS } from '../../lib/visuals'

interface AdjustBalancesSheetProps {
  onClose: () => void
}

function parseAmount(value: string) {
  const n = Number(value.replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

/**
 * Lets the user type what each spendable account really has today. Credit
 * cards are entered as the amount owed (positive) and stored as negative.
 */
export function AdjustBalancesSheet({ onClose }: AdjustBalancesSheetProps) {
  const { data: accounts } = useAccountBalances()
  const setBalances = useSetAccountBalances()
  const spendable = (accounts ?? []).filter((a) => a.type !== 'savings')

  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Balance each account would end up with: the typed value, or unchanged.
  function targetFor(a: (typeof spendable)[number]) {
    const raw = values[a.account_id]
    const typed = raw === undefined || raw === '' ? null : parseAmount(raw)
    if (typed === null) return Number(a.balance)
    return a.type === 'credit' ? -Math.abs(typed) : typed
  }

  const newTotal = spendable.reduce((sum, a) => sum + targetFor(a), 0)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const invalid = spendable.find((a) => {
      const raw = values[a.account_id]
      return raw !== undefined && raw !== '' && parseAmount(raw) === null
    })
    if (invalid) return setError(`Revisa el monto de ${invalid.name}.`)

    const targets = spendable
      .map((a) => ({
        accountId: a.account_id,
        initialBalance: Number(a.initial_balance),
        currentBalance: Number(a.balance),
        targetBalance: targetFor(a),
      }))
      .filter((t) => t.targetBalance !== t.currentBalance)

    if (targets.length === 0) return onClose()

    try {
      await setBalances.mutateAsync(targets)
      onClose()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar. Intenta de nuevo.'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[92svh] w-full max-w-md flex-col gap-5 overflow-y-auto rounded-t-3xl border border-border bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Ajustar saldos reales</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <p className="-mt-2 text-sm text-gray-400">
          Escribe cuánto tienes hoy en cada cuenta. Tus movimientos no se borran; solo se corrige el punto de partida.
        </p>

        <div className="flex flex-col gap-3">
          {spendable.map((a) => {
            const visual = ACCOUNT_VISUALS[a.type]
            const isCredit = a.type === 'credit'
            const current = Number(a.balance)
            return (
              <label key={a.account_id} className="flex items-center gap-3">
                <IconChip icon={visual.icon} color={visual.color} shape="square" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] text-white">{a.name}</p>
                  <p className="text-xs text-gray-500">
                    {isCredit ? 'Debes ahora' : 'Ahora'}: {formatCurrency(isCredit ? Math.abs(current) : current)}
                  </p>
                </div>
                <div className="flex w-36 items-center gap-1 rounded-xl border border-border bg-bg px-3 focus-within:ring-1 focus-within:ring-accent/60">
                  <span className="text-gray-500">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={String(Math.round(isCredit ? Math.abs(current) : current))}
                    value={values[a.account_id] ?? ''}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [a.account_id]: e.target.value.replace(/[^\d.,-]/g, '') }))
                    }
                    className="w-full bg-transparent py-2.5 text-right text-base font-medium text-white placeholder:text-gray-600 focus:outline-none"
                  />
                </div>
              </label>
            )
          })}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-surface-hover px-4 py-3">
          <span className="text-sm text-gray-300">Nuevo total disponible</span>
          <span className={`text-lg font-semibold ${newTotal < 0 ? 'text-negative' : 'text-white'}`}>
            {formatCurrency(newTotal)}
          </span>
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}

        <button
          type="submit"
          disabled={setBalances.isPending}
          className="rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {setBalances.isPending ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
