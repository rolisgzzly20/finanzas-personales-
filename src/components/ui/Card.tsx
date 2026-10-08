import type { ReactNode } from 'react'

interface CardProps {
  title?: ReactNode
  action?: ReactNode
  className?: string
  children: ReactNode
}

export function Card({ title, action, className = '', children }: CardProps) {
  return (
    <section className={`rounded-2xl bg-surface p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-medium text-white sm:text-lg">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
