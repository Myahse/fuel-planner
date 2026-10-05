import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  backTo,
  right,
  subtitle,
}: {
  title: string
  backTo?: string
  right?: ReactNode
  subtitle?: string
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {backTo && (
          <Link
            to={backTo}
            className="icon-btn mt-0.5 h-10 w-10 shrink-0 text-ink"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.65rem]">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">{subtitle}</p>}
        </div>
      </div>
      {right}
    </header>
  )
}
