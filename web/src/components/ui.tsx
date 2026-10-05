import type { InputHTMLAttributes, ReactNode } from 'react'
import { formatDuration, formatFcfa } from '../lib/format'

export { formatDuration, formatFcfa }

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="border-l-2 border-signal/60 py-1 pl-4 text-sm leading-relaxed text-fg-2">{children}</div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="field-label">{children}</p>
}

/** Key–value rows separated by hairlines, for receipts and summaries. */
export function SpecList({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map(([k, v], i) => (
        <div key={i} className="flex items-baseline justify-between gap-4 py-3 text-sm">
          <dt className="text-fg-3">{k}</dt>
          <dd className="text-right font-medium text-fg">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function InputField({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`field ${className}`} {...props} />
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
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-sm font-medium text-fg">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-sm border transition-colors ${
          checked ? 'border-signal bg-signal/20' : 'border-line-strong bg-panel-2'
        }`}
      >
        <span
          className={`absolute top-0.5 h-[18px] w-[18px] rounded-xs transition-all ${
            checked ? 'left-[22px] bg-signal' : 'left-0.5 bg-fg-3'
          }`}
        />
      </button>
    </div>
  )
}
