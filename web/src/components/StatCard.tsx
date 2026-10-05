import type { ReactNode } from 'react'

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: ReactNode
}) {
  return (
    <div className="card-surface p-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-brand-700">{icon}</span>}
        <p className="eyebrow">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
    </div>
  )
}
