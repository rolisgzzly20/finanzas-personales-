function toISODate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function monthRange(year: number, month: number) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return { start: toISODate(start), end: toISODate(end) }
}

export function previousMonth(year: number, month: number) {
  const d = new Date(year, month - 1, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}
