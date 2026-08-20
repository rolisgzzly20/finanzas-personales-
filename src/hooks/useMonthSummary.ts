import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { monthRange, previousMonth } from '../lib/dateRange'
import { useCategories } from './useCategories'

export interface CategorySpending {
  id: string
  name: string
  color: string
  icon: string | null
  amount: number
}

export interface MonthSummary {
  spentThisMonth: number
  spentChangePct: number
  incomeThisMonth: number
  incomeChangePct: number
  savingsChangePct: number
  transactionCount: number
  categorySpending: CategorySpending[]
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}

export function useMonthSummary(year: number, month: number) {
  const { start: startCurrent, end: endCurrent } = monthRange(year, month)
  const prev = previousMonth(year, month)
  const { start: startPrev, end: endPrev } = monthRange(prev.year, prev.month)

  const transactionsQuery = useQuery({
    queryKey: ['transactions-range', startPrev, endCurrent],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, amount, type, date, category_id')
        .gte('date', startPrev)
        .lte('date', endCurrent)
      if (error) throw error
      return data
    },
  })

  const categoriesQuery = useCategories()

  const summary = useMemo<MonthSummary | undefined>(() => {
    const transactions = transactionsQuery.data
    const categories = categoriesQuery.data
    if (!transactions || !categories) return undefined

    const categoryById = new Map(categories.map((c) => [c.id, c]))
    const current = transactions.filter((t) => t.date >= startCurrent && t.date <= endCurrent)
    const prevTx = transactions.filter((t) => t.date >= startPrev && t.date <= endPrev)

    const sumBy = (rows: typeof transactions, type: string) =>
      rows.filter((t) => t.type === type).reduce((sum, t) => sum + Number(t.amount), 0)

    const spentThisMonth = sumBy(current, 'expense')
    const incomeThisMonth = sumBy(current, 'income')
    const spentPrevMonth = sumBy(prevTx, 'expense')
    const incomePrevMonth = sumBy(prevTx, 'income')
    const savingsThisMonth = incomeThisMonth - spentThisMonth
    const savingsPrevMonth = incomePrevMonth - spentPrevMonth

    const categoryTotals = new Map<string, number>()
    for (const t of current) {
      if (t.type !== 'expense' || !t.category_id) continue
      categoryTotals.set(t.category_id, (categoryTotals.get(t.category_id) ?? 0) + Number(t.amount))
    }

    const categorySpending: CategorySpending[] = [...categoryTotals.entries()]
      .map(([categoryId, amount]) => {
        const category = categoryById.get(categoryId)
        return {
          id: categoryId,
          name: category?.name ?? 'Sin categoría',
          color: category?.color ?? '#6b7280',
          icon: category?.icon ?? null,
          amount,
        }
      })
      .sort((a, b) => b.amount - a.amount)

    return {
      spentThisMonth,
      incomeThisMonth,
      spentChangePct: pctChange(spentThisMonth, spentPrevMonth),
      incomeChangePct: pctChange(incomeThisMonth, incomePrevMonth),
      savingsChangePct: pctChange(savingsThisMonth, savingsPrevMonth),
      transactionCount: current.length,
      categorySpending,
    }
  }, [transactionsQuery.data, categoriesQuery.data, startCurrent, endCurrent, startPrev, endPrev])

  return {
    data: summary,
    isLoading: transactionsQuery.isLoading || categoriesQuery.isLoading,
    error: transactionsQuery.error ?? categoriesQuery.error,
  }
}
