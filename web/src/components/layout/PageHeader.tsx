import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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
    <header className="mb-6 pt-2 lg:pt-0">
      <div className="flex items-center justify-between gap-3">
        {backTo ? (
          <Link to={backTo} className="icon-btn h-11 w-11 shrink-0" aria-label="Go back">
            <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
          </Link>
        ) : (
          <span />
        )}
        {right}
      </div>
      <h1 className="title mt-5 text-[1.9rem] text-fg sm:text-[2.2rem]">{title}</h1>
      {subtitle && <p className="mt-2 max-w-md text-[15px] leading-relaxed text-fg-2">{subtitle}</p>}
    </header>
  )
}
