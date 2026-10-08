import { ArrowLeftRight, Banknote, CreditCard, Landmark, PiggyBank, TrendingUp, type LucideIcon } from 'lucide-react'
import type { AccountType, TransactionType } from '../types/database.types'

export const COLORS = {
  accent: '#f2593a',
  positive: '#22c55e',
  negative: '#ef4444',
  info: '#3b82f6',
  warning: '#f59e0b',
  muted: '#6b7280',
} as const

export const ACCOUNT_VISUALS: Record<AccountType, { icon: LucideIcon; color: string }> = {
  debit: { icon: Landmark, color: COLORS.info },
  credit: { icon: CreditCard, color: COLORS.warning },
  cash: { icon: Banknote, color: COLORS.positive },
  savings: { icon: PiggyBank, color: COLORS.accent },
}

export const TYPE_LABELS: Record<TransactionType, string> = {
  expense: 'Gasto',
  income: 'Ingreso',
  transfer: 'Transferencia',
}

export const TYPE_COLORS: Record<TransactionType, string> = {
  expense: COLORS.negative,
  income: COLORS.positive,
  transfer: COLORS.info,
}

export const TRANSFER_ICON = ArrowLeftRight
export const INCOME_ICON = TrendingUp
