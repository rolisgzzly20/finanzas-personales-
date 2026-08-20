export interface MockCategorySpending {
  id: string
  name: string
  color: string
  icon: string
  amount: number
}

export interface MockMonthSummary {
  totalAvailable: number
  spentThisMonth: number
  spentChangePct: number
  incomeThisMonth: number
  incomeChangePct: number
  savingsChangePct: number
  transactionCount: number
  categorySpending: MockCategorySpending[]
}

export const MOCK_MONTH_SUMMARY: MockMonthSummary = {
  totalAvailable: 48250,
  spentThisMonth: 18430,
  spentChangePct: 12.4,
  incomeThisMonth: 32000,
  incomeChangePct: 4.1,
  savingsChangePct: -8.2,
  transactionCount: 47,
  categorySpending: [
    { id: '1', name: 'Esenciales', color: '#22c55e', icon: 'shopping-cart', amount: 5200 },
    { id: '2', name: 'Alimentos', color: '#f59e0b', icon: 'utensils', amount: 4380 },
    { id: '3', name: 'Salidas', color: '#a855f7', icon: 'party-popper', amount: 2950 },
    { id: '4', name: 'Gas', color: '#ef4444', icon: 'fuel', amount: 2100 },
    { id: '5', name: 'Entretenimiento', color: '#8b5cf6', icon: 'clapperboard', amount: 1500 },
    { id: '6', name: 'Gustos', color: '#ec4899', icon: 'sparkles', amount: 1300 },
    { id: '7', name: 'Transporte', color: '#3b82f6', icon: 'car', amount: 700 },
    { id: '8', name: 'Salud', color: '#14b8a6', icon: 'heart-pulse', amount: 300 },
  ],
}
