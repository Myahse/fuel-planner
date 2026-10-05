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
    <div className="flex flex-col items-start border border-dashed border-line-strong px-6 py-10 rounded-md">
      {icon && <div className="mb-4 text-fg-3">{icon}</div>}
      <h3 className="title text-2xl text-fg">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-fg-2">{description}</p>}
      {actionLabel && onAction && (
        <PrimaryButton className="mt-6" size="md" onClick={onAction}>
          {actionLabel}
        </PrimaryButton>
      )}
    </div>
  )
}
