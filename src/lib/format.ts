const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount)
}

export function formatPercent(pct: number) {
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function formatMonthLabel(year: number, month: number) {
  return `${MONTH_LABELS[month]} ${year}`
}

export function formatDate(dateStr: string) {
  const parts = dateStr.split('-')
  const y = Number(parts[0])
  const m = Number(parts[1])
  const d = Number(parts[2])
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export { MONTH_LABELS }
