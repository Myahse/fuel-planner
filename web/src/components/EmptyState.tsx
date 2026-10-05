import type { ReactNode } from 'react'
import { PrimaryButton } from './buttons/PrimaryButton'

type Props = {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: Props) {
  return (
    <div className="card-surface flex flex-col items-center px-6 py-12 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl text-brand-800">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {actionLabel && onAction && (
        <PrimaryButton className="mt-6" size="md" onClick={onAction}>{actionLabel}</PrimaryButton>
      )}
    </div>
  )
}
