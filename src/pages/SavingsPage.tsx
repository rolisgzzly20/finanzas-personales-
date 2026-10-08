import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, PiggyBank, SlidersHorizontal, Trash2, type LucideIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAccountBalances } from '../hooks/useAccountBalances'
import { useCreateSavingsAccount, useSavings } from '../hooks/useSavings'
import { useDeleteTransaction } from '../hooks/useTransactions'
import { SavingsChart } from '../components/savings/SavingsChart'
import { SavingsMoveSheet, type SavingsMoveMode } from '../components/savings/SavingsMoveSheet'
import { errorMessage, formatCurrency, formatDate } from '../lib/format'
import { COLORS } from '../lib/visuals'
import { Card } from '../components/ui/Card'
import { IconChip } from '../components/ui/IconChip'

export function SavingsPage() {
  const { account, movements, history, change30d, isLoading } = useSavings()
  const { data: accounts } = useAccountBalances()
  const deleteTransaction = useDeleteTransaction()
  const [mode, setMode] = useState<SavingsMoveMode | null>(null)
  const closeSheet = useCallback(() => setMode(null), [])

  const accountName = useMemo(() => new Map((accounts ?? []).map((a) => [a.account_id, a.name])), [accounts])

  if (isLoading) {
    return <p className="text-sm text-gray-400">Cargando…</p>
  }

  if (!account) {
    return <SavingsSetup />
  }

  const balance = Number(account.balance)

  const actions: { mode: SavingsMoveMode; label: string; icon: LucideIcon }[] = [
    { mode: 'deposit', label: 'Depositar', icon: ArrowDownLeft },
    { mode: 'withdraw', label: 'Retirar', icon: ArrowUpRight },
    { mode: 'adjust', label: 'Ajustar', icon: SlidersHorizontal },
  ]

  const MOVEMENT_VISUALS = {
    deposit: { icon: ArrowDownLeft, color: COLORS.positive },
    withdrawal: { icon: ArrowUpRight, color: COLORS.negative },
    adjustment: { icon: SlidersHorizontal, color: COLORS.warning },
  } as const

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Ahorro</h1>
        <p className="text-sm text-gray-500">Dinero apartado, fuera de tu total disponible</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="flex flex-col rounded-2xl bg-surface p-5 lg:col-span-4">
          <div className="flex items-start justify-between">
            <p className="text-[15px] text-gray-300">Ahorro total</p>
            <IconChip icon={PiggyBank} color={COLORS.warning} size="sm" />
          </div>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-white">{formatCurrency(balance)}</p>
          {change30d !== 0 ? (
            <p className={`mt-1.5 text-xs ${change30d > 0 ? 'text-positive' : 'text-negative'}`}>
              {change30d > 0 ? '+' : '-'}
              {formatCurrency(Math.abs(change30d))}
              <span className="text-gray-500"> en los últimos 30 días</span>
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-gray-500">Sin cambios en los últimos 30 días</p>
          )}

          <div className="mt-6 grid grid-cols-3 gap-2 lg:mt-auto lg:pt-6">
            {actions.map(({ mode: m, label, icon: Icon }) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  m === 'deposit'
                    ? 'bg-accent text-white hover:bg-accent/90'
                    : 'bg-surface-hover text-gray-200 hover:text-white'
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </div>
        </section>

        <div className="lg:col-span-8">
          <SavingsChart history={history} />
        </div>
      </div>

      <Card title="Movimientos del ahorro">
        {movements.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">Aún no hay movimientos. Empieza con un depósito.</p>
        ) : (
          <div className="-my-3 divide-y divide-border">
            {movements.map((m) => {
              const visual = MOVEMENT_VISUALS[m.kind]
              const title =
                m.kind === 'deposit'
                  ? `Depósito desde ${accountName.get(m.otherAccountId ?? '') ?? '?'}`
                  : m.kind === 'withdrawal'
                    ? `Retiro a ${accountName.get(m.otherAccountId ?? '') ?? '?'}`
                    : 'Ajuste de saldo'
              return (
                <div key={m.id} className="flex items-center gap-3 py-3">
                  <IconChip icon={visual.icon} color={visual.color} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] text-white">{title}</span>
                    <span className="truncate text-xs text-gray-500">
                      {formatDate(m.date)}
                      {m.note && m.note !== 'Ajuste de saldo' ? ` · ${m.note}` : ''}
                    </span>
                  </div>
                  <span className={`text-[15px] font-medium ${m.delta > 0 ? 'text-positive' : 'text-white'}`}>
                    {m.delta > 0 ? '+' : '-'}
                    {formatCurrency(Math.abs(m.delta))}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm('¿Borrar este movimiento?')) deleteTransaction.mutate(m.id)
                    }}
                    aria-label="Borrar movimiento"
                    className="-mr-1 p-1 text-gray-600 hover:text-negative"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {mode && (
        <SavingsMoveSheet
          mode={mode}
          savingsAccountId={account.account_id}
          currentBalance={balance}
          onClose={closeSheet}
        />
      )}
    </>
  )
}

function SavingsSetup() {
  const { user } = useAuth()
  const createAccount = useCreateSavingsAccount()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const value = amount === '' ? 0 : Number(amount.replace(',', '.'))
    if (!Number.isFinite(value) || value < 0) return setError('Escribe un monto válido.')
    if (!user) return setError('Tu sesión expiró. Vuelve a iniciar sesión.')

    try {
      await createAccount.mutateAsync({ userId: user.id, initialBalance: value })
    } catch (err) {
      const message = errorMessage(err, '')
      setError(
        message.includes('accounts_type_check')
          ? 'Falta aplicar el cambio de base de datos en Supabase (migración 00000000000004_savings.sql).'
          : message || 'No se pudo crear. Intenta de nuevo.',
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl bg-surface p-5">
      <div className="flex items-center gap-2">
        <IconChip icon={PiggyBank} color={COLORS.warning} size="sm" />
        <h1 className="text-base font-semibold text-white">Configura tu ahorro</h1>
      </div>
      <p className="text-sm text-gray-400">
        Tu ahorro es dinero aparte: no cuenta en "Total disponible". Después podrás depositar, retirar o ajustar el
        saldo cuando quieras.
      </p>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-400">¿Cuánto tienes ahorrado hoy?</span>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-bg px-3 focus-within:ring-1 focus-within:ring-accent/60">
          <span className="text-2xl text-gray-500">$</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
            className="w-full bg-transparent py-3 text-3xl font-semibold text-white focus:outline-none"
          />
        </div>
      </label>
      {error && <p className="text-sm text-negative">{error}</p>}
      <button
        type="submit"
        disabled={createAccount.isPending}
        className="rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
      >
        {createAccount.isPending ? 'Creando…' : 'Empezar'}
      </button>
    </form>
  )
}
