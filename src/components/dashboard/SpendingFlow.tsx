import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency, formatMonthLabel } from '../../lib/format'
import type { CategorySpending, NoteSpending } from '../../hooks/useMonthSummary'

const BAR_W = 8
const CAT_GAP = 10
const CAT_MIN_H = 30
const NOTE_GAP = 6
const NOTE_MIN_H = 42
const MAX_NOTES = 4
const SPENT_COLOR = '#e5e7eb'

interface SpendingFlowProps {
  year: number
  month: number
  categories: CategorySpending[]
  categoryNotes: Record<string, NoteSpending[]>
  income: number
}

/** Ribbon between two vertical spans, with S-curved edges. */
function ribbon(x0: number, y0top: number, y0bot: number, x1: number, y1top: number, y1bot: number) {
  const xm = (x0 + x1) / 2
  return [
    `M ${x0} ${y0top}`,
    `C ${xm} ${y0top}, ${xm} ${y1top}, ${x1} ${y1top}`,
    `L ${x1} ${y1bot}`,
    `C ${xm} ${y1bot}, ${xm} ${y0bot}, ${x0} ${y0bot}`,
    'Z',
  ].join(' ')
}

type CatNode = CategorySpending & { y: number; h: number; spentY: number }
type NoteNode = NoteSpending & { y: number; h: number; srcY: number; srcH: number }

function layoutFlow(
  width: number,
  height: number,
  categories: CategorySpending[],
  selected: CategorySpending | undefined,
  notes: NoteSpending[],
) {
  const n = categories.length
  const total = categories.reduce((sum, c) => sum + c.amount, 0)
  const spentX = Math.round(width * 0.2)
  const catX = Math.round(width * 0.58)
  const noteX = width - BAR_W

  // Every category gets a minimum height so its label fits; the rest is proportional.
  const spentH = height - CAT_GAP * Math.max(0, n - 1)
  const perPeso = total > 0 ? (spentH - n * CAT_MIN_H) / total : 0
  const spentTop = (height - spentH) / 2

  const catNodes: CatNode[] = []
  let catY = 0
  let spentY = spentTop
  for (const c of categories) {
    const h = CAT_MIN_H + c.amount * perPeso
    catNodes.push({ ...c, y: catY, h, spentY })
    catY += h + CAT_GAP
    spentY += h
  }

  const noteNodes: NoteNode[] = []
  const selectedNode = catNodes.find((c) => c.id === selected?.id)
  if (selectedNode && selected) {
    let srcY = selectedNode.y
    let blockH = NOTE_GAP * Math.max(0, notes.length - 1)
    for (const note of notes) {
      const srcH = (note.amount / selected.amount) * selectedNode.h
      const h = Math.max(NOTE_MIN_H, srcH)
      noteNodes.push({ ...note, srcY, srcH, h, y: 0 })
      srcY += srcH
      blockH += h
    }
    // Center the notes on their category, kept inside the chart.
    let y = Math.min(Math.max(0, selectedNode.y + selectedNode.h / 2 - blockH / 2), height - blockH)
    for (const node of noteNodes) {
      node.y = y
      y += node.h + NOTE_GAP
    }
  }

  return { spentX, catX, noteX, spentTop, spentH, catNodes, noteNodes }
}

/**
 * Sankey-style flow: total spent → categories → what the selected category
 * was spent on (grouped by note). Click a category to drill into it.
 */
export function SpendingFlow({ year, month, categories, categoryNotes, income }: SpendingFlowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [pickedId, setPickedId] = useState<string | null>(null)

  const isEmpty = categories.length === 0
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0))
    observer.observe(el)
    return () => observer.disconnect()
    // The container only exists when there's data, so re-attach when that changes.
  }, [isEmpty])

  const total = categories.reduce((sum, c) => sum + c.amount, 0)
  const selected = categories.find((c) => c.id === pickedId) ?? categories[0]

  // Notes of the selected category: the biggest few, the rest folded into "Otros".
  const allNotes = selected ? (categoryNotes[selected.id] ?? []) : []
  const notes =
    allNotes.length > MAX_NOTES + 1
      ? [
          ...allNotes.slice(0, MAX_NOTES),
          { label: 'Otros', amount: allNotes.slice(MAX_NOTES).reduce((s, n) => s + n.amount, 0) },
        ]
      : allNotes

  const n = categories.length
  // Tall enough for every category label and every note label.
  const height = Math.max(340, n * 48, notes.length * (NOTE_MIN_H + NOTE_GAP) + 140)
  const { spentX, catX, noteX, spentTop, spentH, catNodes, noteNodes } = layoutFlow(
    width,
    height,
    categories,
    selected,
    notes,
  )
  const selectedNode = catNodes.find((c) => c.id === selected?.id)

  const labelClass = 'pointer-events-none absolute -translate-x-full -translate-y-1/2 rounded-lg bg-black/55 px-2 py-1 text-right leading-tight backdrop-blur-sm'

  return (
    <section className="rounded-2xl bg-surface p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold tracking-[0.14em] text-gray-400 uppercase">
          {formatMonthLabel(year, month)} · Flujo
        </h2>
        <span className="text-sm text-gray-500">
          {income > 0 ? (
            <>
              Ingresos <span className="text-positive">{formatCurrency(income)}</span>
            </>
          ) : (
            'sin ingresos aún'
          )}
        </span>
      </div>

      {isEmpty ? (
        <p className="py-16 text-center text-sm text-gray-500">Aún no hay gastos este mes.</p>
      ) : (
        <div ref={containerRef} className="relative" style={{ height }}>
          {width > 0 && (
            <>
              <svg width={width} height={height} className="absolute inset-0 overflow-visible">
                {catNodes.map((c) => {
                  const isSelected = c.id === selected?.id
                  return (
                    <g key={c.id} className="cursor-pointer" onClick={() => setPickedId(c.id)}>
                      <path
                        d={ribbon(spentX + BAR_W, c.spentY, c.spentY + c.h, catX, c.y, c.y + c.h)}
                        fill={c.color}
                        fillOpacity={isSelected ? 0.4 : 0.2}
                        className="transition-[fill-opacity] duration-200"
                      />
                      <rect x={catX} y={c.y} width={BAR_W} height={c.h} rx={3} fill={c.color} />
                    </g>
                  )
                })}

                {selectedNode &&
                  noteNodes.map((note) => (
                    <g key={note.label}>
                      <path
                        d={ribbon(catX + BAR_W, note.srcY, note.srcY + note.srcH, noteX, note.y, note.y + note.h)}
                        fill={selectedNode.color}
                        fillOpacity={0.4}
                      />
                      <rect x={noteX} y={note.y} width={BAR_W} height={note.h} rx={3} fill={selectedNode.color} />
                    </g>
                  ))}

                <rect x={spentX} y={spentTop} width={BAR_W} height={spentH} rx={3} fill={SPENT_COLOR} />
              </svg>

              <div className={labelClass} style={{ left: spentX - 6, top: height / 2 }}>
                <p className="text-xs text-gray-300">Gastado</p>
                <p className="text-sm font-semibold text-white">{formatCurrency(total)}</p>
              </div>

              {catNodes.map((c) => (
                <div
                  key={c.id}
                  className={`${labelClass} ${c.id === selected?.id ? 'ring-1 ring-white/30' : ''}`}
                  style={{ left: catX - 6, top: c.y + c.h / 2 }}
                >
                  <p className="text-xs text-gray-300">{c.name}</p>
                  <p className="text-sm font-semibold text-white">{formatCurrency(c.amount)}</p>
                </div>
              ))}

              {noteNodes.map((note) => (
                <div key={note.label} className={labelClass} style={{ left: noteX - 6, top: note.y + note.h / 2 }}>
                  <p className="max-w-24 truncate text-xs text-gray-300">{note.label}</p>
                  <p className="text-sm font-semibold text-white">{formatCurrency(note.amount)}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {selected && (
        <p className="mt-5 text-sm leading-relaxed text-gray-400 sm:text-[15px]">
          <span className="font-semibold text-white">
            {selected.name} {formatCurrency(selected.amount)}
          </span>
          {notes.map((note) => (
            <span key={note.label}>
              {' · '}
              {note.label} {formatCurrency(note.amount)}
            </span>
          ))}{' '}
          <Link
            to={`/movimientos?categoria=${selected.id}`}
            className="whitespace-nowrap text-accent hover:underline"
          >
            Ver movimientos →
          </Link>
        </p>
      )}
    </section>
  )
}
