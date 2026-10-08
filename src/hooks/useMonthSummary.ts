import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { monthRange, previousMonth } from '../lib/dateRange'
import { useCategories } from './useCategories'
import { useAccountBalances } from './useAccountBalances'

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
  transactionCount: number
  categorySpending: CategorySpending[]
  /** Expenses per category, grouped by note (e.g. "Oxxo"), biggest first. */
  categoryNotes: Record<string, NoteSpending[]>
  /** Expense total per day of the month; index 0 is day 1. */
  dailySpending: number[]
}

export interface NoteSpending {
  label: string
  amount: number
}

// Groups "oxxo", "OXXO " and "Óxxo" together.
function noteKey(note: string) {
  return note
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}

export function useMonthSummary(year: number, month: number) {
  const { end: endCurrent } = monthRange(year, month)
  const prev = previousMonth(year, month)
  const { start: startPrev } = monthRange(prev.year, prev.month)

  const transactionsQuery = useQuery({
    queryKey: ['transactions-range', startPrev, endCurrent],
    // Keep showing the previous month while the next one loads.
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, account_id, amount, type, date, category_id, note')
        .gte('date', startPrev)
        .lte('date', endCurrent)
      if (error) throw error
      // Tag rows with their month: with placeholderData they can outlive the
      // year/month args while the next month loads.
      return { rows: data, year, month }
    },
  })

  const categoriesQuery = useCategories()
  const accountsQuery = useAccountBalances()

  const summary = useMemo<MonthSummary | undefined>(() => {
    const categories = categoriesQuery.data
    const accounts = accountsQuery.data
    if (!transactionsQuery.data || !categories || !accounts) return undefined
    const { rows, year, month } = transactionsQuery.data
    const { start: startCurrent, end: endCurrent } = monthRange(year, month)
    const prev = previousMonth(year, month)
    const { start: startPrev, end: endPrev } = monthRange(prev.year, prev.month)

    // Income/expense rows on a savings account are balance adjustments, not
    // real income or spending.
    const savingsIds = new Set(accounts.filter((a) => a.type === 'savings').map((a) => a.account_id))
    const transactions = rows.filter((t) => !savingsIds.has(t.account_id))

    const categoryById = new Map(categories.map((c) => [c.id, c]))
    const current = transactions.filter((t) => t.date >= startCurrent && t.date <= endCurrent)
    const prevTx = transactions.filter((t) => t.date >= startPrev && t.date <= endPrev)

    const sumBy = (rows: typeof transactions, type: string) =>
      rows.filter((t) => t.type === type).reduce((sum, t) => sum + Number(t.amount), 0)

    const spentThisMonth = sumBy(current, 'expense')
    const incomeThisMonth = sumBy(current, 'income')
    const spentPrevMonth = sumBy(prevTx, 'expense')
    const incomePrevMonth = sumBy(prevTx, 'income')

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

    const notesByCategory = new Map<string, Map<string, NoteSpending>>()
    for (const t of current) {
      if (t.type !== 'expense' || !t.category_id) continue
      const raw = t.note?.trim() || 'Sin nota'
      const key = noteKey(raw)
      const notes = notesByCategory.get(t.category_id) ?? new Map<string, NoteSpending>()
      const entry = notes.get(key) ?? { label: raw.charAt(0).toUpperCase() + raw.slice(1), amount: 0 }
      entry.amount += Number(t.amount)
      notes.set(key, entry)
      notesByCategory.set(t.category_id, notes)
    }
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const dailySpending = Array.from({ length: daysInMonth }, () => 0)
    for (const t of current) {
      if (t.type !== 'expense') continue
      const day = Number(t.date.slice(8, 10))
      dailySpending[day - 1] = (dailySpending[day - 1] ?? 0) + Number(t.amount)
    }

    const categoryNotes = Object.fromEntries(
      [...notesByCategory].map(([id, notes]) => [id, [...notes.values()].sort((a, b) => b.amount - a.amount)]),
    )

    return {
      spentThisMonth,
      incomeThisMonth,
      spentChangePct: pctChange(spentThisMonth, spentPrevMonth),
      incomeChangePct: pctChange(incomeThisMonth, incomePrevMonth),
      transactionCount: current.length,
      categorySpending,
      categoryNotes,
      dailySpending,
    }
  }, [transactionsQuery.data, categoriesQuery.data, accountsQuery.data])

  return {
    data: summary,
    isLoading: transactionsQuery.isLoading || categoriesQuery.isLoading || accountsQuery.isLoading,
    error: transactionsQuery.error ?? categoriesQuery.error,
  }
}
