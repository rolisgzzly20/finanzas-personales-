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
    { id: '1', name: 'Comida', color: '#f59e0b', icon: 'utensils', amount: 5800 },
    { id: '2', name: 'Salidas', color: '#a855f7', icon: 'party-popper', amount: 4200 },
    { id: '3', name: 'Gasolina', color: '#f97316', icon: 'fuel', amount: 3100 },
    { id: '4', name: 'Hobbies', color: '#22c55e', icon: 'gamepad-2', amount: 2450 },
    { id: '5', name: 'Gustos', color: '#ec4899', icon: 'sparkles', amount: 1880 },
    { id: '6', name: 'Otros', color: '#6b7280', icon: 'more-horizontal', amount: 1000 },
  ],
}
