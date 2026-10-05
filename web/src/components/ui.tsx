import type { InputHTMLAttributes, ReactNode } from 'react'
import { formatDuration, formatFcfa } from '../lib/format'

export { formatDuration, formatFcfa }

export function Card({
  children,
  className = '',
  interactive,
  featured,
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
  featured?: boolean
}) {
  return (
    <div
      className={`card-surface p-5 ${featured ? 'card-featured' : ''} ${
        interactive ? 'card-interactive' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-800/10 bg-brand-50/50 px-4 py-3 text-sm leading-relaxed text-muted">
      {children}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="eyebrow mb-2">{children}</p>
}

export function InputField({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input-field ${className}`} {...props} />
}

export function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-3">
      <span className="text-sm font-medium text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors ${checked ? 'bg-brand-800' : 'bg-slate-300'}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  )
}
