import { useState } from 'react'
import { PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { SummaryCard } from '../components/dashboard/SummaryCard'
import { CategorySpendingChart } from '../components/dashboard/CategorySpendingChart'
import { useAccountBalances } from '../hooks/useAccountBalances'
import { useMonthSummary } from '../hooks/useMonthSummary'
import { formatCurrency } from '../lib/format'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const { data: accountBalances, isLoading: accountsLoading } = useAccountBalances()
  const { data: summary, isLoading: summaryLoading } = useMonthSummary(year, month)

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

  const totalAvailable = (accountBalances ?? []).reduce((sum, a) => sum + Number(a.balance), 0)
  const savingsThisMonth = summary.incomeThisMonth - summary.spentThisMonth

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
        <SummaryCard label="Total disponible" value={formatCurrency(totalAvailable)} icon={Wallet} />
        <SummaryCard
          label="Gastado este mes"
          value={formatCurrency(summary.spentThisMonth)}
          icon={TrendingDown}
          valueClassName="text-negative"
          changePct={summary.spentChangePct}
          increaseIsGood={false}
        />
        <SummaryCard
          label="Ingresos del mes"
          value={formatCurrency(summary.incomeThisMonth)}
          icon={TrendingUp}
          valueClassName="text-positive"
          changePct={summary.incomeChangePct}
          increaseIsGood={true}
        />
        <SummaryCard
          label="Ahorro del mes"
          value={formatCurrency(savingsThisMonth)}
          icon={PiggyBank}
          valueClassName={savingsThisMonth >= 0 ? 'text-positive' : 'text-negative'}
          changePct={summary.savingsChangePct}
          increaseIsGood={true}
        />
      </div>

      <CategorySpendingChart data={summary.categorySpending} />

      <button
        onClick={() => void signOut()}
        className="self-start text-xs text-gray-500 hover:text-gray-300"
      >
        Cerrar sesión ({user?.email})
      </button>
    </>
  )
}
