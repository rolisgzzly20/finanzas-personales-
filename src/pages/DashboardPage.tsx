import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { StatCard } from '../components/dashboard/StatCard'
import { DailySpendingChart } from '../components/dashboard/DailySpendingChart'
import { SpendingFlow } from '../components/dashboard/SpendingFlow'
import { useAccountBalances } from '../hooks/useAccountBalances'
import { useMonthSummary } from '../hooks/useMonthSummary'
import { useSavings } from '../hooks/useSavings'
import { formatCurrency } from '../lib/format'
import { COLORS } from '../lib/visuals'

export function DashboardPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const { data: accountBalances, isLoading: accountsLoading } = useAccountBalances()
  const { data: summary, isLoading: summaryLoading } = useMonthSummary(year, month)
  const savings = useSavings()

  function goToPrevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function goToNextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  if (accountsLoading || summaryLoading || !summary) {
    return <p className="text-sm text-gray-400">Cargando…</p>
  }

  // Savings is money set aside, so it's not part of what's available to spend.
  const spendable = (accountBalances ?? []).filter((a) => a.type !== 'savings')
  const totalAvailable = spendable.reduce((sum, a) => sum + Number(a.balance), 0)

  return (
    <>
      <DashboardHeader
        year={year}
        month={month}
        transactionCount={summary.transactionCount}
        onPrevMonth={goToPrevMonth}
        onNextMonth={goToNextMonth}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total disponible"
          value={formatCurrency(totalAvailable)}
          icon={Wallet}
          color={COLORS.positive}
          caption={`En ${spendable.length} cuentas`}
        />
        <StatCard
          label="Gastado"
          value={formatCurrency(summary.spentThisMonth)}
          icon={TrendingDown}
          color={COLORS.negative}
          changePct={summary.spentChangePct}
          increaseIsGood={false}
        />
        <StatCard
          label="Ingresos"
          value={formatCurrency(summary.incomeThisMonth)}
          icon={TrendingUp}
          color={COLORS.info}
          changePct={summary.incomeChangePct}
        />
        <Link to="/ahorro" className="rounded-2xl transition-opacity hover:opacity-85">
          <StatCard
            label="Ahorro"
            value={savings.account ? formatCurrency(Number(savings.account.balance)) : 'Configurar'}
            icon={PiggyBank}
            color={COLORS.warning}
            valueClassName={savings.account ? 'text-white' : 'text-gray-500'}
            caption={
              savings.account && savings.change30d !== 0 ? (
                <span className={savings.change30d > 0 ? 'text-positive' : 'text-negative'}>
                  {savings.change30d > 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(savings.change30d))}
                  <span className="text-gray-500"> en 30 días</span>
                </span>
              ) : (
                'Ver detalle'
              )
            }
          />
        </Link>
      </div>

      <SpendingFlow
        year={year}
        month={month}
        categories={summary.categorySpending}
        categoryNotes={summary.categoryNotes}
        income={summary.incomeThisMonth}
      />

      <DailySpendingChart year={year} month={month} daily={summary.dailySpending} />
    </>
  )
}
